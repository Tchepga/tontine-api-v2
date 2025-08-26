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

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer PM2 globalement
RUN npm install -g pm2

# Installer les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier les fichiers construits depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copier les fichiers de configuration
COPY --chown=nestjs:nodejs ecosystem.config.js ./

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 8080

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

# Script de démarrage
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
