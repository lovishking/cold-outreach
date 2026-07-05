import asyncio
import random
import logging
import os
import smtplib
import mimetypes
from email.message import EmailMessage
from email.utils import make_msgid, formatdate
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Campaign, EmailLog, Sender
from jinja2 import Template as JinjaTemplate
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="\n[%(asctime)s] %(levelname)s - %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("worker")

# Constants
MAX_EMAILS_PER_HOUR = 50
MAX_EMAILS_PER_DAY = 300
DELAY_MIN = 20
DELAY_MAX = 60

def send_real_email(to_email: str, subject: str, body: str, attachment_path: str = None, sender_acc=None):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        
        # Use DB sender if available, fallback to env
        from_email = sender_acc.email if sender_acc else os.getenv("FROM_EMAIL")
        smtp_server = sender_acc.smtp_server if sender_acc else os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = sender_acc.smtp_port if sender_acc else int(os.getenv("SMTP_PORT", 587))
        smtp_username = sender_acc.email if sender_acc else os.getenv("SMTP_USERNAME")
        smtp_password = sender_acc.smtp_password if sender_acc else os.getenv("SMTP_PASSWORD")

        if not from_email or not smtp_password:
            return {"success": False, "status": "FAILED", "error": "No sender account configured", "msg_id": None}

        msg['From'] = from_email
        msg['To'] = to_email

        # Anti-Spam Best Practices: Add proper headers
        msg['Date'] = formatdate(localtime=True)

        domain = from_email.split('@')[-1] if '@' in from_email else "nexa.local"
        msg['Message-ID'] = make_msgid(domain=domain)

        # Add an unsubscribe header (highly trusted by Gmail/Outlook spam filters)
        msg['List-Unsubscribe'] = f"<mailto:{from_email}?subject=unsubscribe>"

        # Anti-Spam Best Practice: Send both Plain Text and HTML versions
        msg.set_content(body) # Plain text version
        msg.add_alternative(body.replace('\n', '<br>'), subtype='html') # HTML version

        if attachment_path and os.path.exists(attachment_path):
            logger.info(f"Attaching file: {attachment_path}")
            ctype, encoding = mimetypes.guess_type(attachment_path)
            if ctype is None or encoding is not None:
                ctype = 'application/octet-stream'
            maintype, subtype = ctype.split('/', 1)

            with open(attachment_path, 'rb') as f:
                msg.add_attachment(f.read(), maintype=maintype, subtype=subtype, filename=os.path.basename(attachment_path))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()

        return {"success": True, "status": "SENT", "error": None, "msg_id": f"msg_{random.randint(1000, 9999)}"}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return {"success": False, "status": "FAILED", "error": str(e), "msg_id": None}

def get_retry_delay(retry_count: int) -> int:
    if retry_count == 0:
        return 5
    elif retry_count == 1:
        return 30
    return 120

def can_send_email(db: Session) -> bool:
    now = datetime.utcnow()
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)
    
    sent_last_hour = db.query(EmailLog).filter(
        EmailLog.sent_at >= hour_ago,
        EmailLog.status == "SENT"
    ).count()
    
    sent_last_day = db.query(EmailLog).filter(
        EmailLog.sent_at >= day_ago,
        EmailLog.status == "SENT"
    ).count()
    
    return sent_last_hour < MAX_EMAILS_PER_HOUR and sent_last_day < MAX_EMAILS_PER_DAY

async def email_sender_worker():
    logger.info("Starting email sender worker...")
    while True:
        try:
            db = SessionLocal()
            if not can_send_email(db):
                db.close()
                await asyncio.sleep(60)
                continue
                
            campaign = db.query(Campaign).filter(Campaign.status == "RUNNING").first()
            if not campaign:
                db.close()
                await asyncio.sleep(10)
                continue
                
            # Find a pending or retrying email log for this campaign
            now = datetime.utcnow()
            log = db.query(EmailLog).filter(
                EmailLog.campaign_id == campaign.id,
                EmailLog.status.in_(["PENDING", "RETRYING"]),
            ).first()
            
            # Additional check for retrying
            if log and log.status == "RETRYING" and log.next_retry_at and log.next_retry_at > now:
                # Need to find one that is ready
                log = db.query(EmailLog).filter(
                    EmailLog.campaign_id == campaign.id,
                    EmailLog.status == "PENDING"
                ).first()
                if not log:
                    log = db.query(EmailLog).filter(
                        EmailLog.campaign_id == campaign.id,
                        EmailLog.status == "RETRYING",
                        EmailLog.next_retry_at <= now
                    ).first()

            if not log:
                # No more emails to send for this campaign
                pending_count = db.query(EmailLog).filter(
                    EmailLog.campaign_id == campaign.id,
                    EmailLog.status.in_(["PENDING", "RETRYING"])
                ).count()
                
                if pending_count == 0:
                    campaign.status = "FINISHED"
                    campaign.finished_at = datetime.utcnow()
                    db.commit()
                db.close()
                await asyncio.sleep(10)
                continue
                
            lead = log.lead
            template = campaign.template
            
            subj_tpl = JinjaTemplate(template.subject)
            body_tpl = JinjaTemplate(template.body)
            
            # Find the sender
            if campaign.sender_id:
                sender_acc = db.query(Sender).filter(Sender.id == campaign.sender_id).first()
            else:
                sender_acc = db.query(Sender).filter(Sender.is_default == True).first()
                if not sender_acc:
                    sender_acc = db.query(Sender).first() # Fallback to any sender if no default

            subject = subj_tpl.render(name=lead.name, company=lead.company)
            body = body_tpl.render(name=lead.name, company=lead.company)

            log.status = "SENDING"
            log.subject = subject
            db.commit()

            logger.info(f"Sending email to {lead.email}...")
            result = send_real_email(lead.email, subject, body, template.attachment_path, sender_acc)
            
            log.provider_message_id = result["msg_id"]
            log.error_message = result["error"]
            
            if result["success"]:
                log.status = "SENT"
                lead.status = "SENT"
                log.sent_at = datetime.utcnow()
                campaign.emails_sent += 1
            else:
                if result["status"] == "BOUNCED":
                    log.status = "BOUNCED"
                    lead.status = "BOUNCED"
                else:
                    if log.retry_count < 3:
                        log.status = "RETRYING"
                        lead.status = "RETRYING"
                        delay_mins = get_retry_delay(log.retry_count)
                        log.retry_count += 1
                        log.next_retry_at = datetime.utcnow() + timedelta(minutes=delay_mins)
                    else:
                        log.status = "FAILED"
                        lead.status = "FAILED"
                        
            db.commit()
            db.close()
            
            delay = random.randint(DELAY_MIN, DELAY_MAX)
            logger.info(f"Sleeping for {delay} seconds...")
            await asyncio.sleep(delay)
            
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(10)
