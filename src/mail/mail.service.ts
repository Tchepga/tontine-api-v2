import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { environment } from 'src/shared/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const apiKey = environment.mailConfig.apiKey;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  isConfigured(): boolean {
    return (
      !!this.resend &&
      !!environment.mailConfig.fromEmail &&
      environment.mailConfig.enabled
    );
  }

  async sendRegistrationWelcomeEmail(params: {
    to: string;
    firstname: string;
    lastname: string;
    username: string;
  }): Promise<boolean> {
    if (!this.isConfigured() || !this.resend) {
      this.logger.warn(
        'Resend non configuré — email de bienvenue non envoyé pour %s',
        params.to,
      );
      return false;
    }

    const subject = 'Bienvenue sur Tontine — vos identifiants de connexion';
    const text = [
      `Bonjour ${params.firstname} ${params.lastname},`,
      '',
      'Votre inscription en tant que président de tontine est confirmée.',
      '',
      'Pour vous connecter à l’application :',
      `• Nom d’utilisateur : ${params.username}`,
      '• Mot de passe : celui que vous avez choisi lors de l’inscription',
      '',
      'Le nom d’utilisateur est généré automatiquement à partir de votre prénom et nom',
      '(minuscules, sans accents, séparés par un point, ex. jean.dupont).',
      '',
      'Conservez cet email pour retrouver votre identifiant.',
      '',
      'À bientôt sur Tontine !',
    ].join('\n');

    const html = `
      <p>Bonjour <strong>${params.firstname} ${params.lastname}</strong>,</p>
      <p>Votre inscription en tant que président de tontine est confirmée.</p>
      <p><strong>Pour vous connecter à l’application :</strong></p>
      <ul>
        <li><strong>Nom d’utilisateur :</strong> ${params.username}</li>
        <li><strong>Mot de passe :</strong> celui que vous avez choisi lors de l’inscription</li>
      </ul>
      <p>
        Le nom d’utilisateur est généré automatiquement à partir de votre prénom et nom
        (minuscules, sans accents, séparés par un point, ex. <code>jean.dupont</code>).
      </p>
      <p>Conservez cet email pour retrouver votre identifiant.</p>
      <p>À bientôt sur Tontine !</p>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: environment.mailConfig.fromEmail,
        to: params.to,
        subject,
        html,
        text,
      });

      if (error) {
        this.logger.error(
          `Échec envoi email Resend à ${params.to}: ${error.message}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Échec envoi email de bienvenue à ${params.to}`,
        error instanceof Error ? error.stack : error,
      );
      return false;
    }
  }
}
