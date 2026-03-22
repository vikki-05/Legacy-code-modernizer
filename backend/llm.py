from transformers import pipeline

print("Loading lightweight model...")

# ✅ lightweight model (works on Render)
generator = pipeline("text-generation", model="gpt2")


def convert_code(context):
    prompt = f"""
Convert this code into clean, readable Python:

{context}
"""

    result = generator(prompt, max_length=200, num_return_sequences=1)

    return result[0]["generated_text"]