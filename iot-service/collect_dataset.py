from pathlib import Path
from datetime import datetime

import cv2


# =========================================
# FOLDER DATASET
# =========================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_DIR = BASE_DIR / "dataset_raw"

DATASET_DIR.mkdir(
    exist_ok=True
)


# =========================================
# CAMERA
# =========================================

camera = cv2.VideoCapture(0)


if not camera.isOpened():

    print("❌ Kamera tidak dapat dibuka.")

    raise SystemExit


print()
print("==============================")
print(" SMARTPOS DATASET COLLECTOR")
print("==============================")
print("S = simpan foto")
print("Q = keluar")
print("==============================")


saved_count = 0


# =========================================
# LOOP
# =========================================

while True:

    success, frame = camera.read()


    if not success:

        print(
            "❌ Gagal mengambil gambar."
        )

        break


    preview = frame.copy()


    cv2.putText(
        preview,
        f"Foto tersimpan: {saved_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )


    cv2.putText(
        preview,
        "S = Save | Q = Quit",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    cv2.imshow(
        "SmartPOS Dataset Collector",
        preview
    )


    key = cv2.waitKey(1) & 0xFF


    # =====================================
    # SAVE IMAGE
    # =====================================

    if key == ord("s"):

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )


        filename = (
            DATASET_DIR /
            f"package_{timestamp}.jpg"
        )


        cv2.imwrite(
            str(filename),
            frame
        )


        saved_count += 1


        print(
            f"📷 {saved_count}. {filename.name}"
        )


    # =====================================
    # QUIT
    # =====================================

    elif key == ord("q"):

        break


# =========================================
# CLEANUP
# =========================================

camera.release()

cv2.destroyAllWindows()


print()
print("==============================")
print(
    f"✅ Total foto: {saved_count}"
)
print(
    f"📁 Folder: {DATASET_DIR}"
)
print("==============================")