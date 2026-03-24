import { Job } from 'bullmq';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailJobData {
  userId: string;
  template: string;
  data: Record<string, unknown>;
}

const TEMPLATE_SUBJECTS: Record<string, string> = {
  'password-reset': 'Reset your password',
  'welcome': 'Welcome to the platform',
  'verify-email': 'Verify your email address',
  'team-invite': 'You have been invited to a workspace',
  'invoice': 'Your invoice is ready',
  'payment-failed': 'Payment failed - action required',
  'post-failed': 'Post publishing failed',
  'report-ready': 'Your report is ready for download',
  'approval-needed': 'A post needs your approval',
  'revision-requested': 'Revision requested on your post',
  'plan-renewing': 'Your subscription is renewing soon',
  'social-token-expired': 'Social account reconnection needed',
};

export class EmailWorker {
  async process(job: Job<EmailJobData>): Promise<void> {
    const { template, data } = job.data;
    const subject = TEMPLATE_SUBJECTS[template] || 'Notification';

    const html = this.renderTemplate(template, data);

    await resend.emails.send({
      from: `${process.env.BRAND_NAME || 'MyManager'} <noreply@${process.env.EMAIL_DOMAIN || 'mymanager.com'}>`,
      to: (data.to || data.email) as string | string[],
      subject,
      html,
    });
  }

  private renderTemplate(template: string, data: Record<string, unknown>): string {
    const baseStyle = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #7F77DD; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
      .footer { text-align: center; color: #999; font-size: 12px; padding: 20px; }
      .button { display: inline-block; background: #7F77DD; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0; }
    `;

    const templates: Record<string, string> = {
      'password-reset': `<html><head><style>${baseStyle}</style></head><body>
        <div class="header"><h1>Password Reset</h1></div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${data.resetUrl || `${process.env.NEXTAUTH_URL}/reset-password?token=${data.resetToken}`}" class="button">Reset Password</a>
          <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
        <div class="footer"><p>You received this email because a password reset was requested for your account.</p></div>
      </body></html>`,

      'welcome': `<html><head><style>${baseStyle}</style></head><body>
        <div class="header"><h1>Welcome!</h1></div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Welcome to the platform! We are excited to have you on board.</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Get Started</a>
        </div>
        <div class="footer"><p>You received this email because you signed up for an account.</p></div>
      </body></html>`,

      'verify-email': `<html><head><style>${baseStyle}</style></head><body>
        <div class="header"><h1>Verify Your Email</h1></div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${data.verifyUrl || `${process.env.NEXTAUTH_URL}/verify-email?token=${data.verificationToken}`}" class="button">Verify Email</a>
        </div>
      </body></html>`,
    };

    return templates[template] || `<html><body><p>${JSON.stringify(data)}</p></body></html>`;
  }
}
