import os
import httpx

MEDGEMMA_URL   = os.environ.get("MEDGEMMA_URL",   "http://localhost:11434/api/generate")
MEDGEMMA_MODEL = os.environ.get("MEDGEMMA_MODEL", "medgemma")


def generate_clinical_summary(prompt: str, timeout: float = 10.0) -> str:
    """
    Calls locally-hosted MedGemma via Ollama.
    Returns the summary string, or empty string on failure.
    """
    try:
        resp = httpx.post(
            MEDGEMMA_URL,
            json={"model": MEDGEMMA_MODEL, "prompt": prompt, "stream": False},
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        print(f"MedGemma unavailable: {e}")
        return ""