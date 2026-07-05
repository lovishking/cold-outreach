from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import leads, templates, campaigns, logs, senders
from app.db.database import engine, Base
import asyncio
from app.workers.sender import email_sender_worker
from contextlib import asynccontextmanager

Base.metadata.create_all(bind=engine)

worker_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_task
    # Startup
    worker_task = asyncio.create_task(email_sender_worker())
    yield
    # Shutdown
    if worker_task:
        worker_task.cancel()

app = FastAPI(title="Nexa Outreach", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(templates.router)
app.include_router(campaigns.router)
app.include_router(logs.router)
app.include_router(senders.router)

@app.get("/")
def root():
    return {"message": "Welcome to Nexa Outreach API"}
