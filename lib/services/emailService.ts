import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@homy.am';

export const emailService = {
  /**
   * Send OTP verification email
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Homy - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A6045;">Welcome to Homy</h1>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #333;">
              ${otpCode}
            </div>
            <p style="color: #666; margin-top: 20px;">This code expires in 10 minutes.</p>
            <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Homy - Find your perfect home in Armenia</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Homy - Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A6045;">Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #0A6045; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
            <p style="color: #666;">This link expires in 1 hour.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Homy - Find your perfect home in Armenia</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send reset email:', error);
      return false;
    }
  },

  /**
   * Send viewing request email to property owner/agent
   */
  async sendViewingRequest(email: string, propertyTitle: string, scheduledAt: Date): Promise<boolean> {
    const formattedDate = scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Homy - New Viewing Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A6045;">New Viewing Request</h1>
            <p>You have received a new viewing request for your property:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #333;">${propertyTitle}</p>
              <p style="margin: 10px 0 0; color: #666;">Requested time: ${formattedDate}</p>
            </div>
            <p style="color: #666;">Log in to your Homy account to approve, propose a new time, or decline this request.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/viewings" style="background: #0A6045; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Request
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Homy - Find your perfect home in Armenia</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send viewing request email:', error);
      return false;
    }
  },

  /**
   * Send viewing confirmation email
   */
  async sendViewingConfirmation(email: string, propertyTitle: string, scheduledAt: Date): Promise<boolean> {
    const formattedDate = scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Homy - Viewing Scheduled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0A6045;">Viewing Confirmed!</h1>
            <p>Your viewing has been scheduled:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #333;">${propertyTitle}</p>
              <p style="margin: 10px 0 0; color: #666;">${formattedDate}</p>
            </div>
            <p style="color: #666;">The property owner/agent will contact you to confirm.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Homy - Find your perfect home in Armenia</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send viewing confirmation:', error);
      return false;
    }
  }
};

export default emailService;
