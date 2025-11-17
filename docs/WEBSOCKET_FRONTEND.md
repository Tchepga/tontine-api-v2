# Documentation WebSocket - Frontend

Cette documentation explique comment utiliser la connexion WebSocket pour recevoir des notifications en temps réel dans votre application frontend.

## Table des matières

1. [Installation](#installation)
2. [Connexion au serveur](#connexion-au-serveur)
3. [Authentification](#authentification)
4. [Rejoindre une tontine](#rejoindre-une-tontine)
5. [Recevoir des notifications](#recevoir-des-notifications)
6. [Exemples complets](#exemples-complets)
7. [Gestion des erreurs](#gestion-des-erreurs)

## Installation

### Avec npm
```bash
npm install socket.io-client
```

### Avec yarn
```bash
yarn add socket.io-client
```

### Avec CDN (HTML)
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

## Connexion au serveur

### Configuration de base

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  // Le token sera passé en query param (voir section Authentification)
});
```

### URL de connexion

- **Développement** : `http://localhost:3000`
- **Production** : Remplacez par l'URL de votre serveur (ex: `https://api.votre-domaine.com`)

## Authentification

Le serveur WebSocket utilise l'authentification JWT. Le token doit être passé lors de la connexion.

### Méthode 1 : Token dans les query params (Recommandé)

```javascript
import { io } from 'socket.io-client';

// Récupérer le token depuis votre système d'authentification
const token = localStorage.getItem('authToken'); // ou depuis votre store/context

const socket = io('http://localhost:3000', {
  query: {
    token: token
  },
  transports: ['websocket']
});
```

### Méthode 2 : Token dans les headers (Alternative)

```javascript
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  },
  transports: ['websocket']
});
```

**Note** : La méthode avec query params est recommandée car elle est plus compatible avec les proxies et load balancers.

## Rejoindre une tontine

Pour recevoir les notifications d'une tontine spécifique, vous devez d'abord rejoindre la "room" de cette tontine.

```javascript
// Rejoindre une tontine
socket.emit('joinTontine', tontineId, (response) => {
  if (response.success) {
    console.log('✅ Rejoint la tontine:', response.message);
  } else {
    console.error('❌ Erreur:', response.error);
  }
});
```

### Quitter une tontine

```javascript
socket.emit('leaveTontine', tontineId, (response) => {
  if (response.success) {
    console.log('✅ Quitté la tontine:', response.message);
  }
});
```

## Recevoir des notifications

### Écouter les notifications

```javascript
socket.on('notification', (notification) => {
  console.log('🔔 Nouvelle notification:', notification);
  
  // Structure de la notification :
  // {
  //   id: number,
  //   message: string,
  //   type: string, // 'EVENT', 'DEPOSIT', 'LOAN', etc.
  //   createdAt: string, // ISO date string
  //   isRead: boolean,
  //   tontineId: number,
  //   targetId?: number // Si la notification est ciblée à un membre spécifique
  // }
  
  // Afficher la notification dans votre UI
  displayNotification(notification);
});
```

### Types de notifications

Les notifications peuvent être de différents types :

- `EVENT` : Un événement a été créé/modifié/supprimé
- `DEPOSIT` : Un dépôt a été créé/modifié
- `LOAN` : Un prêt a été créé/modifié
- `SANCTION` : Une sanction a été créée
- `TONTINE` : Une tontine a été modifiée
- `MEMBER` : Un membre a été ajouté/modifié

## Exemples complets

### Exemple React avec hooks

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useWebSocketNotifications(tontineId, token) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Créer la connexion
    const newSocket = io('http://localhost:3000', {
      query: { token },
      transports: ['websocket'],
    });

    // Gérer la connexion
    newSocket.on('connect', () => {
      console.log('✅ Connecté au serveur WebSocket');
      setConnected(true);

      // Rejoindre la tontine
      if (tontineId) {
        newSocket.emit('joinTontine', tontineId, (response) => {
          if (response.success) {
            console.log('✅ Rejoint la tontine', tontineId);
          } else {
            console.error('❌ Erreur:', response.error);
          }
        });
      }
    });

    // Gérer la déconnexion
    newSocket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
      setConnected(false);
    });

    // Écouter les notifications
    newSocket.on('notification', (notification) => {
      console.log('🔔 Nouvelle notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    // Gérer les erreurs
    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion:', error.message);
      setConnected(false);
    });

    setSocket(newSocket);

    // Nettoyage à la déconnexion
    return () => {
      if (tontineId) {
        newSocket.emit('leaveTontine', tontineId);
      }
      newSocket.close();
    };
  }, [token, tontineId]);

  return { socket, notifications, connected };
}

// Utilisation dans un composant
function NotificationComponent({ tontineId }) {
  const token = localStorage.getItem('authToken');
  const { notifications, connected } = useWebSocketNotifications(tontineId, token);

  return (
    <div>
      <div>Statut: {connected ? '🟢 Connecté' : '🔴 Déconnecté'}</div>
      <div>
        <h3>Notifications ({notifications.length})</h3>
        {notifications.map((notif) => (
          <div key={notif.id}>
            <strong>{notif.message}</strong>
            <span>{new Date(notif.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Exemple Vue.js avec Composition API

```vue
<template>
  <div>
    <div>Statut: {{ connected ? '🟢 Connecté' : '🔴 Déconnecté' }}</div>
    <div>
      <h3>Notifications ({{ notifications.length }})</h3>
      <div v-for="notif in notifications" :key="notif.id">
        <strong>{{ notif.message }}</strong>
        <span>{{ formatDate(notif.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({
  tontineId: {
    type: Number,
    required: true
  }
});

const socket = ref(null);
const notifications = ref([]);
const connected = ref(false);

onMounted(() => {
  const token = localStorage.getItem('authToken');
  
  socket.value = io('http://localhost:3000', {
    query: { token },
    transports: ['websocket']
  });

  socket.value.on('connect', () => {
    connected.value = true;
    socket.value.emit('joinTontine', props.tontineId, (response) => {
      if (response.success) {
        console.log('✅ Rejoint la tontine');
      }
    });
  });

  socket.value.on('disconnect', () => {
    connected.value = false;
  });

  socket.value.on('notification', (notification) => {
    notifications.value.unshift(notification);
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.emit('leaveTontine', props.tontineId);
    socket.value.close();
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};
</script>
```

### Exemple JavaScript vanilla

```javascript
class WebSocketNotifications {
  constructor(serverUrl, token, tontineId) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.tontineId = tontineId;
    this.socket = null;
    this.notifications = [];
    this.callbacks = {
      onNotification: null,
      onConnect: null,
      onDisconnect: null,
      onError: null,
    };
  }

  connect() {
    this.socket = io(this.serverUrl, {
      query: { token: this.token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur WebSocket');
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

      // Rejoindre la tontine
      if (this.tontineId) {
        this.socket.emit('joinTontine', this.tontineId, (response) => {
          if (response.success) {
            console.log('✅ Rejoint la tontine', this.tontineId);
          } else {
            console.error('❌ Erreur:', response.error);
          }
        });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    });

    this.socket.on('notification', (notification) => {
      console.log('🔔 Nouvelle notification:', notification);
      this.notifications.unshift(notification);
      if (this.callbacks.onNotification) {
        this.callbacks.onNotification(notification);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion:', error.message);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.tontineId) {
        this.socket.emit('leaveTontine', this.tontineId);
      }
      this.socket.close();
      this.socket = null;
    }
  }

  onNotification(callback) {
    this.callbacks.onNotification = callback;
  }

  onConnect(callback) {
    this.callbacks.onConnect = callback;
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }
}

// Utilisation
const wsNotifications = new WebSocketNotifications(
  'http://localhost:3000',
  localStorage.getItem('authToken'),
  1 // tontineId
);

wsNotifications.onNotification((notification) => {
  // Afficher la notification dans l'UI
  showNotificationToast(notification);
});

wsNotifications.onConnect(() => {
  updateConnectionStatus(true);
});

wsNotifications.onDisconnect(() => {
  updateConnectionStatus(false);
});

wsNotifications.connect();
```

## Gestion des erreurs

### Reconnexion automatique

Socket.IO gère automatiquement la reconnexion, mais vous pouvez personnaliser le comportement :

```javascript
const socket = io('http://localhost:3000', {
  query: { token },
  transports: ['websocket'],
  reconnection: true, // Activer la reconnexion automatique (par défaut: true)
  reconnectionDelay: 1000, // Délai avant la première tentative (ms)
  reconnectionDelayMax: 5000, // Délai maximum entre les tentatives (ms)
  reconnectionAttempts: 5, // Nombre maximum de tentatives
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`✅ Reconnexion réussie après ${attemptNumber} tentatives`);
  
  // Rejoindre à nouveau la tontine après reconnexion
  socket.emit('joinTontine', tontineId);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`🔄 Tentative de reconnexion ${attemptNumber}...`);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Échec de la reconnexion');
  // Afficher un message à l'utilisateur
});
```

### Gestion des erreurs d'authentification

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Token') || error.message.includes('auth')) {
    console.error('❌ Erreur d\'authentification');
    // Rediriger vers la page de connexion
    // window.location.href = '/login';
  } else {
    console.error('❌ Erreur de connexion:', error.message);
  }
});
```

### Vérifier l'état de la connexion

```javascript
// Vérifier si le socket est connecté
if (socket.connected) {
  console.log('Socket connecté');
} else {
  console.log('Socket déconnecté');
}

// Obtenir l'ID du socket
console.log('Socket ID:', socket.id);
```

## Bonnes pratiques

1. **Gérer le token de manière sécurisée** : Ne stockez jamais le token dans le code source. Utilisez des variables d'environnement ou un système de gestion d'état sécurisé.

2. **Nettoyer les connexions** : Toujours fermer la connexion lorsque le composant est démonté ou que l'utilisateur se déconnecte.

3. **Gérer les reconnexions** : Après une reconnexion, n'oubliez pas de rejoindre à nouveau les rooms nécessaires.

4. **Limiter les notifications** : Ne gardez qu'un nombre raisonnable de notifications en mémoire pour éviter les problèmes de performance.

5. **Gérer les erreurs gracieusement** : Affichez des messages clairs à l'utilisateur en cas d'erreur de connexion.

## API Reference

### Événements émis (Client → Serveur)

- `joinTontine(tontineId, callback)` : Rejoindre une room de tontine
- `leaveTontine(tontineId, callback)` : Quitter une room de tontine
- `createNotification(data, callback)` : Créer une notification (nécessite authentification)
- `findAllNotification(tontineId, callback)` : Récupérer toutes les notifications d'une tontine

### Événements reçus (Serveur → Client)

- `connect` : Connexion établie
- `disconnect` : Déconnexion
- `notification` : Nouvelle notification reçue
- `connect_error` : Erreur de connexion
- `reconnect` : Reconnexion réussie
- `reconnect_attempt` : Tentative de reconnexion
- `reconnect_failed` : Échec de la reconnexion

## Support

Pour toute question ou problème, consultez la documentation Socket.IO : https://socket.io/docs/v4/

