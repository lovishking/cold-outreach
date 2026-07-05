from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    company = Column(String)
    email = Column(String, unique=True, index=True)
    status = Column(String, default="PENDING")
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    subject = Column(Text)
    body = Column(Text)
    attachment_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    template_id = Column(Integer, ForeignKey("templates.id"))
    sender_id = Column(Integer, ForeignKey("senders.id"), nullable=True)
    use_ai_personalization = Column(Boolean, default=False)
    ai_subject = Column(String, nullable=True)
    ai_prompt = Column(Text, nullable=True)
    status = Column(String, default="DRAFT") # DRAFT, RUNNING, PAUSED, STOPPED, FINISHED
    emails_sent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    template = relationship("Template")
    sender = relationship("Sender")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    lead_id = Column(Integer, ForeignKey("leads.id"))
    subject = Column(Text, nullable=True)
    status = Column(String, default="PENDING") # PENDING, SENDING, SENT, FAILED, RETRYING, BOUNCED
    provider_message_id = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead")
    campaign = relationship("Campaign")

class Sender(Base):
    __tablename__ = "senders"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    smtp_server = Column(String, default="smtp.gmail.com")
    smtp_port = Column(Integer, default=587)
    smtp_password = Column(String)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
