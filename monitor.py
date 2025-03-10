import requests
import time
import smtplib
import os
from email.mime.text import MIMEText

# Configuration
SITE_URL = "https://harmonic-universe.onrender.com"
CHECK_INTERVAL = 300  # 5 minutes
ENDPOINTS = [
    "/",
    "/test.html",
    "/api/health"
]

def check_endpoint(url):
    """Check if an endpoint is working and returns content"""
    try:
        response = requests.get(url, timeout=10)
        status = response.status_code
        content_length = len(response.content)

        if status != 200:
            return False, f"Error: Status code {status}"

        if content_length == 0:
            return False, "Error: Zero content length"

        return True, f"OK: {content_length} bytes"
    except Exception as e:
        return False, f"Exception: {str(e)}"

def send_alert(message):
    """Send alert email if configured"""
    email = os.environ.get("ALERT_EMAIL")
    if not email:
        print(f"ALERT: {message}")
        return

    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        print(f"ALERT: {message} (email not configured)")
        return

    msg = MIMEText(message)
    msg['Subject'] = f"ALERT: Harmonic Universe Site Issue"
    msg['From'] = smtp_user
    msg['To'] = email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"Alert email sent to {email}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")

def monitor():
    """Main monitoring loop"""
    print(f"Starting monitoring of {SITE_URL}")

    while True:
        print(f"\nChecking site at {time.strftime('%Y-%m-%d %H:%M:%S')}")

        for endpoint in ENDPOINTS:
            url = f"{SITE_URL}{endpoint}"
            success, message = check_endpoint(url)

            if success:
                print(f"✅ {endpoint}: {message}")
            else:
                error_msg = f"❌ {endpoint}: {message}"
                print(error_msg)
                send_alert(f"Website issue detected!\n\nEndpoint: {url}\nError: {message}\nTime: {time.strftime('%Y-%m-%d %H:%M:%S')}")

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    monitor()
