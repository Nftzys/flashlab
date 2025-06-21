import face_recognition
import os
import json
import numpy as np

PHOTOS_DIR = "photos"  # e.g., photos/album_id/
DB_FILE = "embeddings_db.json"

# Load or initialize embedding database
if os.path.exists(DB_FILE):
    with open(DB_FILE, "r") as f:
        embeddings_db = json.load(f)
else:
    embeddings_db = []

# Track already indexed (album_id + file) entries
existing_keys = {f"{entry['album_id']}:{entry['file']}" for entry in embeddings_db}

# Loop through album folders
for album_id in os.listdir(PHOTOS_DIR):
    album_path = os.path.join(PHOTOS_DIR, album_id)
    if not os.path.isdir(album_path):
        continue

    for filename in os.listdir(album_path):
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        key = f"{album_id}:{filename}"
        if key in existing_keys:
            continue

        path = os.path.join(album_path, filename)
        print(f"Processing {key}...")

        try:
            image = face_recognition.load_image_file(path)
            encodings = face_recognition.face_encodings(image)

            if not encodings:
                print(f"❌ No face found in {filename}, skipping.")
                continue

            new_entry = {
                "album_id": album_id,
                "file": filename,
                "embedding": encodings[0].tolist()
            }

            embeddings_db.append(new_entry)
            print(f"✅ Added {filename} from album {album_id} to DB.")

        except Exception as e:
            print(f"⚠️ Error processing {filename}: {e}")

# Save updated DB
with open(DB_FILE, "w") as f:
    json.dump(embeddings_db, f)

print("🎉 Bulk import complete.")
