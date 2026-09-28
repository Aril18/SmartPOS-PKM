from pathlib import Path

import cv2
from ultralytics import YOLO


# =========================================
# PATH
# =========================================

BASE_DIR = Path(__file__).resolve().parent

IMAGE_PATH = BASE_DIR / "camera-test.jpg"

OUTPUT_PATH = BASE_DIR / "yolo-result.jpg"


# =========================================
# CEK GAMBAR
# =========================================

if not IMAGE_PATH.exists():

    print(
        f"❌ Gambar tidak ditemukan: {IMAGE_PATH}"
    )

    raise SystemExit


# =========================================
# LOAD YOLO
# =========================================

print("Memuat model YOLO...")

model = YOLO(
    "yolo11n.pt"
)

print("✅ Model YOLO berhasil dimuat.")


# =========================================
# DETEKSI
# =========================================

results = model.predict(
    source=str(
        IMAGE_PATH
    ),
    conf=0.25,
    verbose=False
)


result = results[0]


# =========================================
# HITUNG DETEKSI
# =========================================

detected_count = len(
    result.boxes
)


print()
print("============================")
print(" HASIL YOLO")
print("============================")

print(
    f"Jumlah objek terdeteksi: {detected_count}"
)


# =========================================
# DETAIL OBJEK
# =========================================

for index, box in enumerate(
    result.boxes,
    start=1
):

    class_id = int(
        box.cls[0]
    )

    confidence = float(
        box.conf[0]
    )

    class_name = model.names[
        class_id
    ]


    print(
        f"{index}. "
        f"{class_name} "
        f"({confidence:.2f})"
    )


# =========================================
# SAVE ANNOTATED IMAGE
# =========================================

annotated_frame = result.plot()


cv2.imwrite(
    str(
        OUTPUT_PATH
    ),
    annotated_frame
)


print()
print(
    f"✅ Hasil bounding box disimpan:"
)

print(
    OUTPUT_PATH
)