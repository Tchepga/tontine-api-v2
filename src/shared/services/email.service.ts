import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@devcoorp.net';

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY non configuré. Les emails ne seront pas envoyés.',
      );
    } else {
      this.resend = new Resend(apiKey);
      this.fromEmail = fromEmail;
      this.logger.log("Service d'email Resend initialisé");
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.resend) {
      this.logger.error(
        "Impossible d'envoyer l'email : RESEND_API_KEY non configuré",
      );
      throw new Error("Service d'email non configuré");
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email envoyé avec succès à ${options.to}`, result);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email à ${options.to}:`,
        error.message || error,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    username: string,
  ): Promise<void> {
    // Deep link pour application mobile (si configuré)
    const mobileDeepLink = process.env.MOBILE_DEEP_LINK_SCHEME;
    const deepLinkUrl = mobileDeepLink
      ? `${mobileDeepLink}://reset-password?token=${resetToken}`
      : null;

    // Lien universel/web (optionnel, pour fallback)
    const webUrl = process.env.WEB_RESET_URL
      ? `${process.env.WEB_RESET_URL}?token=${resetToken}`
      : null;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Réinitialisation de mot de passe</h2>
            <p>Bonjour ${username},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            
            ${
              deepLinkUrl
                ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${deepLinkUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Ouvrir dans l'application
              </a>
            </p>
            `
                : ''
            }
            
            ${
              webUrl
                ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${webUrl}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Réinitialiser via navigateur
              </a>
            </p>
            `
                : ''
            }
            
            <div style="background-color: #fff; border: 2px dashed #3498db; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #2c3e50;">Code de réinitialisation :</p>
              <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #e74c3c; word-break: break-all; text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 3px;">
                ${resetToken}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #7f8c8d; text-align: center;">
                Copiez ce code et collez-le dans l'application mobile
              </p>
            </div>
            
            <p><strong>Ce code est valide pendant 1 heure.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html,
    });
  }
}
