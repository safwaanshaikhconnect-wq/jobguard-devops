import dns.resolver
import asyncio
import re

async def check_email_mx(email: str) -> dict:
    if not email or "@" not in email:
        return {
            "name": "Email Domain Authenticity",
            "status": "unknown",
            "detail": "No contact email provided."
        }

    # Extract domain
    domain = email.split("@")[-1].lower()
    
    # Reputational Fail: Common free providers used by fake "Corporate" recruiters
    # A true "Pvt Ltd" or "Solutions" company should have its own corporate domain.
    free_providers = ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com", "rediffmail.com", "live.com"]
    
    if domain in free_providers:
        # 🚨 HIGH RISK DETECTED: Corporate entity using a free personal mail provider
        return {
            "name": "Email Domain Authenticity",
            "status": "fail",
            "detail": f"FLAGGED: Entity uses free provider '{domain}'. Legit corporate entities use official business domains. High risk for phishing."
        }

    try:
        # Run DNS query in a thread to keep things async
        loop = asyncio.get_event_loop()
        
        def run_mx_query():
            try:
                # Resolve MX (Mail Exchange) records
                # This verifies the domain actually has a mail server configured
                records = dns.resolver.resolve(domain, 'MX')
                return [str(r.exchange) for r in records]
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
                return []
            except Exception as e:
                print(f"DNS_RESOLVER_ERROR: {str(e)}")
                return None

        # Give DNS queries a 5 second limit to prevent hanging
        mx_records = await asyncio.wait_for(loop.run_in_executor(None, run_mx_query), timeout=5.0)

        if mx_records is None:
            return {
                "name": "Email Domain Authenticity",
                "status": "unknown",
                "detail": "DNS_TIMEOUT: Could not resolve MX records for target."
            }

        if len(mx_records) == 0:
            return {
                "name": "Email Domain Authenticity",
                "status": "fail",
                "detail": f"CRITICAL: Domain '{domain}' has NO configured mail server (NXDOMAIN). The email is a ghost address."
            }

        # If it has MX records, it's a real configured domain
        return {
            "name": "Email Domain Authenticity",
            "status": "pass",
            "detail": f"Domain {domain} verified. Established mail servers detected."
        }

    except Exception as e:
        return {
            "name": "Email Domain Authenticity",
            "status": "unknown",
            "detail": "DNS_ANALYSIS_OFFLINE: Server handshake delayed."
        }
