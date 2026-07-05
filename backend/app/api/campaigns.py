from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Campaign, Template, EmailLog, Lead
from app.schemas.schemas import CampaignCreate, CampaignResponse
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

@router.post("/", response_model=CampaignResponse)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == campaign.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    new_campaign = Campaign(name=campaign.name, template_id=campaign.template_id, sender_id=campaign.sender_id)
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # Add selected leads to campaign via EmailLog as PENDING
    valid_leads = 0
    for lead_id in campaign.lead_ids:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            log = EmailLog(
                campaign_id=new_campaign.id,
                lead_id=lead_id,
                status="PENDING"
            )
            db.add(log)
            valid_leads += 1
    db.commit()
    
    return {
        "id": new_campaign.id,
        "name": new_campaign.name,
        "template_id": new_campaign.template_id,
        "sender_id": new_campaign.sender_id,
        "status": new_campaign.status,
        "emails_sent": new_campaign.emails_sent,
        "emails_left": valid_leads,
        "created_at": new_campaign.created_at,
        "started_at": new_campaign.started_at,
        "finished_at": new_campaign.finished_at
    }

@router.get("/", response_model=List[CampaignResponse])
def get_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).offset(skip).limit(limit).all()
    res = []
    for c in campaigns:
        left = db.query(EmailLog).filter(
            EmailLog.campaign_id == c.id,
            EmailLog.status.in_(["PENDING", "RETRYING"])
        ).count()
        res.append({
            "id": c.id,
            "name": c.name,
            "template_id": c.template_id,
            "sender_id": c.sender_id,
            "status": c.status,
            "emails_sent": c.emails_sent,
            "emails_left": left,
            "created_at": c.created_at,
            "started_at": c.started_at,
            "finished_at": c.finished_at
        })
    return res

@router.post("/{campaign_id}/start")
def start_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status in ["RUNNING", "FINISHED"]:
        raise HTTPException(status_code=400, detail=f"Cannot start campaign in {campaign.status} state")
        
    campaign.status = "RUNNING"
    if not campaign.started_at:
        campaign.started_at = datetime.utcnow()
        
    db.commit()
    return {"message": "Campaign started", "status": campaign.status}

@router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "RUNNING":
        raise HTTPException(status_code=400, detail="Only running campaigns can be paused")
        
    campaign.status = "PAUSED"
    db.commit()
    return {"message": "Campaign paused", "status": campaign.status}

@router.post("/{campaign_id}/resume")
def resume_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "PAUSED":
        raise HTTPException(status_code=400, detail="Only paused campaigns can be resumed")
        
    campaign.status = "RUNNING"
    db.commit()
    return {"message": "Campaign resumed", "status": campaign.status}

@router.post("/{campaign_id}/stop")
def stop_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "STOPPED"
    campaign.finished_at = datetime.utcnow()
    db.commit()
    return {"message": "Campaign stopped", "status": campaign.status}

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Delete associated email logs first due to foreign key constraint
    db.query(EmailLog).filter(EmailLog.campaign_id == campaign_id).delete()
    
    # Delete the campaign
    db.delete(campaign)
    db.commit()
    return {"ok": True}
