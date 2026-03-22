from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel

from optimizer import get_relevant_context
from llm import convert_code

import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for now (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str
    function_name: str


@app.post("/convert")
def convert(request: CodeRequest):
    try:
        # ✅ SAFE CONTEXT EXTRACTION
        try:
            context = get_relevant_context(request.code, request.function_name)
        except:
            context = request.code  # fallback for non-python

        # ✅ METRICS CALCULATION
        original_tokens = len(request.code.split())
        optimized_tokens = len(context.split())

        reduction_percent = round(
            ((original_tokens - optimized_tokens) / original_tokens) * 100, 2
        ) if original_tokens > 0 else 0

        # ✅ LLM CALL + LATENCY
        try:
            start = time.time()
            result = convert_code(context)
            end = time.time()

            latency = round(end - start, 3)
        except:
            result = context
            latency = 0

        # ✅ COST SIMULATION (for demo)
        cost_before = round(original_tokens * 0.000002, 6)
        cost_after = round(optimized_tokens * 0.000002, 6)

        return {
            "status": "success",
            "optimized_context": context,
            "converted_code": result,

            # 🔥 NEW METRICS
            "metrics": {
                "original_tokens": original_tokens,
                "optimized_tokens": optimized_tokens,
                "reduction_percent": reduction_percent,
                "latency": latency,
                "cost_before": cost_before,
                "cost_after": cost_after
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.get("/")
def home():
    return {"message": "API is running 🚀"}