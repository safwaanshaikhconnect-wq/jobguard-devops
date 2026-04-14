import os
import json
from groq import AsyncGroq
from pydantic import BaseModel
from typing import Optional

class CorporateIntel(BaseModel):
    name: str
    official_domain: str
    official_hq: str
    email_pattern: str
    is_verified: bool
    description: str

async def get_corporate_intelligence(query: str) -> Optional[CorporateIntel]:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None

    client = AsyncGroq(api_key=api_key)
    
    prompt = f"""You are an OSINT Corporate Intelligence Analyst.
Provide a verified intelligence fact-sheet for the company: "{query}"

Respond ONLY in valid JSON format. Do not include markdown or explanations.
JSON Schema:
{{
  "name": "<official company name>",
  "official_domain": "<primary official website domain, e.g. tcs.com>",
  "official_hq": "<Global or Main HQ City, Country>",
  "email_pattern": "<Common corporate email convention, e.g. firstname.lastname@domain.com>",
  "is_verified": <true if this is a established, recognized global entity, false otherwise>,
  "description": "<1 sentence company summary>"
}}
"""

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500
        )
        
        # Strip potential markdown backticks
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
        
        data = json.loads(content)
        return CorporateIntel(**data)
    except Exception as e:
        print(f"OSINT Lookup Error: {e}")
        return None
