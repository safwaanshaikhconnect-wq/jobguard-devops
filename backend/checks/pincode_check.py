import httpx
import re
import asyncio

async def check_pincode(location_text: str) -> dict:
    if not location_text:
        return {
            "name": "Pincode Address Check",
            "status": "unknown",
            "detail": "No location text provided."
        }
        
    # Look for a standard 6 digit Indian PIN code
    match = re.search(r'\b\d{6}\b', location_text)
    if not match:
        return {
            "name": "Pincode Address Check",
            "status": "unknown",
            "detail": "No valid 6-digit Pincode found in the location string."
        }
        
    pincode = match.group(0)
    
    try:
        # Use our async httpx client so we don't block other tasks
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"https://api.postalpincode.in/pincode/{pincode}")
            
        if response.status_code != 200:
            return {
                "name": "Pincode Address Check",
                "status": "unknown",
                "detail": f"Postal API unavailable (Status: {response.status_code})."
            }
            
        data = response.json()
        
        if not data or not isinstance(data, list):
            return {
                "name": "Pincode Address Check",
                "status": "unknown",
                "detail": "Invalid response format from Postal API."
            }
            
        result = data[0]
        status = result.get("Status")
        
        # The API returns 'Error' or '404' usually for blatantly non-existent pincodes
        if status == "Error" or status == "404":
            return {
                "name": "Pincode Address Check",
                "status": "fail",
                "detail": f"Pincode {pincode} does NOT exist in government records. High risk indicator."
            }
            
        post_offices = result.get("PostOffice", [])
        if not post_offices:
            return {
                "name": "Pincode Address Check",
                "status": "fail",
                "detail": f"Pincode {pincode} maps to no known post offices."
            }
            
        # Extract a recognizable district/state string from the first valid match
        po = post_offices[0]
        region_str = f"{po.get('Name')}, {po.get('District')}, {po.get('State')}"
        
        return {
            "name": "Pincode Address Check",
            "status": "pass",
            "detail": f"Pincode {pincode} is a valid region mapping to: {region_str}."
        }
        
    except httpx.RequestError as e:
        return {
            "name": "Pincode Address Check",
            "status": "unknown",
            "detail": f"Network error connecting to Postal API: {str(e)}"
        }
    except Exception as e:
        return {
            "name": "Pincode Address Check",
            "status": "unknown",
            "detail": f"Unexpected error checking Pincode: {str(e)}"
        }

# Quick test block to prove it works before you run it!
if __name__ == "__main__":
    async def run_test():
        print("Testing valid pincode text (Bangalore: 560001):")
        result1 = await check_pincode("We are located at MG Road, Bangalore 560001, India")
        print(result1)
        
        print("\nTesting invalid fake pincode (999999):")
        result2 = await check_pincode("Office at Fake St, Nowhere 999999")
        print(result2)
        
        print("\nTesting no pincode:")
        result3 = await check_pincode("Remote work only from Canada")
        print(result3)
        
    asyncio.run(run_test())
