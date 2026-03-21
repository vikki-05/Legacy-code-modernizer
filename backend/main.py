from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel

from optimizer import get_relevant_context
from llm import convert_code

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
        context = get_relevant_context(request.code, request.function_name)
        result = convert_code(context)

        return {
            "status": "success",
            "optimized_context": context,
            "converted_code": result
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
@app.get("/")
def home():
    return {"message": "API is running 🚀"}