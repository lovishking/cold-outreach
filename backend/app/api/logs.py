from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import EmailLog
from app.schemas.schemas import EmailLogResponse
from typing import List

router = APIRouter(prefix="/api/logs", tags=["Logs"])

@router.get("/", response_model=List[EmailLogResponse])
def get_logs(skip: int = 0, limit: int = 100, status: str = None, campaign_id: int = None, db: Session = Depends(get_db)):
    query = db.query(EmailLog)
    if status:
        query = query.filter(EmailLog.status == status)
    if campaign_id:
        query = query.filter(EmailLog.campaign_id == campaign_id)
        
    return query.order_by(EmailLog.created_at.desc()).offset(skip).limit(limit).all()
