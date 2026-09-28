import cv2


# =========================================
# BUKA WEBCAM
# =========================================

camera = cv2.VideoCapture(0)


if not camera.isOpened():

    print("❌ Kamera tidak dapat dibuka.")

    print(
        "Coba ganti VideoCapture(0) "
        "menjadi VideoCapture(1)."
    )

    raise SystemExit


print("✅ Kamera berhasil dibuka.")
print("Tekan Q untuk keluar.")
print("Tekan S untuk menyimpan foto.")


# =========================================
# LOOP CAMERA
# =========================================

while True:

    success, frame = camera.read()


    if not success:

        print(
            "❌ Gagal mengambil frame kamera."
        )

        break


    cv2.imshow(
        "SmartPOS Camera Test",
        frame
    )


    key = cv2.waitKey(1) & 0xFF


    # Q = keluar
    if key == ord("q"):

        break


    # S = screenshot
    if key == ord("s"):

        cv2.imwrite(
            "camera-test.jpg",
            frame
        )

        print(
            "📷 Foto disimpan: camera-test.jpg"
        )


# =========================================
# CLEANUP
# =========================================

camera.release()

cv2.destroyAllWindows()

print("✅ Kamera ditutup.")