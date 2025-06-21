from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import face_recognition
import numpy as np
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "photos"
THRESHOLD = 0.6
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_album_path(album_id: str) -> str:
    return os.path.join(UPLOAD_DIR, album_id)

def get_album_db_path(album_id: str) -> str:
    return os.path.join(get_album_path(album_id), "embeddings_db.json")

def load_album_db(album_id: str) -> list:
    db_path = get_album_db_path(album_id)
    if os.path.exists(db_path):
        with open(db_path, "r") as f:
            return json.load(f)
    return []

def save_album_db(album_id: str, db: list):
    db_path = get_album_db_path(album_id)
    with open(db_path, "w") as f:
        json.dump(db, f)

@app.get("/")
def root():
    return {"status": "Face match server running."}

@app.post("/add_to_db/")
async def add_image_to_db(file: UploadFile = File(...), album_id: str = Query(...)):
    album_path = get_album_path(album_id)
    os.makedirs(album_path, exist_ok=True)

    filename = f"{uuid.uuid4()}.jpg"
    save_path = os.path.join(album_path, filename)

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    image = face_recognition.load_image_file(save_path)
    encodings = face_recognition.face_encodings(image)

    if not encodings:
        os.remove(save_path)
        raise HTTPException(status_code=400, detail="No face found in image.")

    db = load_album_db(album_id)
    db.append({
        "file": filename,
        "embedding": encodings[0].tolist()
    })
    save_album_db(album_id, db)

    return {
        "message": "✅ Image added to album database.",
        "filename": filename
    }

@app.post("/compare/")
async def compare_faces(file: UploadFile = File(...), album_id: str = Query(...)):
    contents = await file.read()
    temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}.jpg")

    with open(temp_path, "wb") as f:
        f.write(contents)

    image = face_recognition.load_image_file(temp_path)
    encodings = face_recognition.face_encodings(image)
    os.remove(temp_path)

    if not encodings:
        raise HTTPException(status_code=400, detail="No face detected in selfie.")

    query_encoding = encodings[0]
    db = load_album_db(album_id)

    matches = []
    for entry in db:
        known_encoding = np.array(entry["embedding"])
        distance = np.linalg.norm(known_encoding - query_encoding)
        if distance < THRESHOLD:
            matches.append(f"{album_id}/{entry['file']}")

    return JSONResponse(content={"matches": matches})

@app.get("/photos/{album_id}")
def list_photos(album_id: str):
    album_path = get_album_path(album_id)
    if not os.path.exists(album_path):
        raise HTTPException(status_code=404, detail="Album not found")

    all_files = os.listdir(album_path)
    image_files = [f for f in all_files if f.endswith((".jpg", ".jpeg", ".png")) and f != "embeddings_db.json"]

    return JSONResponse(content={"photos": image_files})

@app.get("/download/{album_id}/{filename}")
def download_photo(album_id: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, album_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=filename
    )

app.mount("/photos", StaticFiles(directory=UPLOAD_DIR), name="photos")
