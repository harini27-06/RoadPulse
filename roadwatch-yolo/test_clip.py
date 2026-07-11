import sys
import os
import numpy as np
import cv2
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

# Create a synthetic dark-blob image simulating a pothole
import numpy as np
import cv2
img = np.ones((320, 320, 3), dtype=np.uint8) * 120  # grey road
cv2.ellipse(img, (160, 160), (80, 60), 0, 0, 360, (30, 30, 30), -1)  # dark oval = pothole
cv2.imwrite("test_pothole.jpg", img)
print("Test image created")

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
print("Model loaded")

image = Image.open("test_pothole.jpg").convert("RGB")

labels = [
    "a pothole in the road",
    "cracks in the road surface",
    "water flooding on the road",
    "debris on the road",
    "damaged road surface",
    "missing manhole cover",
]

inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
with torch.no_grad():
    out = model(**inputs)
    probs = torch.softmax(out.logits_per_image[0], dim=0).tolist()

print("\nResults for pothole image:")
for l, p in zip(labels, probs):
    bar = "#" * int(p * 50)
    print(f"  {p:.3f} {bar} {l}")

best = labels[probs.index(max(probs))]
print(f"\nBest match: {best}")

os.remove("test_pothole.jpg")
