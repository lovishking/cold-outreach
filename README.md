# Nexa Outreach

A complete full-stack cold email outreach system.

## Setup & Running (Docker)

1. Make sure Docker and Docker Compose are installed.
2. Run the stack:
   ```bash
   docker-compose up --build
   ```
3. Access the Frontend at `http://localhost:3000`.
4. Access the API Docs at `http://localhost:8000/docs`.

## Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
