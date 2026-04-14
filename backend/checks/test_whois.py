import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}) as client:
        res = await client.get("https://api.whois.vc/v1/whois?domain=google.com")
        print(res.status_code)
        print(res.text)

asyncio.run(test())
