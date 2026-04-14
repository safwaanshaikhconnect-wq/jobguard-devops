from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from analyzer import analyze_job_posting, reanalyze_with_evidence
import re
import os

app = FastAPI(
    title="JobGuard API",
    description="Fake job detection backend powered by AI analysis",
    version="1.0.0",
)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobInput(BaseModel):
    job_text: Optional[str] = ""
    job_url: Optional[str] = ""

class ReanalyzeInput(BaseModel):
    job_text: str
    job_url: str
    evidence: Dict[str, str]
    # Keep original metadata for the final dossier view
    company_name: Optional[str] = "Unknown"
    job_title: Optional[str] = "Not Specified"
    salary: Optional[str] = "N/A"
    location: Optional[str] = "N/A"
    contact_email: Optional[str] = "N/A"

class Check(BaseModel):
    name: str
    status: str
    detail: str

class AnalysisResponse(BaseModel):
    verdict: str
    fraud_score: int
    company_name: Optional[str] = "Unknown"
    job_title: Optional[str] = "Not Specified"
    salary: Optional[str] = "N/A"
    location: Optional[str] = "N/A"
    contact_email: Optional[str] = "N/A"
    checks: List[Check]
    red_flags: List[str]
    green_flags: List[str]
    summary: str

class SearchInput(BaseModel):
    query: str

def extract_url_from_text(text: str) -> Optional[str]:
    url_pattern = r'(https?://[^\s,]+|www\.[^\s,]+\.[a-z]{2,})'
    match = re.search(url_pattern, text)
    if match:
        url = match.group(1)
        if not url.startswith('http'):
            url = 'https://' + url
        return url
    return None

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_job(job: JobInput):
    import asyncio
    from checks.whois_check import check_domain_age
    from checks.pincode_check import check_pincode
    from checks.mca_check import check_mca
    from checks.vt_check import check_url_safety
    from checks.hf_check import check_job_scam_hf
    from checks.dns_check import check_email_mx

    ai_result = await analyze_job_posting(job.job_text, job.job_url)

    target_url = job.job_url
    if not target_url or target_url == "N/A":
        found_url = extract_url_from_text(job.job_text)
        if found_url:
            target_url = found_url

    extracted_company = ai_result.company_name if ai_result.company_name else "UNKNOWN_ENTITY"
    extracted_email = ai_result.contact_email if ai_result.contact_email else ""
    
    results = await asyncio.gather(
        check_domain_age(target_url),
        check_pincode(job.job_text),
        check_mca(extracted_company),
        check_url_safety(target_url),
        check_job_scam_hf(job.job_text),
        check_email_mx(extracted_email)
    )
    
    domain_res, pincode_res, mca_res, vt_res, hf_res, dns_res = results

    real_checks = [
        Check(
            name="Primary AI Pattern Analysis",
            status="fail" if ai_result.fraud_score > 60 else "pass",
            detail=ai_result.summary,
        ),
        Check(**hf_res),
        Check(**vt_res),
        Check(**dns_res),
        Check(**domain_res),
        Check(**pincode_res),
        Check(**mca_res),
    ]

    return AnalysisResponse(
        verdict=ai_result.verdict,
        fraud_score=ai_result.fraud_score,
        company_name=ai_result.company_name or "Unknown",
        job_title=ai_result.job_title or "Not Specified",
        salary=ai_result.salary or "N/A",
        location=ai_result.location or "N/A",
        contact_email=ai_result.contact_email or "HIDDEN",
        checks=real_checks,
        red_flags=ai_result.red_flags,
        green_flags=ai_result.green_flags,
        summary=ai_result.summary,
    )

@app.post("/reanalyze", response_model=AnalysisResponse)
async def reanalyze_job(input_data: ReanalyzeInput):
    ai_result = await reanalyze_with_evidence(
        input_data.job_text, 
        input_data.job_url, 
        input_data.evidence
    )
    
    final_checks = [
        Check(
            name="Forensic Evidence Analysis",
            status="pass" if ai_result.verdict == "SAFE" else "fail",
            detail=ai_result.summary,
        )
    ]
    
    # RETURN ORIGINAL METADATA instead of ANALYZED_PLACEHOLDERS
    return AnalysisResponse(
        verdict=ai_result.verdict,
        fraud_score=ai_result.fraud_score,
        company_name=input_data.company_name,
        job_title=input_data.job_title,
        salary=input_data.salary,
        location=input_data.location,
        contact_email=input_data.contact_email,
        checks=final_checks,
        red_flags=ai_result.red_flags,
        green_flags=ai_result.green_flags,
        summary=ai_result.summary,
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "jobguard-api"}

@app.post("/search/intelligence")
async def search_intelligence(search: SearchInput):
    from search_engine import get_corporate_intelligence
    intel = await get_corporate_intelligence(search.query)
    if not intel:
        return {"status": "error", "message": "Could not retrieve intelligence for this entity."}
    return intel

class ChatInput(BaseModel):
    message: str
    history: List[dict] = []

@app.post("/chat")
async def chat_with_assistant(chat: ChatInput):
    import os
    from groq import AsyncGroq
    
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return {"reply": "ERROR: Security engine offline. API key not found."}

    client = AsyncGroq(api_key=api_key)
    
    messages = [
        {"role": "system", "content": """You are JobGuard Assistant, an expert in detecting employment scams and recruitment fraud. Help users identify red flags. Always use a clean, structured layout:
1. Use bullet points for lists.
2. Use clear line breaks between sections.
3. Keep responses concise but highly informative.
4. Maintain a professional, slightly hacker-ish tone."""}
    ]
    
    for msg in chat.history:
        role = "assistant" if msg["role"] == "model" else "user"
        messages.append({"role": role, "content": msg["text"]})
        
    messages.append({"role": "user", "content": chat.message})

    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"reply": f"ERROR: Connection to intelligence server failed. {str(e)}"}
