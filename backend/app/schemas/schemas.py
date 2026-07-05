from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Lead Schemas
class LeadBase(BaseModel):
    name: str
    company: str
    email: EmailStr

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    status: str
    retry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Template Schemas
class TemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    attachment_path: Optional[str] = None

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    attachment_path: Optional[str] = None

class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TemplatePreview(BaseModel):
    lead_id: int

# Campaign Schemas
class CampaignCreate(BaseModel):
    name: str
    template_id: int
    sender_id: Optional[int] = None
    lead_ids: List[int] = []

class CampaignResponse(BaseModel):
    id: int
    name: str
    template_id: int
    sender_id: Optional[int] = None
    status: str
    emails_sent: int
    emails_left: int = 0
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Log Schemas
class EmailLogResponse(BaseModel):
    id: int
    campaign_id: int
    lead_id: int
    subject: Optional[str]
    status: str
    provider_message_id: Optional[str]
    retry_count: int
    error_message: Optional[str]
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Sender Schemas
class SenderCreate(BaseModel):
    email: EmailStr
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_password: str

class SenderResponse(BaseModel):
    id: int
    email: str
    smtp_server: str
    smtp_port: int
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True
