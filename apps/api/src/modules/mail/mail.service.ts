import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, name: string, verifyToken: string): Promise<void> {
    const webUrl = this.configService.get<string>('app.webUrl');
    const verificationUrl = `${webUrl}/auth/verify-email?token=${verifyToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email address',
      template: 'verification',
      context: {
        name,
        verificationUrl,
      },
    });
  }

  async sendResetPasswordEmail(email: string, name: string, resetToken: string): Promise<void> {
    const webUrl = this.configService.get<string>('app.webUrl');
    const resetUrl = `${webUrl}/auth/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: 'reset-password',
      context: {
        name,
        resetUrl,
      },
    });
  }
}
