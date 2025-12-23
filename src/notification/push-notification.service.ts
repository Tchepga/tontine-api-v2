import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private initialized = false;
  private disabled = false;

  private ensureInitialized() {
    if (this.initialized || this.disabled) return;
    this.initialized = true;

    try {
      // Option 1: JSON du service account dans une variable d'env
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const parsed = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
        this.logger.log('Firebase Admin initialisé via FIREBASE_SERVICE_ACCOUNT_JSON');
        return;
      }

      // Option 2: GOOGLE_APPLICATION_CREDENTIALS (chemin vers un json)
      const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (gac) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        this.logger.log(
          'Firebase Admin initialisé via GOOGLE_APPLICATION_CREDENTIALS',
        );
        return;
      }

      this.disabled = true;
      this.logger.warn(
        'Push désactivé: configure FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS',
      );
    } catch (e: any) {
      this.disabled = true;
      this.logger.error(
        `Erreur initialisation Firebase Admin: ${e?.message ?? e}`,
      );
    }
  }

  async sendToTokens(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    this.ensureInitialized();
    if (this.disabled) return;

    const { tokens, title, body, data } = params;
    if (!tokens.length) return;

    try {
      const result = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });

      if (result.failureCount > 0) {
        this.logger.warn(
          `Push: ${result.failureCount}/${tokens.length} échec(s)`,
        );
      }
    } catch (e: any) {
      this.logger.error(`Erreur envoi push: ${e?.message ?? e}`);
    }
  }
}


