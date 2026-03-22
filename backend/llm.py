from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

print("Loading model...")

# Load model + tokenizer
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")


def convert_code(context):
    prompt = f"""
Convert this code into clean, properly formatted Python.

- Use proper indentation
- Add line breaks
- Make code readable

Code:
{context}
"""


    inputs = tokenizer(prompt, return_tensors="pt", truncation=True)
    outputs = model.generate(**inputs, max_new_tokens=200)

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return result


# TEST
if __name__ == "__main__":
    sample = """
def A():
    B()

def B():
    print("Hello")
"""
    print(convert_code(sample))