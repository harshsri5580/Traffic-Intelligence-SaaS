import requests
import os

RESEND_API_KEY = os.getenv("RESEND_API_KEY")


def send_email(to_email: str, otp: str):

    subject = "🔐 Your OTP Code - Traffic Intelligence"

    html = f"""
    <html>
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:12px;padding:30px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.05);">

          <h2 style="color:#4f46e5;">🚀 Traffic Intelligence</h2>
          <p style="color:#6b7280;">Verify your email address</p>

          <p>Your OTP code is:</p>

          <div style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:6px;
            background:#eef2ff;
            color:#4f46e5;
            padding:15px 25px;
            border-radius:10px;
            display:inline-block;
            margin:20px 0;
          ">
            {otp}
          </div>

          <p style="font-size:14px;color:#6b7280;">
            This code will expire in 10 minutes.
          </p>

        </div>
      </body>
    </html>
    """

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "no-reply@nortonshieldsetup.online",
                "to": to_email,
                "subject": subject,
                "html": html,
            },
        )

        print("Email response:", res.text)

    except Exception as e:
        print("Email error:", e)
