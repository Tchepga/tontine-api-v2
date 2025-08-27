# Dockerfile pour l'application Tontine API
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris devDependencies)
RUN npm i

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build:prod

# Stage de production
FROM node:20-alpine AS production

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer PM2 globalement
RUN npm install -g pm2

# Copier les fichiers construits depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Créer les dossiers de logs avec les bonnes permissions
RUN mkdir -p /tmp/logs && chown -R nestjs:nodejs /tmp/logs

# Copier les fichiers de configuration
COPY --chown=nestjs:nodejs ecosystem.config.js ./

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 8080

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

# Script de démarrage intégré
CMD ["sh", "-c", "echo '🚀 Démarrage de l\'application Tontine API...' && \
     if [ ! -d 'dist' ]; then echo '❌ Erreur: Le dossier dist n\'existe pas'; exit 1; fi && \
     if [ ! -f 'dist/main.js' ]; then echo '❌ Erreur: Le fichier dist/main.js n\'existe pas'; exit 1; fi && \
     mkdir -p /tmp/logs && \
     echo '🧹 Nettoyage des processus PM2 existants...' && \
     pm2 delete all 2>/dev/null || true && \
     echo '📦 Démarrage de l\'application avec PM2...' && \
     pm2 start ecosystem.config.js && \
     echo '⏳ Attente du démarrage de l\'application...' && \
     sleep 10 && \
     echo '📊 Statut de l\'application:' && \
     pm2 status && \
     echo '📋 Logs récents:' && \
     pm2 logs --lines 10 && \
     echo '👀 Surveillance de l\'application...' && \
     pm2-runtime start ecosystem.config.js --no-daemon"]
