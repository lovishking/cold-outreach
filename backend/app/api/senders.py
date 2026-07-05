from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Sender
from app.schemas.schemas import SenderCreate, SenderResponse
from typing import List

router = APIRouter(prefix="/api/senders", tags=["Senders"])

@router.post("/", response_model=SenderResponse)
def create_sender(sender: SenderCreate, db: Session = Depends(get_db)):
    db_sender = db.query(Sender).filter(Sender.email == sender.email).first()
    if db_sender:
        raise HTTPException(status_code=400, detail="Sender email already registered")

    # If this is the first sender, make it default
    is_first = db.query(Sender).count() == 0
    
    # We must explicitly convert the dict to avoid Pydantic validation bypasses
    sender_data = sender.dict()
    new_sender = Sender(
        email=sender_data["email"],
        smtp_server=sender_data["smtp_server"],
        smtp_port=sender_data["smtp_port"],
        smtp_password=sender_data["smtp_password"],
        is_default=is_first
    )

    db.add(new_sender)
    db.commit()
    db.refresh(new_sender)
    return new_sender

@router.get("/", response_model=List[SenderResponse])
def get_senders(db: Session = Depends(get_db)):
    return db.query(Sender).order_by(Sender.created_at.desc()).all()

@router.post("/{sender_id}/default")
def set_default_sender(sender_id: int, db: Session = Depends(get_db)):
    sender = db.query(Sender).filter(Sender.id == sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
        
    # Remove default from all
    db.query(Sender).update({Sender.is_default: False})
    
    # Set new default
    sender.is_default = True
    db.commit()
    return {"message": "Default sender updated"}

@router.delete("/{sender_id}")
def delete_sender(sender_id: int, db: Session = Depends(get_db)):
    sender = db.query(Sender).filter(Sender.id == sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
        
    db.delete(sender)
    db.commit()
    
    # If we deleted the default, set another one as default if exists
    if sender.is_default:
        next_sender = db.query(Sender).first()
        if next_sender:
            next_sender.is_default = True
            db.commit()
            
    return {"ok": True}
