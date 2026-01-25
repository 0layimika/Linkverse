import { Resend } from "resend";
import { FRONTEND_URL, RESEND_API_KEY } from "../config/env";

const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "LinkVerse <hello@linkverse.live>";

export class MailService {
    private static async sendEmail(
        to: string | string[],
        subject: string,
        html: string
    ): Promise<boolean> {
        try {
            const { error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            });

            if (error) {
                console.error("Failed to send email:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    }

    static async sendVerificationEmail(email: string, verificationLink: string): Promise<boolean> {
        const subject = "Verify Your CreatorLink Account";
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: #18181b; font-weight: 700;">CreatorLink</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 16px; font-size: 22px; color: #18181b;">Verify Your Email</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                                Welcome to CreatorLink! Please verify your email address to complete your registration and start sharing your links with the world.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Verify Email</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                                If you didn't create an account with CreatorLink, you can safely ignore this email.
                            </p>
                            <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                                This link will expire in 10 minutes.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                &copy; 2026 CreatorLink. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail(email, subject, html);
    }

    static async sendForgotPasswordEmail(email: string, resetLink: string): Promise<boolean> {
        const subject = "Reset Your CreatorLink Password";
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: #18181b; font-weight: 700;">CreatorLink</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 16px; font-size: 22px; color: #18181b;">Reset Your Password</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                                We received a request to reset your password. Click the button below to create a new password.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                            <p style="margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                                This link will expire in 10 minutes.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                &copy; 2026 CreatorLink. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail(email, subject, html);
    }

    static async sendTipNotificationEmail(
        creatorEmail: string,
        creatorName: string,
        amount: number,
        senderName: string,
        message?: string
    ): Promise<boolean> {
        const subject = `You received a ₦${amount.toLocaleString()} tip on CreatorLink!`;
        const dashboardLink = `${FRONTEND_URL}/dashboard`;

        const messageSection = message ? `
                                            <tr>
                                                <td colspan="2" style="padding: 16px 0 0; border-top: 1px solid #e4e4e7;">
                                                    <span style="font-size: 14px; color: #71717a;">Message</span>
                                                    <p style="margin: 8px 0 0; font-size: 16px; color: #18181b; font-style: italic;">"${message}"</p>
                                                </td>
                                            </tr>` : '';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: #18181b; font-weight: 700;">CreatorLink</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="display: inline-block; font-size: 48px;">🎉</span>
                            </div>
                            <h2 style="margin: 0 0 16px; font-size: 22px; color: #18181b; text-align: center;">You received a tip!</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                                Hey ${creatorName}, great news! Someone just sent you a tip.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 14px; color: #71717a;">Amount</span>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <span style="font-size: 24px; font-weight: 700; color: #16a34a;">₦${amount.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                                                    <span style="font-size: 14px; color: #71717a;">From</span>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right; border-top: 1px solid #e4e4e7;">
                                                    <span style="font-size: 16px; font-weight: 600; color: #18181b;">${senderName}</span>
                                                </td>
                                            </tr>
                                            ${messageSection}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <a href="${dashboardLink}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">View Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                                Keep creating amazing content! Your supporters appreciate you.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                                &copy; 2026 CreatorLink. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        return this.sendEmail(creatorEmail, subject, html);
    }
}
