# Guide de connexion WebSocket - Exemples pratiques

## ⚠️ Important : Les WebSockets ne sont PAS accessibles via HTTP GET

Vous **ne pouvez pas** accéder au WebSocket en faisant une requête HTTP GET comme :
```
GET /ws?token=xxx  ❌ Cela ne fonctionnera PAS
```

Les WebSockets utilisent le **protocole WebSocket** (ws:// ou wss://), pas HTTP.

## ✅ Comment se connecter correctement

### 1. Utiliser Socket.IO Client (JavaScript/TypeScript)

```javascript
import { io } from 'socket.io-client';

// Récupérer votre token JWT
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Se connecter au serveur WebSocket
const socket = io('http://localhost:3000', {
  query: {
    token: token
  },
  transports: ['websocket']
});

// Écouter les événements de connexion
socket.on('connect', () => {
  console.log('✅ Connecté au serveur WebSocket');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

socket.on('disconnect', () => {
  console.log('❌ Déconnecté du serveur');
});
```

### 2. Test avec cURL (pour vérifier que le serveur répond)

```bash
# Vérifier que le serveur Socket.IO est accessible
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3000/socket.io/?EIO=4&transport=websocket
```

### 3. Test avec wscat (outil en ligne de commande)

```bash
# Installer wscat
npm install -g wscat

# Se connecter (remplacer YOUR_TOKEN par votre token JWT)
wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket&token=YOUR_TOKEN"
```

### 4. Test dans le navigateur (Console JavaScript)

Ouvrez la console de votre navigateur et exécutez :

```javascript
// Charger Socket.IO depuis CDN
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// Attendre que Socket.IO soit chargé
script.onload = () => {
  const token = 'VOTRE_TOKEN_JWT_ICI';
  
  const socket = io('http://localhost:3000', {
    query: { token },
    transports: ['websocket']
  });
  
  socket.on('connect', () => {
    console.log('✅ Connecté ! Socket ID:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Erreur:', error.message);
  });
};
```

## 🔍 Vérification que le serveur WebSocket fonctionne

### Méthode 1 : Vérifier les logs du serveur

Quand un client se connecte, vous devriez voir dans les logs :
```
[NotificationGateway] Client connecting: <socket-id>
```

### Méthode 2 : Tester avec un script Node.js

Créez un fichier `test-websocket.js` :

```javascript
const { io } = require('socket.io-client');

const token = 'VOTRE_TOKEN_JWT';

const socket = io('http://localhost:3000', {
  query: { token },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connecté avec succès !');
  console.log('Socket ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout: connexion non établie');
  process.exit(1);
}, 5000);
```

Exécutez :
```bash
node test-websocket.js
```

## 📋 Configuration du serveur

Le serveur WebSocket est configuré pour :
- **Port** : 3000 (même port que le serveur HTTP)
- **CORS** : Autorise toutes les origines (`origin: '*'`)
- **Authentification** : Token JWT requis (passé en query param `token`)

## 🔐 Authentification

Le token JWT doit être passé lors de la connexion :

```javascript
const socket = io('http://localhost:3000', {
  query: { token: 'votre-token-jwt' },
  transports: ['websocket']
});
```

Le guard `WsJwtGuard` vérifie automatiquement le token lors des messages authentifiés.

## 🚀 Exemple complet avec React

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useWebSocket(token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      query: { token },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connecté');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Déconnecté');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur:', error.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, connected };
}
```

## ❓ Problèmes courants

### Erreur : "Cannot GET /ws"
**Cause** : Vous essayez d'accéder au WebSocket via HTTP GET  
**Solution** : Utilisez le client Socket.IO, pas une requête HTTP

### Erreur : "Connection refused"
**Cause** : Le serveur n'écoute pas sur la bonne interface  
**Solution** : Vérifiez que le serveur écoute sur `0.0.0.0` et non `localhost`

### Erreur : "Token manquant" ou "Token invalide"
**Cause** : Le token n'est pas passé correctement ou est invalide  
**Solution** : Vérifiez que le token est passé en query param et qu'il est valide

## 📚 Documentation complète

Voir `docs/WEBSOCKET_FRONTEND.md` pour la documentation complète de l'API WebSocket.


