import asyncio
import random
import logging
import os
import smtplib
import mimetypes
import openai
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
MAX_EMAILS_PER_HOUR = int(os.getenv("MAX_EMAILS_PER_HOUR", 50))
MAX_EMAILS_PER_DAY = int(os.getenv("MAX_EMAILS_PER_DAY", 300))
DELAY_MIN = int(os.getenv("DELAY_MIN", 20))
DELAY_MAX = int(os.getenv("DELAY_MAX", 60))

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

def generate_ai_email_from_prompt(company_name: str, lead_name: str, custom_prompt: str) -> str:
    """
    Uses Google Gemini to dynamically generate the entire email body based on a custom prompt.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or len(api_key) < 10:
        logger.warning(f"Skipping AI generation for {company_name}: No valid GEMINI_API_KEY found in .env")
        return f"Error: No valid GEMINI_API_KEY found in the backend .env file. Could not generate email for {lead_name}."

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an elite B2B sales copywriter. I need you to write a highly personalized cold email for a prospect named '{lead_name}' at the company '{company_name}'.

User Instructions / Base Prompt:
{custom_prompt}

Task:
1. Briefly infer or search your knowledge base for what '{company_name}' does.
2. Weave a highly personalized compliment or observation about their specific industry or product into the email naturally.
3. Strictly follow the core message, tone, and Call to Action requested in the User Instructions above.
4. DO NOT add a subject line. ONLY return the final email body text.
5. Keep the formatting clean with appropriate paragraph breaks.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        ai_body = response.text.strip()
        logger.info(f"Successfully generated AI email for {company_name} using Gemini")
        return ai_body
    except Exception as e:
        logger.error(f"AI Generation failed for {company_name}: {e}")
        return f"Error: AI generation failed. Please check backend logs. Details: {str(e)}"

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

    if sent_last_hour >= MAX_EMAILS_PER_HOUR:
        logger.warning(f"Rate limit reached: Sent {sent_last_hour} emails in the last hour. Waiting...")
        return False
        
    if sent_last_day >= MAX_EMAILS_PER_DAY:
        logger.warning(f"Rate limit reached: Sent {sent_last_day} emails in the last day. Waiting...")
        return False

    return True

async def email_sender_worker():
    logger.info("Starting email sender worker...")
    while True:
        try:
            db = SessionLocal()
            if not can_send_email(db):
                db.close()
                await asyncio.sleep(60)
                continue

            # Fetch ALL running campaigns instead of just the first one
            active_campaigns = db.query(Campaign).filter(Campaign.status == "RUNNING").all()
            
            if not active_campaigns:
                db.close()
                await asyncio.sleep(10)
                continue

            log_to_process = None
            campaign_to_process = None

            # Round-robin or find the first available email across any active campaign
            for campaign in active_campaigns:
                now = datetime.utcnow()
                
                # Check for pending logs
                log = db.query(EmailLog).filter(
                    EmailLog.campaign_id == campaign.id,
                    EmailLog.status == "PENDING"
                ).first()
                
                # If no pending, check for retrying logs that are ready
                if not log:
                    log = db.query(EmailLog).filter(
                        EmailLog.campaign_id == campaign.id,
                        EmailLog.status == "RETRYING",
                        EmailLog.next_retry_at <= now
                    ).first()

                if log:
                    log_to_process = log
                    campaign_to_process = campaign
                    break  # Found an email to send, exit the loop
                else:
                    # If this specific campaign has no more pending or retrying emails at all, mark it finished
                    pending_count = db.query(EmailLog).filter(
                        EmailLog.campaign_id == campaign.id,
                        EmailLog.status.in_(["PENDING", "RETRYING"])
                    ).count()

                    if pending_count == 0:
                        campaign.status = "FINISHED"
                        campaign.finished_at = datetime.utcnow()
                        db.commit()

            if not log_to_process:
                db.close()
                await asyncio.sleep(10)
                continue

            lead = log_to_process.lead
            
            # Find the sender
            if campaign_to_process.sender_id:
                sender_acc = db.query(Sender).filter(Sender.id == campaign_to_process.sender_id).first()
            else:
                sender_acc = db.query(Sender).filter(Sender.is_default == True).first()
                if not sender_acc:
                    sender_acc = db.query(Sender).first() # Fallback to any sender if no default

            # Execute AI or standard templating
            attachment_path = None
            if campaign_to_process.use_ai_personalization:
                # Use AI specific subjects and prompts
                subj_tpl = JinjaTemplate(campaign_to_process.ai_subject)
                subject = subj_tpl.render(name=lead.name, company=lead.company)
                
                logger.info(f"[Campaign: {campaign_to_process.name}] Initiating AI generation for company: {lead.company}...")
                body = generate_ai_email_from_prompt(lead.company, lead.name, campaign_to_process.ai_prompt)
            else:
                # Use standard template
                template = campaign_to_process.template
                if not template:
                    raise Exception(f"Campaign {campaign_to_process.id} is missing a template and AI is not enabled")
                    
                subj_tpl = JinjaTemplate(template.subject)
                body_tpl = JinjaTemplate(template.body)
                
                subject = subj_tpl.render(name=lead.name, company=lead.company)
                body = body_tpl.render(name=lead.name, company=lead.company)
                attachment_path = template.attachment_path

            log_to_process.status = "SENDING"
            log_to_process.subject = subject
            db.commit()

            logger.info(f"[Campaign: {campaign_to_process.name}] Sending email to {lead.email} via {sender_acc.email if sender_acc else 'Default'}...")
            result = send_real_email(lead.email, subject, body, attachment_path, sender_acc)

            log_to_process.provider_message_id = result["msg_id"]
            log_to_process.error_message = result["error"]

            if result["success"]:
                log_to_process.status = "SENT"
                lead.status = "SENT"
                log_to_process.sent_at = datetime.utcnow()
                campaign_to_process.emails_sent += 1
            else:
                if result["status"] == "BOUNCED":
                    log_to_process.status = "BOUNCED"
                    lead.status = "BOUNCED"
                else:
                    if log_to_process.retry_count < 3:
                        log_to_process.status = "RETRYING"
                        lead.status = "RETRYING"
                        delay_mins = get_retry_delay(log_to_process.retry_count)
                        log_to_process.retry_count += 1
                        log_to_process.next_retry_at = datetime.utcnow() + timedelta(minutes=delay_mins)
                    else:
                        log_to_process.status = "FAILED"
                        lead.status = "FAILED"

            db.commit()
            db.close()

            delay = random.randint(DELAY_MIN, DELAY_MAX)
            logger.info(f"Sleeping for {delay} seconds...")
            await asyncio.sleep(delay)

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(10)
