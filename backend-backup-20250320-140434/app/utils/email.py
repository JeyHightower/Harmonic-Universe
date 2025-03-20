from flask_mail import Message
from backend.app.core.config import settings
from backend.app.extensions import mail


def send_email(to: str, subject: str, template: str):
    msg = Message(subject, sender=settings.MAIL_DEFAULT_SENDER, recipients=[to])
    msg.html = template
    mail.send(msg)


def send_verification_email(to: str, token: str):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    template = f"""
    <h1>Welcome to Harmonic Universe!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="{verification_url}">Verify Email</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not create an account, please ignore this email.</p>
    """
    send_email(to, "Verify Your Email - Harmonic Universe", template)


def send_password_reset_email(to: str, token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    template = f"""
    <h1>Password Reset Request</h1>
    <p>You have requested to reset your password. Click the link below to proceed:</p>
    <p><a href="{reset_url}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    """
    send_email(to, "Password Reset - Harmonic Universe", template)
