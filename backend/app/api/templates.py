from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import shutil
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Template, Lead
from app.schemas.schemas import TemplateCreate, TemplateUpdate, TemplateResponse, TemplatePreview
from typing import List
from jinja2 import Template as JinjaTemplate

router = APIRouter(prefix="/api/templates", tags=["Templates"])

os.makedirs("attachments", exist_ok=True)

@router.post("/upload_attachment")
async def upload_attachment(file: UploadFile = File(...)):
    file_path = f"attachments/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"file_path": file_path, "filename": file.filename}

@router.post("/", response_model=TemplateResponse)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    new_template = Template(**template.dict())
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.get("/", response_model=List[TemplateResponse])
def get_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Template).offset(skip).limit(limit).all()

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: int, template_update: TemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(db_template)
    db.commit()
    return {"ok": True}

@router.get("/{template_id}/preview")
def preview_template(template_id: int, lead_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    try:
        subject_template = JinjaTemplate(template.subject)
        body_template = JinjaTemplate(template.body)
        
        preview_subject = subject_template.render(name=lead.name, company=lead.company)
        preview_body = body_template.render(name=lead.name, company=lead.company)
        
        return {"subject": preview_subject, "body": preview_body}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Template error: {str(e)}")
