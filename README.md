# Flashlab

A photo event platform powered by a FastAPI backend and a Next.js frontend.

## Setup

### 1. Configure environment variables

Copy `flashlab1/frontend/.env.example` to `flashlab1/frontend/.env.local` and fill
in your Supabase credentials and the API URL of the FastAPI server.

### 2. Install dependencies

```bash
# Frontend
cd flashlab1/frontend
npm install

# Backend
cd ../face_match_app
pip install -r requirements.txt
```

### 3. Build the frontend

```bash
cd ../frontend
NEXT_PUBLIC_SUPABASE_URL=http://example.com \
NEXT_PUBLIC_SUPABASE_ANON_KEY=example \
NEXT_PUBLIC_API_URL=https://flashlab.pro \
npm run build
```

### 4. Run the backend

```bash
uvicorn flashlab1.face_match_app.main:app --host 0.0.0.0 --port 8000
```

The frontend expects the API to be accessible at `NEXT_PUBLIC_API_URL`.
