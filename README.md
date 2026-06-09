# Idea Hub

Voice-capture your ideas, auto-categorize them by core values with Claude, visualize them in a mind map.

---

## Stack

- **Frontend** — React + Vite → deployed on Vercel
- **Backend** — Python Flask + Claude API → deployed on Render or Railway
- **Database** — Supabase (PostgreSQL)

---

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → create a new project
2. In the SQL editor, run the contents of `backend/supabase_schema.sql`
3. From **Project Settings → API**, copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (under "Project API keys") → `SUPABASE_SERVICE_KEY`

---

## 2. Backend (Render or Railway)

### Environment variables needed:
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
PORT=5001
```

### Deploy to Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Select your repo, set root directory to `backend`
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `gunicorn app:app`
6. Add the environment variables above
7. Deploy — copy your public URL (e.g. `https://idea-hub-api.onrender.com`)

### Deploy to Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set root directory to `backend`
3. Add environment variables
4. Railway auto-detects Python/gunicorn — deploy runs automatically

### Test locally
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python app.py
```

---

## 3. Frontend (Vercel)

### Environment variables needed:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
2. Set **root directory** to `frontend`
3. Framework preset: **Vite**
4. Add environment variable: `VITE_API_URL` → your backend URL from step 2
5. Deploy

### Test locally
```bash
cd frontend
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:5001
npm run dev
```
Open http://localhost:3000

---

## 4. Mobile Usage

- Open your Vercel URL in **Chrome (Android)** or **Safari (iOS)**
- Allow microphone access when prompted
- Tap the pink mic button, speak your idea, tap stop — done

> Note: Safari on iOS requires the page to be served over HTTPS (Vercel handles this automatically).

---

## Core Values

Hardcoded in `backend/app.py`. To add or change values, edit the `CORE_VALUES` list in `app.py` and update the matching `VALUES` array in `frontend/src/MindMap.jsx` and the color maps in `App.jsx` and `DetailPanel.jsx`.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ideas` | Submit transcription, get back categorized idea |
| GET | `/api/ideas` | Fetch all ideas (newest first) |
| DELETE | `/api/ideas/:id` | Delete an idea |
| GET | `/api/values` | List core values |
| GET | `/health` | Health check |

**POST /api/ideas** body:
```json
{ "transcription": "I want to build a..." }
```

**Response:**
```json
{
  "id": "uuid",
  "transcription": "...",
  "summary": "...",
  "value": "Courage",
  "reasoning": "...",
  "starter_prompt": "...",
  "created_at": "2026-06-08T..."
}
```

---

## File Structure

```
idea-hub-cloud/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app shell, nav, data fetching
│   │   ├── VoiceCapture.jsx # Mic button, Web Speech API, submit
│   │   ├── MindMap.jsx      # Expandable value hubs + idea cards
│   │   ├── DetailPanel.jsx  # Slide-up panel: full idea + starter prompt
│   │   ├── main.jsx
│   │   └── index.css        # Design tokens + global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── app.py               # Flask server + Claude integration
│   ├── requirements.txt
│   ├── supabase_schema.sql  # Run once in Supabase SQL editor
│   └── .env.example
├── README.md
└── .gitignore
```
