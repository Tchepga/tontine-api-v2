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
    // URL de réinitialisation configurée dans les variables d'environnement
    const resetBaseUrl = process.env.PASSWORD_RESET_URL;

    if (!resetBaseUrl) {
      this.logger.error(
        "PASSWORD_RESET_URL n'est pas configuré dans les variables d'environnement",
      );
      throw new Error("URL de réinitialisation non configurée");
    }

    // Construire le lien de réinitialisation avec le token
    const resetUrl = `${resetBaseUrl}?token=${resetToken}`;

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
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            
            <p><strong>Ce lien est valide pendant 1 heure.</strong></p>
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
