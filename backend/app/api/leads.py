import csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Lead
from app.schemas.schemas import LeadCreate, LeadUpdate, LeadResponse, BulkDeleteRequest
from typing import List

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.post("/", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.email == lead.email).first()
    if db_lead:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_lead = Lead(**lead.dict())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@router.get("/", response_model=List[LeadResponse])
def get_leads(skip: int = 0, limit: int = 50000, db: Session = Depends(get_db)):
    return db.query(Lead).offset(skip).limit(limit).all()

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = lead_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lead, key, value)
    
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(db_lead)
    db.commit()
    return {"ok": True}

@router.post("/bulk_delete")
def bulk_delete_leads(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    db.query(Lead).filter(Lead.id.in_(request.lead_ids)).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}

@router.post("/upload")
async def upload_leads(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(StringIO(decoded))
    
    created_count = 0
    for row in reader:
        # Normalize column names to lowercase and strip whitespace to handle variations
        normalized_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k}
        
        email_raw = normalized_row.get("email", "").strip()
        if not email_raw:
            continue
            
        # Some dirty CSVs contain multiple emails separated by commas or spaces. We will just take the first one.
        email = email_raw.replace(';', ',').split(',')[0].strip()

        # Try to find name and company using possible fallback headers
        name = normalized_row.get("name") or normalized_row.get("person_name") or ""
        company = normalized_row.get("company") or normalized_row.get("company_name") or ""

        existing = db.query(Lead).filter(Lead.email == email).first()
        if not existing:
            new_lead = Lead(
                name=name,
                company=company,
                email=email
            )
            db.add(new_lead)
            created_count += 1
            
    db.commit()
    return {"message": f"Successfully uploaded {created_count} leads"}
