import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

class SMTPService:
    """
    SMTP Email Service for sending verification and password reset links.
    Gracefully falls back to writing emails to a local outbox log file
    when no real SMTP settings are configured.
    """

    @staticmethod
    def _get_smtp_config():
        return {
            "host": os.getenv("SMTP_HOST", ""),
            "port": int(os.getenv("SMTP_PORT", "587")),
            "user": os.getenv("SMTP_USER", ""),
            "password": os.getenv("SMTP_PASSWORD", ""),
            "from": os.getenv("SMTP_FROM", "no-reply@geonarrative.ai")
        }

    @staticmethod
    def send_verification_email(email: str, username: str, token: str):
        # Verification link pointing to frontend
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        link = f"{frontend_url}/verify?token={token}&email={email}"
        
        subject = "Activate Your GeoNarrative AI SaaS Account"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #3b82f6; text-align: center;">Welcome to GeoNarrative AI</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>Thank you for signing up on the GeoNarrative AI Enterprise Digital Twin SaaS platform. To activate your account and start geoprocessing, please click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{link}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">If the button above does not work, copy and paste this link into your browser:</p>
                    <p style="font-size: 11px; color: #3b82f6; text-align: center; word-break: break-all;">{link}</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_password_reset_email(email: str, username: str, token: str):
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        link = f"{frontend_url}/reset-password?token={token}&email={email}"
        
        subject = "Reset Your GeoNarrative AI Password"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>We received a request to reset the password for your GeoNarrative AI SaaS account. Click the button below to configure a new password. This link is valid for 1 hour:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{link}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">If you did not request a password reset, please ignore this email.</p>
                    <p style="font-size: 11px; color: #3b82f6; text-align: center; word-break: break-all;">{link}</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_payment_success_email(email: str, username: str, amount: float, plan_name: str, tx_id: str):
        subject = f"Receipt: Payment Successful for {plan_name.replace('_', ' ').capitalize()}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #10b981; text-align: center;">Payment Successful!</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>Your payment has been successfully processed. Here are your transaction details:</p>
                    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 13px;">
                        <div style="padding-bottom: 8px; border-bottom: 1px solid #374151; margin-bottom: 8px;">
                            <span>Plan:</span> <strong>{plan_name.replace('_', ' ').upper()}</strong>
                        </div>
                        <div style="padding-bottom: 8px; border-bottom: 1px solid #374151; margin-bottom: 8px;">
                            <span>Amount:</span> <strong>₹{amount}</strong>
                        </div>
                        <div>
                            <span>Transaction ID:</span> <strong>{tx_id}</strong>
                        </div>
                    </div>
                    <p>Your geoprocessing features have been activated. Thank you for choosing GeoNarrative AI!</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_subscription_active_email(email: str, username: str, plan_name: str, credits: int):
        subject = f"Welcome to GeoNarrative {plan_name.replace('_', ' ').capitalize()} Plan!"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #3b82f6; text-align: center;">Subscription Activated!</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>Your subscription is now active on the <strong>{plan_name.replace('_', ' ').capitalize()}</strong> plan.</p>
                    <p>We have credited <strong>{credits} geoprocessing tasks</strong> to your account, ready for spatial forecasting, chat queries, and custom overlays.</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_subscription_expiring_email(email: str, username: str, plan_name: str, expiry_date: str):
        subject = f"Action Required: Your {plan_name.replace('_', ' ').capitalize()} Subscription is Expiring Soon"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #f59e0b; text-align: center;">Subscription Expiring Soon</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>This is a gentle reminder that your <strong>{plan_name.replace('_', ' ').capitalize()}</strong> subscription will expire on <strong>{expiry_date}</strong>.</p>
                    <p>To avoid service interruptions, please renew your subscription via the dashboard.</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_subscription_renewed_email(email: str, username: str, plan_name: str, price: float):
        subject = f"Your {plan_name.replace('_', ' ').capitalize()} Subscription Has Been Renewed"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #10b981; text-align: center;">Subscription Renewed!</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>Your subscription on the <strong>{plan_name.replace('_', ' ').capitalize()}</strong> plan has been successfully renewed for ₹{price}.</p>
                    <p>Your credits and geoprocessing tasks have been refreshed. Thank you for your continued partnership!</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_admin_inquiry_email(admin_email: str, name: str, email: str, subject: str, message: str):
        mail_subject = f"Alert: New Portal Inquiry - {subject}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #3b82f6; text-align: center;">New Support Inquiry Received</h2>
                    <p>An inquiry has been submitted through the municipal twin platform contact portal:</p>
                    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                        <strong>From:</strong> {name} ({email})<br>
                        <strong>Subject:</strong> {subject}<br><br>
                        <strong>Message:</strong><br>
                        {message}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(admin_email, mail_subject, html_content)

    @staticmethod
    def send_password_changed_security_email(email: str, username: str):
        subject = "Security Alert: Your GeoNarrative AI Password Was Changed"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #f59e0b; text-align: center;">Password Changed</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>This is a security alert to confirm that the password for your GeoNarrative AI account was recently changed.</p>
                    <p style="color: #ef4444; font-weight: bold;">If you did not make this change, please contact administrative support immediately to freeze your account.</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def send_analysis_completion_email(email: str, username: str, location: str, score: float, risk_level: str):
        subject = f"Success: GeoAI Risk Model Assessment Ready for {location}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
                    <h2 style="color: #10b981; text-align: center;">GeoAI Assessment Complete!</h2>
                    <p>Hello <strong>{username}</strong>,</p>
                    <p>The predictive spatial calculation engine has finished assessing the municipal territory parameters for <strong>{location}</strong>.</p>
                    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 13px;">
                        <div style="padding-bottom: 8px; border-bottom: 1px solid #374151; margin-bottom: 8px;">
                            <span>Target Region:</span> <strong>{location}</strong>
                        </div>
                        <div style="padding-bottom: 8px; border-bottom: 1px solid #374151; margin-bottom: 8px;">
                            <span>Calculated Index Score:</span> <strong>{score} / 100</strong>
                        </div>
                        <div>
                            <span>Zoning Assessment:</span> <strong style="color: {'#ef4444' if 'high' in risk_level.lower() else '#3b82f6'};">{risk_level.upper()} RISK</strong>
                        </div>
                    </div>
                    <p>You can now view, download, or export comprehensive GeoJSON layers and PDF summaries from your planner control console.</p>
                    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;">
                    <p style="font-size: 11px; color: #4b5563; text-align: center;">© 2026 GeoNarrative AI Inc. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        SMTPService._dispatch_email(email, subject, html_content)

    @staticmethod
    def _dispatch_email(recipient: str, subject: str, html_body: str):
        config = SMTPService._get_smtp_config()
        
        # Check if we have real SMTP config configured
        if config["host"] and config["user"] and config["password"]:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = config["from"]
                msg["To"] = recipient
                msg.attach(MIMEText(html_body, "html"))
                
                with smtplib.SMTP(config["host"], config["port"], timeout=2.0) as server:
                    server.starttls()
                    server.login(config["user"], config["password"])
                    server.sendmail(config["from"], recipient, msg.as_string())
                print(f"SMTP Success: Secure email sent to {recipient}")
                return
            except Exception as e:
                print(f"SMTP Failed: {e}. Falling back to local file outbox.")
        
        # Local file outbox logging fallback (great for dev/local environments)
        try:
            outbox_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "outbox")
            os.makedirs(outbox_dir, exist_ok=True)
            outbox_path = os.path.join(outbox_dir, "emails.txt")
            
            # Simple, neat format of the email
            email_log = f"""
============================================================
TIMESTAMP: {os.popen('echo %date% %time%').read().strip() if os.name == 'nt' else ''}
RECIPIENT: {recipient}
SUBJECT  : {subject}
------------------------------------------------------------
{html_body}
============================================================
\n"""
            with open(outbox_path, "a", encoding="utf-8") as f:
                f.write(email_log)
                
            print(f"Local Outbox Written: Local developer log saved to {outbox_path}")
        except Exception as file_err:
            print(f"Failed to write to local outbox: {file_err}")
