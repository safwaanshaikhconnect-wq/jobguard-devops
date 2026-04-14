import os
import json
from groq import AsyncGroq
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)

class AIAnalysisResult(BaseModel):
    verdict: str
    fraud_score: int
    company_name: str | None = None
    job_title: str | None = None
    salary: str | None = None
    location: str | None = None
    contact_email: str | None = None
    red_flags: list[str]
    green_flags: list[str]
    summary: str

async def analyze_job_posting(job_text: str, job_url: str) -> AIAnalysisResult:
    api_key = os.environ.get("GROQ_API_KEY", "")
    
    if not api_key.startswith("gsk_"):
        # Fallback to mock data if no valid key is provided yet
        return AIAnalysisResult(
            verdict="HIGH RISK",
            fraud_score=87,
            company_name="Mock Company Ltd",
            job_title="Mock Data Entry Clerk",
            salary="$4,500/month",
            location="Remote",
            contact_email="scammer@gmail.com",
            red_flags=[
                "Mock AI Flag: Salary is suspiciously high.",
                "Mock AI Flag: Vague requirements."
            ],
            green_flags=[
                "Mock AI Flag: Company name provided."
            ],
            summary="Mock response (GROQ_API_KEY not set). This posting appears to be a scam."
        )

    client = AsyncGroq(api_key=api_key)
    
    prompt = f"""You are an expert fraud investigator specializing in employment scams.
Analyze the following job posting for potential fraud patterns.

Job URL: {job_url}
Job Description:
{job_text}

Provide a structured risk assessment in JSON format. Do not include markdown formatting like ```json or anything else. Just return valid raw JSON matching exactly this schema:
{{
  "verdict": "SAFE" | "SUSPICIOUS" | "HIGH RISK",
  "fraud_score": <int between 0 and 100>,
  "company_name": "<extracted company name from text/URL, or empty if unknown>",
  "job_title": "<extracted job title or empty>",
  "salary": "<extracted salary or empty>",
  "location": "<extracted location or empty>",
  "contact_email": "<extracted email or empty>",
  "red_flags": ["flag 1", "flag 2"],
  "green_flags": ["flag 1"],
  "summary": "<2 sentence explanation>"
}}
"""

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You output JSON matching the requested schema. Nothing else."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1024
        )
        
        content = response.choices[0].message.content
        # Strip potential markdown formatting that Llama sometimes adds
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return AIAnalysisResult(**data)
    except Exception as e:
        error_msg = str(e)
        print(f"Failed to parse Groq response or API error: {error_msg}")
        return AIAnalysisResult(
            verdict="SUSPICIOUS",
            fraud_score=50,
            red_flags=[f"Error connecting to analysis engine: {error_msg}"],
            green_flags=[],
            summary="The AI analysis engine encountered an error. Check the server logs."
        )

async def reanalyze_with_evidence(job_text: str, job_url: str, evidence: dict) -> AIAnalysisResult:
    """Perform a final verdict after additional evidence is provided by the user."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    client = AsyncGroq(api_key=api_key)
    
    evidence_str = "\n".join([f"- {k}: {v}" for k, v in evidence.items()])
    
    prompt = f"""You are the JobGuard Intelligence Core. You have been provided with additional forensic evidence to complete an investigation.
A previous analysis on the job below was INCONCLUSIVE (SUSPICIOUS). You must now provide a FINAL VERDICT: SAFE or HIGH RISK.

Job URL: {job_url}
Job Description: {job_text}

--- NEW EVIDENCE SUBMITTED BY USER ---
{evidence_str}

Evaluate the evidence against the original job posting. Provide a structured final assessment in JSON.
NO MORE 'SUSPICIOUS' VERDICTS ALLOWED. MUST BE 'SAFE' OR 'HIGH RISK'.

Schema:
{{
  "verdict": "SAFE" | "HIGH RISK",
  "fraud_score": <int between 0 and 100>,
  "red_flags": ["flag 1", "flag 2"],
  "green_flags": ["flag 1"],
  "summary": "<2 sentence explanation of the final verdict including how the evidence impacted it>"
}}
"""

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a senior forensic fraud investigator. Provide a binary final verdict (SAFE/HIGH RISK) based on evidence."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1024
        )
        
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        # Re-map fields so they fit the AIAnalysisResult (may need defaults)
        return AIAnalysisResult(
            **data,
            company_name=None,
            job_title=None,
            salary=None,
            location=None,
            contact_email=None
        )
    except Exception as e:
        print(f"Reanalysis failed: {str(e)}")
        return await analyze_job_posting(job_text, job_url) # Fallback to standard
