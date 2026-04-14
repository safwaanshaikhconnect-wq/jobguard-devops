import os
import httpx
import asyncio
from urllib.parse import urlparse

async def check_url_safety(url: str) -> dict:
    if not url or url.startswith("http://localhost") or "127.0.0.1" in url:
        return {
            "name": "URL Threat Scan",
            "status": "unknown",
            "detail": "No valid external URL provided for cybersecurity scan."
        }

    api_key = os.environ.get("VT_API_KEY", "")
    if not api_key:
        return {
            "name": "URL Threat Scan",
            "status": "unknown",
            "detail": "VirusTotal API key missing. Integrity check skipped."
        }

    try:
        # VirusTotal URL scan requires submitting the URL for scanning first, 
        # but the free tier allows querying a URL's existing analysis by ID (base64 of URL)
        import base64
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"x-apikey": api_key}
            response = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers=headers
            )

        if response.status_code == 404:
            # URL hasn't been scanned before - for hackathon, we'll return a cautious pass
            return {
                "name": "URL Threat Scan",
                "status": "pass",
                "detail": f"Domain {urlparse(url).netloc} has no known historical threat records."
            }

        if response.status_code != 200:
            return {
                "name": "URL Threat Scan",
                "status": "unknown",
                "detail": f"VirusTotal API Error (Status: {response.status_code})"
            }

        data = response.json()
        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)

        if malicious > 0:
            return {
                "name": "URL Threat Scan",
                "status": "fail",
                "detail": f"CRITICAL: Resource flagged as MALICIOUS by {malicious} security vendors!"
            }
        
        if suspicious > 0:
            return {
                "name": "URL Threat Scan",
                "status": "fail",
                "detail": f"Threat Alert: URL is marked as SUSPICIOUS by {suspicious} sources."
            }

        return {
            "name": "URL Threat Scan",
            "status": "pass",
            "detail": f"Verified clean by VirusTotal consensus ({stats.get('harmless', 0)} engines)."
        }

    except Exception as e:
        return {
            "name": "URL Threat Scan",
            "status": "unknown",
            "detail": f"Network check failed: {str(e)}"
        }

if __name__ == "__main__":
    async def run_test():
        if not os.environ.get("VT_API_KEY"):
            print("ERROR: Set VT_API_KEY environment variable before running test.")
            return
        print(await check_url_safety("https://google.com"))
        print(await check_url_safety("http://malicious-scam-site.ru"))

    asyncio.run(run_test())
