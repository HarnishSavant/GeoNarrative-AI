"""
GeoNarrative AI — Unified Gemini Client
========================================
Production-grade Gemini API client with:
  - google-genai SDK (primary) with automatic httpx fallback
  - Model cascade: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash
  - Exponential backoff retry with jitter
  - Function calling support (native SDK or raw REST)
  - Structured logging for every call
"""

import os
import json
import time
import asyncio
import logging
import httpx
from typing import Dict, Any, List, Optional

from app.core.config import settings

logger = logging.getLogger("geonarrative.gemini_client")

# Try importing the official SDK — fallback to raw httpx if not installed
try:
    from google import genai
    from google.genai import types
    HAS_SDK = True
    logger.info("google-genai SDK loaded successfully.")
except ImportError:
    HAS_SDK = False
    logger.warning("google-genai SDK not installed. Using raw httpx REST fallback. Install with: pip install google-genai")

# Model cascade priority — most capable first
MODEL_CASCADE = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

MAX_RETRIES = 2
BASE_RETRY_DELAY = 1.0  # seconds


class GeminiClient:
    """
    Unified Gemini LLM interface.
    Supports both plain text generation and function calling (tool use).
    """

    _sdk_client: Any = None

    @classmethod
    def _get_sdk_client(cls):
        """Lazy-initialize the SDK client singleton."""
        if cls._sdk_client is None and HAS_SDK:
            api_key = settings.GEMINI_API_KEY
            if api_key:
                cls._sdk_client = genai.Client(api_key=api_key)
        return cls._sdk_client

    # ─── PLAIN TEXT GENERATION ──────────────────────────────────────

    @staticmethod
    async def generate(
        contents: List[Dict[str, Any]],
        system_instruction: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.15,
        max_tokens: int = 4096,
    ) -> str:
        """
        Generate text from Gemini with full model cascade and retry.
        `contents` format: [{"role": "user"|"assistant", "content": "..."}]
        Returns the model's text reply or an error string.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY is not configured.")
            return "[ERROR] Gemini API key not configured. Please set GEMINI_API_KEY in your .env file."

        # Try SDK first, fall back to raw REST
        if HAS_SDK:
            result = await GeminiClient._generate_sdk(
                contents, system_instruction, json_mode, temperature, max_tokens
            )
            if result and not result.startswith("[ERROR]"):
                return result
            logger.warning(f"SDK generation failed ({result}), trying httpx fallback...")

        return await GeminiClient._generate_httpx(
            contents, system_instruction, json_mode, temperature, max_tokens
        )

    @staticmethod
    async def _generate_sdk(
        contents: List[Dict[str, Any]],
        system_instruction: Optional[str],
        json_mode: bool,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Generate using the official google-genai SDK."""
        client = GeminiClient._get_sdk_client()
        if not client:
            return "[ERROR] SDK client not available"

        # Build SDK contents
        sdk_contents = []
        for item in contents:
            role = "user" if item.get("role") == "user" else "model"
            text = item.get("content", "").strip()
            if not text:
                continue
            # Merge consecutive same-role messages
            if sdk_contents and sdk_contents[-1]["role"] == role:
                sdk_contents[-1]["parts"][0]["text"] += "\n\n" + text
            else:
                sdk_contents.append({"role": role, "parts": [{"text": text}]})

        config_kwargs = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"

        gen_config = types.GenerateContentConfig(
            system_instruction=system_instruction if system_instruction else None,
            **config_kwargs,
        )

        for model_name in MODEL_CASCADE:
            for attempt in range(MAX_RETRIES):
                try:
                    start = time.perf_counter()
                    response = await asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=sdk_contents,
                        config=gen_config,
                    )
                    latency = round((time.perf_counter() - start) * 1000, 1)
                    
                    if response and response.text:
                        logger.info(f"Gemini SDK [{model_name}] responded in {latency}ms")
                        return response.text
                    
                    logger.warning(f"Gemini SDK [{model_name}] returned empty response")
                    break  # empty response — try next model

                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                        delay = BASE_RETRY_DELAY * (2 ** attempt)
                        logger.warning(f"Rate limited on {model_name}, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                    logger.error(f"SDK error [{model_name}]: {e}")
                    break  # non-retryable error — try next model

        return "[ERROR] All SDK models exhausted"

    @staticmethod
    async def _generate_httpx(
        contents: List[Dict[str, Any]],
        system_instruction: Optional[str],
        json_mode: bool,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Fallback: Generate using raw httpx REST calls."""
        api_key = settings.GEMINI_API_KEY

        # Build Gemini REST contents
        gemini_contents = []
        for item in contents:
            role = "user" if item.get("role") == "user" else "model"
            text = item.get("content", "").strip()
            if not text:
                continue
            if gemini_contents and gemini_contents[-1]["role"] == role:
                gemini_contents[-1]["parts"][0]["text"] += "\n\n" + text
            else:
                gemini_contents.append({"role": role, "parts": [{"text": text}]})

        generation_config = {
            "temperature": temperature,
            "topP": 0.95,
            "maxOutputTokens": max_tokens,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": gemini_contents,
            "generationConfig": generation_config,
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        headers = {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        }

        for model_name in MODEL_CASCADE:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            for attempt in range(MAX_RETRIES):
                try:
                    start = time.perf_counter()
                    async with httpx.AsyncClient(timeout=45.0) as client:
                        resp = await client.post(url, json=payload, headers=headers)
                    latency = round((time.perf_counter() - start) * 1000, 1)

                    if resp.status_code == 200:
                        data = resp.json()
                        cands = data.get("candidates", [])
                        if cands:
                            text = cands[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text:
                                logger.info(f"Gemini httpx [{model_name}] responded in {latency}ms")
                                return text
                        logger.warning(f"Gemini httpx [{model_name}] returned empty candidates")
                        break  # try next model

                    elif resp.status_code == 429:
                        delay = BASE_RETRY_DELAY * (2 ** attempt)
                        logger.warning(f"Rate limited on {model_name} (httpx), retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue

                    else:
                        error_body = resp.text[:300]
                        logger.error(f"Gemini httpx [{model_name}] HTTP {resp.status_code}: {error_body}")
                        break  # try next model

                except httpx.TimeoutException:
                    logger.error(f"Gemini httpx [{model_name}] timeout after attempt {attempt+1}")
                    continue  # retry on timeout
                except Exception as e:
                    logger.error(f"Gemini httpx [{model_name}] error: {e}")
                    break  # try next model

        return "[ERROR] All Gemini models failed. Check your API key and network connectivity."

    # ─── FUNCTION CALLING (TOOL USE) ────────────────────────────────

    @staticmethod
    async def generate_with_tools(
        contents: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        system_instruction: str,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Call Gemini with function declarations (tool use).
        Returns: {
            "text": str | None,
            "tool_calls": [{"name": ..., "args": ...}] | [],
            "raw_candidate": dict,
            "error": str | None
        }
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return {"text": None, "tool_calls": [], "raw_candidate": {}, "error": "API key not configured"}

        # Function calling is more reliable on specific models
        fc_models = ["gemini-2.5-flash", "gemini-2.0-flash"]

        headers = {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        }

        payload = {
            "contents": contents,
            "tools": tools,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": temperature},
        }

        for model_name in fc_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            for attempt in range(MAX_RETRIES):
                try:
                    start = time.perf_counter()
                    async with httpx.AsyncClient(timeout=45.0) as client:
                        resp = await client.post(url, json=payload, headers=headers)
                    latency = round((time.perf_counter() - start) * 1000, 1)

                    if resp.status_code == 200:
                        data = resp.json()
                        candidate = data.get("candidates", [{}])[0]
                        parts = candidate.get("content", {}).get("parts", [])

                        tool_calls = [
                            {"name": p["functionCall"]["name"], "args": p["functionCall"].get("args", {})}
                            for p in parts if "functionCall" in p
                        ]
                        text_parts = [p.get("text", "") for p in parts if "text" in p]
                        text = "\n".join(text_parts) if text_parts else None

                        logger.info(f"Function calling [{model_name}] {latency}ms — {len(tool_calls)} tools called")
                        return {
                            "text": text,
                            "tool_calls": tool_calls,
                            "raw_candidate": candidate,
                            "error": None,
                        }

                    elif resp.status_code == 429:
                        delay = BASE_RETRY_DELAY * (2 ** attempt)
                        logger.warning(f"FC rate limited on {model_name}, waiting {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        logger.error(f"FC [{model_name}] HTTP {resp.status_code}: {resp.text[:200]}")
                        break

                except httpx.TimeoutException:
                    logger.warning(f"FC [{model_name}] timeout, attempt {attempt+1}")
                    continue
                except Exception as e:
                    logger.error(f"FC [{model_name}] error: {e}")
                    break

        return {"text": None, "tool_calls": [], "raw_candidate": {}, "error": "All function calling models failed"}

    @staticmethod
    async def send_tool_results(
        contents: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        system_instruction: str,
        temperature: float = 0.2,
    ) -> str:
        """
        Second pass: send function execution results back to Gemini for final synthesis.
        Returns the model's final text response.
        """
        api_key = settings.GEMINI_API_KEY
        headers = {
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        }

        # Ensure contents are JSON-safe (PostGIS Decimal/date types can leak through)
        try:
            safe_contents = json.loads(json.dumps(contents, default=str))
        except Exception as e:
            logger.error(f"Failed to serialize contents for tool synthesis: {e}")
            return "[ERROR] Content serialization failed."

        payload = {
            "contents": safe_contents,
            "tools": tools,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": temperature},
        }

        fc_models = ["gemini-2.5-flash", "gemini-2.0-flash"]

        for model_name in fc_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            for attempt in range(MAX_RETRIES):
                try:
                    start = time.perf_counter()
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        resp = await client.post(url, json=payload, headers=headers)
                    latency = round((time.perf_counter() - start) * 1000, 1)

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            # Collect all text parts (Gemini may split across multiple parts)
                            text_parts = [p.get("text", "") for p in parts if "text" in p]
                            text = "\n".join(text_parts)
                            if text.strip():
                                logger.info(f"Tool synthesis [{model_name}] {latency}ms, {len(text)} chars")
                                return text
                        
                        # Check for blocked content
                        block_reason = candidates[0].get("finishReason", "") if candidates else "NO_CANDIDATES"
                        logger.warning(f"Tool synthesis [{model_name}] empty response, finishReason={block_reason}")
                        break  # try next model

                    elif resp.status_code == 429:
                        delay = BASE_RETRY_DELAY * (2 ** attempt)
                        logger.warning(f"Tool synthesis [{model_name}] rate limited, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        error_body = resp.text[:500]
                        logger.error(f"Tool synthesis [{model_name}] HTTP {resp.status_code}: {error_body}")
                        break  # try next model

                except httpx.TimeoutException:
                    logger.warning(f"Tool synthesis [{model_name}] timeout after attempt {attempt+1}")
                    continue  # retry on timeout
                except Exception as e:
                    logger.error(f"Tool synthesis [{model_name}] exception: {type(e).__name__}: {e}")
                    break  # try next model

        return "[ERROR] Failed to synthesize tool results."
