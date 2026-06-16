import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import asyncio
from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def _send_email_sync(to_email: str, subject: str, html_content: str) -> None:
        """ Synchronously connects and sends the email via SMTP """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

    @classmethod
    async def send_email(cls, to_email: str, subject: str, html_content: str) -> None:
        """ Asynchronously sends an email by running smtplib in a threadpool """
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None, 
                cls._send_email_sync, 
                to_email, 
                subject, 
                html_content
            )
            logger.info(f"Email sent successfully to {to_email}", extra={"to_email": to_email, "subject": subject})
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)

    @classmethod
    async def send_verification_email(cls, to_email: str, token: str) -> None:
        """ Sends email verification link """
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify Your Account - AI Inference Platform"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4a90e2; text-align: center;">Welcome to AI Inference Platform!</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up. Please verify your account by clicking the secure button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Account</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #888;"><a href="{verification_link}">{verification_link}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8em; color: #888; text-align: center;">This link is valid for 24 hours. If you did not sign up for this account, you can safely ignore this email.</p>
                </div>
            </body>
        </html>
        """
        await cls.send_email(to_email, subject, html_content)

    @classmethod
    async def send_recovery_email(cls, to_email: str, token: str) -> None:
        """ Sends password reset recovery link """
        recovery_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset Your Password - AI Inference Platform"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #e24a4a; text-align: center;">Password Recovery</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. You can complete the process by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{recovery_link}" style="background-color: #e24a4a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #888;"><a href="{recovery_link}">{recovery_link}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8em; color: #888; text-align: center;">This link is valid for 1 hour. If you did not request a password reset, please secure your account immediately.</p>
                </div>
            </body>
        </html>
        """
        await cls.send_email(to_email, subject, html_content)
