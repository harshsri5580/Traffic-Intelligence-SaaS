import smtplib
from email.mime.text import MIMEText

# ⚠️ better: later env use करना
EMAIL = "hs07052000@gmail.com"
PASSWORD = "thrm yzdy bvjb oszt"  # app password


def send_email(to_email: str, otp: str):

    # ✅ SUBJECT ADD (missing था)
    subject = "🔐 Your OTP Code - Traffic Intelligence"

    # 🎨 PREMIUM HTML EMAIL
    html = f"""
    <html>
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:12px;padding:30px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.05);">

          <h2 style="color:#4f46e5;margin-bottom:10px;">
            🚀 Traffic Intelligence
          </h2>

          <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">
            Verify your email address
          </p>

          <p style="font-size:16px;color:#111827;">
            Your OTP code is:
          </p>

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

          <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />

          <p style="font-size:12px;color:#9ca3af;">
            If you didn’t request this, you can safely ignore this email.
          </p>

        </div>

      </body>
    </html>
    """

    # ✅ HTML MIME
    msg = MIMEText(html, "html")
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.sendmail(EMAIL, to_email, msg.as_string())
        server.quit()

        print(f"📧 OTP sent to {to_email}")

    except Exception as e:
        print("Email error:", e)
