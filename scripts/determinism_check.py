import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load a small model
model_name = "gpt2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
model.eval()  # Set to evaluation mode to disable dropout layers

prompt = "The mathematical foundation of a neural network is"
inputs = tokenizer(prompt, return_tensors="pt")

# Run Pass 1
with torch.no_grad():
    outputs_1 = model(**inputs)
    logits_1 = outputs_1.logits

# Run Pass 2
with torch.no_grad():
    outputs_2 = model(**inputs)
    logits_2 = outputs_2.logits

# Verify that the internal forward pass outputs are exactly identical
are_identical = torch.equal(logits_1, logits_2)
print(f"Are the raw forward pass logits exactly identical? {are_identical}")
