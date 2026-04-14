import os
import httpx
import asyncio

async def test_find_working_hf():
    api_key = "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"
    
    # Try different combinations
    combos = [
        ("https://router.huggingface.co/hf-inference/models/p1atdev/distilbert-base-uncased-job-scam-detection", "p1atdev"),
        ("https://api-inference.huggingface.co/models/p1atdev/distilbert-base-uncased-job-scam-detection", "p1atdev_old"),
        ("https://router.huggingface.co/hf-inference/models/mrm8488/distilbert-base-finetuned-fake-job-postings", "mrm8488"),
        ("https://api-inference.huggingface.co/models/mrm8488/distilbert-base-finetuned-fake-job-postings", "mrm8488_old")
    ]
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {api_key}"}
        payload = {"inputs": "Looking for data entry clerk, earn 5000 dollars daily..."}
        
        for url, name in combos:
            print(f"Testing {name}: {url}...")
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=5.0)
                print(f"  Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"  SUCCESS! Response: {response.text[:100]}")
                    return url
            except Exception as e:
                print(f"  Error: {str(e)}")
    return None

if __name__ == "__main__":
    asyncio.run(test_find_working_hf())
