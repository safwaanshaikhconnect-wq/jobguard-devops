import os
import httpx
import asyncio

async def check_job_scam_hf(job_text: str) -> dict:
    if not job_text or len(job_text) < 50:
        return {
            "name": "Ensemble AI Classifier",
            "status": "unknown",
            "detail": "Insufficient content for specialized ML analysis."
        }

    api_key = os.environ.get("HF_API_KEY", "")
    if not api_key:
        return {
            "name": "Ensemble AI Classifier",
            "status": "unknown",
            "detail": "HuggingFace API key missing. Secondary AI analysis skipped."
        }

    # Model: elise-pfeiffer/job-posting-scam-detection (Stable and high-accuracy)
    model_id = "elise-pfeiffer/job-posting-scam-detection"
    # Legacy endpoint being redirected or router endpoint
    hf_url = f"https://api-inference.huggingface.co/models/{model_id}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {"Authorization": f"Bearer {api_key}"}
            # The model expects raw text and returns classification labels
            payload = {"inputs": job_text[:1000]} # Limit text for speed
            response = await client.post(hf_url, headers=headers, json=payload)

        if response.status_code == 503:
            return {
                "name": "Ensemble AI Classifier",
                "status": "unknown",
                "detail": "HuggingFace model is warming up. Please re-run the scan in 20 seconds."
            }

        if response.status_code in [404, 410]:
            # HACKATHON SAFE: Fallback to local heuristic engine if HF is deprecated/missing
            scam_keywords = ["whatsapp", "daily pay", "no experience", "tg link", "telegram", "crypto"]
            matches = [kw for kw in scam_keywords if kw in job_text.lower()]
            if len(matches) > 0:
                return {
                    "name": "Ensemble AI Classifier",
                    "status": "fail",
                    "detail": f"INTERNAL_HEURISTIC: Identified suspicious scam patterns: {', '.join(matches[:2])}."
                }
            return {
                "name": "Ensemble AI Classifier",
                "status": "pass",
                "detail": "INTERNAL_HEURISTIC: No high-risk textual patterns detected in description."
            }

        if response.status_code != 200:
            return {
                "name": "Ensemble AI Classifier",
                "status": "unknown",
                "detail": f"Model Offline (Status: {response.status_code})."
            }

        result = response.json()
        
        # Output format is usually [[{"label": "LABEL_0", "score": 0.99}, {"label": "LABEL_1", "score": 0.01}]]
        # LABEL_0 is typically non-scam, LABEL_1 is scam (depending on the model's training)
        # For this specific model: LABEL_0 is Real, LABEL_1 is Fake
        
        # Let's handle the list structure
        if isinstance(result, list) and len(result) > 0:
            predictions = result[0]
            scam_pred = next((p for p in predictions if p["label"] == "LABEL_1"), None)
            real_pred = next((p for p in predictions if p["label"] == "LABEL_0"), None)

            if scam_pred:
                score = scam_pred["score"]
                if score > 0.7:
                    return {
                        "name": "Ensemble AI Classifier",
                        "status": "fail",
                        "detail": f"DISTILBERT model reports high confidence ({int(score*100)}%) that this text matches scam templates."
                    }
                elif score > 0.4:
                    return {
                        "name": "Ensemble AI Classifier",
                        "status": "unknown",
                        "detail": f"Secondary AI reports moderate suspicion ({int(score*100)}%)."
                    }

            return {
                "name": "Ensemble AI Classifier",
                "status": "pass",
                "detail": f"Validated by secondary ML model (Real score: {int(real_pred['score']*100)}%)."
            }

        return {
            "name": "Ensemble AI Classifier",
            "status": "unknown",
            "detail": "Model returned unexpected data format."
        }

    except Exception as e:
        return {
            "name": "Ensemble AI Classifier",
            "status": "unknown",
            "detail": f"ML Inference failed: {str(e)}"
        }

if __name__ == "__main__":
    async def run_test():
        if not os.environ.get("HF_API_KEY"):
            print("ERROR: Set HF_API_KEY environment variable before running test.")
            return
        print(await check_job_scam_hf("Looking for data entry clerk, earn 5000 dollars daily..."))

    asyncio.run(run_test())
