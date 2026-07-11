"""
RoadWatch — Dataset Preparation Script

Downloads and prepares road defect datasets for YOLOv11 training.

Sources used (all free/public):
  1. Pothole Detection Dataset (Kaggle)
  2. Road Crack Detection Dataset (Kaggle)
  3. RDD2022 subset via direct download

Usage:
  pip install kaggle opencv-python tqdm
  # Set up Kaggle API: https://www.kaggle.com/docs/api
  python prepare_dataset.py
"""

import os
import shutil
import random
import json
from pathlib import Path
from tqdm import tqdm
import cv2
import numpy as np

DATASET_DIR = Path("datasets/road_defects")
CLASSES = ["Pothole", "Crack", "Waterlogging", "Debris", "Damaged Road", "Missing Manhole", "Good Road"]
CLASS_TO_ID = {c: i for i, c in enumerate(CLASSES)}

SPLIT = {"train": 0.75, "valid": 0.15, "test": 0.10}


def setup_dirs():
    for split in ["train", "valid", "test"]:
        (DATASET_DIR / split / "images").mkdir(parents=True, exist_ok=True)
        (DATASET_DIR / split / "labels").mkdir(parents=True, exist_ok=True)
    print("✅ Directory structure created")


def download_kaggle_dataset(dataset: str, dest: Path):
    """Download a Kaggle dataset."""
    dest.mkdir(parents=True, exist_ok=True)
    os.system(f'kaggle datasets download -d {dataset} -p "{dest}" --unzip')


def create_yolo_label(class_id: int, bbox_norm: tuple) -> str:
    """Create YOLO format label: class cx cy w h (all normalized 0-1)."""
    cx, cy, w, h = bbox_norm
    return f"{class_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}"


def full_image_label(class_id: int) -> str:
    """Label covering full image — used when no bbox annotation available."""
    return create_yolo_label(class_id, (0.5, 0.5, 0.95, 0.95))


def split_and_copy(image_paths: list, class_id: int, label_fn=None):
    """Split images into train/valid/test and write YOLO labels."""
    random.shuffle(image_paths)
    n = len(image_paths)
    splits = {
        "train": image_paths[:int(n * SPLIT["train"])],
        "valid": image_paths[int(n * SPLIT["train"]):int(n * (SPLIT["train"] + SPLIT["valid"]))],
        "test":  image_paths[int(n * (SPLIT["train"] + SPLIT["valid"])):],
    }

    for split, paths in splits.items():
        for img_path in tqdm(paths, desc=f"  {split}", leave=False):
            img_path = Path(img_path)
            if not img_path.exists():
                continue

            dest_img = DATASET_DIR / split / "images" / img_path.name
            dest_lbl = DATASET_DIR / split / "labels" / (img_path.stem + ".txt")

            shutil.copy(img_path, dest_img)

            label = label_fn(img_path) if label_fn else full_image_label(class_id)
            dest_lbl.write_text(label)


def process_pothole_dataset():
    """
    Kaggle: atulyakumar98/pothole-detection-dataset
    Contains pothole images with annotations.
    """
    print("\n📦 Processing Pothole dataset...")
    raw = Path("raw/pothole")
    download_kaggle_dataset("atulyakumar98/pothole-detection-dataset", raw)

    images = list(raw.rglob("*.jpg")) + list(raw.rglob("*.png"))
    print(f"  Found {len(images)} pothole images")

    def label_fn(img_path: Path) -> str:
        # Check for YOLO annotation file
        lbl = img_path.parent.parent / "labels" / (img_path.stem + ".txt")
        if lbl.exists():
            return lbl.read_text().strip()
        return full_image_label(CLASS_TO_ID["Pothole"])

    split_and_copy(images, CLASS_TO_ID["Pothole"], label_fn)
    print(f"  ✅ {len(images)} pothole images processed")


def process_crack_dataset():
    """
    Kaggle: arunrk7/surface-crack-detection
    Contains crack / no-crack images.
    """
    print("\n📦 Processing Crack dataset...")
    raw = Path("raw/crack")
    download_kaggle_dataset("arunrk7/surface-crack-detection", raw)

    # Only use Positive (crack) images
    crack_images = list((raw / "Positive").rglob("*.jpg"))
    if not crack_images:
        crack_images = list(raw.rglob("*.jpg"))[:500]

    print(f"  Found {len(crack_images)} crack images")
    split_and_copy(crack_images, CLASS_TO_ID["Crack"])
    print(f"  ✅ {len(crack_images)} crack images processed")


def process_rdd2022():
    """
    RDD2022 — Road Damage Detection 2022
    Download from: https://github.com/sekilab/RoadDamageDetector
    Expects raw/rdd2022/ with YOLO-format annotations.
    """
    print("\n📦 Processing RDD2022 dataset...")
    raw = Path("raw/rdd2022")

    if not raw.exists():
        print("  ⚠️  RDD2022 not found at raw/rdd2022/")
        print("  Download from: https://github.com/sekilab/RoadDamageDetector")
        return

    # RDD2022 class mapping to RoadWatch classes
    rdd_map = {
        "0": CLASS_TO_ID["Crack"],       # D00 longitudinal crack
        "1": CLASS_TO_ID["Crack"],       # D10 transverse crack
        "2": CLASS_TO_ID["Crack"],       # D20 alligator crack
        "3": CLASS_TO_ID["Pothole"],     # D40 pothole
        "4": CLASS_TO_ID["Missing Manhole"],  # D43
        "5": CLASS_TO_ID["Waterlogging"],     # D44
    }

    images = list(raw.rglob("*.jpg")) + list(raw.rglob("*.png"))
    print(f"  Found {len(images)} RDD2022 images")

    def rdd_label_fn(img_path: Path) -> str:
        lbl_path = img_path.parent.parent / "labels" / (img_path.stem + ".txt")
        if not lbl_path.exists():
            return ""
        lines = lbl_path.read_text().strip().splitlines()
        remapped = []
        for line in lines:
            parts = line.split()
            if parts and parts[0] in rdd_map:
                parts[0] = str(rdd_map[parts[0]])
                remapped.append(" ".join(parts))
        return "\n".join(remapped)

    split_and_copy(images, CLASS_TO_ID["Damaged Road"], rdd_label_fn)
    print(f"  ✅ RDD2022 processed")


def process_good_road_dataset():
    """Process good-road images for the Good Road class."""
    print("\n📦 Processing Good Road dataset...")
    raw = Path("raw/good_road")

    if not raw.exists():
        print("  ⚠️  Good road dataset not found at raw/good_road/")
        print("  Add clean road images to raw/good_road/")
        return

    images = list(raw.rglob("*.jpg")) + list(raw.rglob("*.png"))
    if not images:
        print("  ⚠️  No images found in raw/good_road/")
        return

    print(f"  Found {len(images)} good road images")
    split_and_copy(images, CLASS_TO_ID["Good Road"])
    print(f"  ✅ {len(images)} good road images processed")


def write_dataset_yaml():
    yaml_content = f"""path: {DATASET_DIR.resolve()}
train: train/images
val: valid/images
test: test/images

nc: {len(CLASSES)}
names: {CLASSES}
"""
    yaml_path = DATASET_DIR / "dataset.yaml"
    yaml_path.write_text(yaml_content)
    print(f"\n✅ dataset.yaml written to {yaml_path}")


def print_stats():
    print("\n📊 Dataset Statistics:")
    total = 0
    for split in ["train", "valid", "test"]:
        count = len(list((DATASET_DIR / split / "images").glob("*")))
        total += count
        print(f"  {split:6s}: {count:5d} images")
    print(f"  {'total':6s}: {total:5d} images")


if __name__ == "__main__":
    print("=" * 60)
    print("RoadWatch Dataset Preparation")
    print("=" * 60)

    random.seed(42)
    setup_dirs()

    process_pothole_dataset()
    process_crack_dataset()
    process_rdd2022()
    process_good_road_dataset()

    write_dataset_yaml()
    print_stats()

    print("\n✅ Dataset ready. Run: python train.py")
