"""
RoadWatch - YOLOv11 Classification Training
---------------------------------------------
Uses YOUR dataset at datasets/ with folders:
  pothole/   crack/   waterlog/   goodroad/   noroad/

Output: models/yolov11_road.pt

Run:
  python train.py
"""

import shutil
import random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

DATASET_DIR  = Path("datasets")
TRAIN_DIR    = Path("datasets_split/train")
VAL_DIR      = Path("datasets_split/val")
OUTPUT_MODEL = Path("models/yolov11_road.pt")

# Map your folder names to display class names
CLASS_MAP = {
    "pothole":  "Pothole",
    "crack":    "Crack",
    "waterlog": "Waterlogging",
    "goodroad": "Good Road",
    "noroad":   "Not a Road",
}

VAL_SPLIT   = 0.2   # 20% validation
AUG_TARGET  = 80    # augment each class up to this many images
EPOCHS      = 80
IMG_SIZE    = 224
BATCH       = 8


# ── Augmentation ───────────────────────────────────────────────────────────────

def augment_image(img: Image.Image, idx: int) -> Image.Image:
    """Apply a deterministic augmentation based on idx."""
    ops = idx % 8
    if ops == 0:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    elif ops == 1:
        img = img.rotate(random.randint(-15, 15), expand=False)
    elif ops == 2:
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.6, 1.4))
    elif ops == 3:
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.6, 1.4))
    elif ops == 4:
        img = img.filter(ImageFilter.GaussianBlur(radius=1))
    elif ops == 5:
        img = ImageEnhance.Color(img).enhance(random.uniform(0.5, 1.5))
    elif ops == 6:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
    elif ops == 7:
        img = img.rotate(90)
    return img


def build_split_dataset():
    """Split your dataset into train/val and augment small classes."""
    random.seed(42)

    for folder in [TRAIN_DIR, VAL_DIR]:
        if folder.exists():
            shutil.rmtree(folder)

    for folder_name, class_name in CLASS_MAP.items():
        src = DATASET_DIR / folder_name
        if not src.exists():
            print(f"  Missing folder: {src} - skipping")
            continue

        images = sorted(list(src.glob("*.png")) + list(src.glob("*.jpg")) + list(src.glob("*.jpeg")))
        if not images:
            print(f"  No images in {src} - skipping")
            continue

        random.shuffle(images)
        n_val = max(1, int(len(images) * VAL_SPLIT))
        val_imgs   = images[:n_val]
        train_imgs = images[n_val:]

        # Copy val images (no augmentation)
        val_dest = VAL_DIR / class_name
        val_dest.mkdir(parents=True, exist_ok=True)
        for img_path in val_imgs:
            shutil.copy(img_path, val_dest / img_path.name)

        # Copy + augment train images
        train_dest = TRAIN_DIR / class_name
        train_dest.mkdir(parents=True, exist_ok=True)
        for img_path in train_imgs:
            shutil.copy(img_path, train_dest / img_path.name)

        # Augment up to AUG_TARGET
        aug_idx = 0
        while len(list(train_dest.glob("*"))) < AUG_TARGET:
            src_img = train_imgs[aug_idx % len(train_imgs)]
            try:
                img = Image.open(src_img).convert("RGB")
                aug = augment_image(img, aug_idx)
                aug_path = train_dest / f"aug_{aug_idx}_{src_img.stem}.jpg"
                aug.save(aug_path, quality=90)
            except Exception:
                pass
            aug_idx += 1

        n_train_final = len(list(train_dest.glob("*")))
        print(f"  {class_name:15s} -> train: {n_train_final:3d}  val: {len(val_imgs):2d}")

    print("\nDataset split ready at datasets_split/")


def train():
    from ultralytics import YOLO

    print("=" * 55)
    print("RoadWatch YOLOv11 Classification Training")
    print(f"  Classes  : {list(CLASS_MAP.values())}")
    print(f"  Epochs   : {EPOCHS}  |  ImgSize: {IMG_SIZE}  |  Batch: {BATCH}")
    print("=" * 55)

    model = YOLO("yolo11n-cls.pt")   # nano classification - fast, good for small datasets

    model.train(
        data=str(Path("datasets_split").resolve()),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH,
        project="runs/classify",
        name="road_cls",
        exist_ok=True,
        patience=15,
        save=True,
        device="cpu",       # change to 0 if you have a GPU
        workers=2,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        warmup_epochs=3,
        # Built-in augmentation
        augment=True,
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.4,
        fliplr=0.5,
        flipud=0.1,
        erasing=0.3,
        verbose=True,
    )

    best = Path("runs/classify/road_cls/weights/best.pt")
    if best.exists():
        OUTPUT_MODEL.parent.mkdir(exist_ok=True)
        shutil.copy(best, OUTPUT_MODEL)
        print(f"\nModel saved -> {OUTPUT_MODEL}")
        print("Restart uvicorn to load the new model.")
    else:
        print(f"best.pt not found at {best}")


if __name__ == "__main__":
    print("\nBuilding dataset split with augmentation...")
    build_split_dataset()
    print("\nStarting training...")
    train()
