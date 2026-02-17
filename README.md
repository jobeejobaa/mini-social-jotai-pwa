# Mini Social

Mini réseau social full-stack : frontend React (Vite + Jotai) et backend Express avec authentification JWT.

## Stack

- **Frontend** : React 19, Vite 7, Jotai (état global), React Router, js-cookie
- **Backend** : Express, JWT, bcryptjs, CORS — API REST (auth, users, posts)
- **Données** : en mémoire (redémarrage du serveur = reset). En production, brancher une base de données.

## Fonctionnalités

- Inscription / Connexion (JWT)
- Profil utilisateur (`/profile`) et profil d’un autre utilisateur (`/user/:id`)
- CRUD des posts
- PWA (manifest, bannière d’installation)

## Prérequis

- Node.js (v18+ recommandé)

## Installation

```bash
npm install
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le front (Vite) et l’API (Express) en parallèle |
| `npm run dev:front` | Front uniquement (Vite, port par défaut) |
| `npm run dev:back` | API uniquement (Express sur le port 3001) |
| `npm run build` | Build de production du frontend |
| `npm run start` | Serve l’app en mode production (API + fichiers buildés) |
| `npm run preview` | Prévisualise le build Vite |
| `npm run lint` | Lance ESLint |

## Configuration

- **API** : par défaut sur `http://localhost:3001`. Le front est configuré pour proxyfier `/api` vers ce serveur (voir `vite.config.js`).
- **JWT** : variable d’environnement optionnelle `JWT_SECRET` (sinon valeur par défaut en dev).
- **Port API** : variable d’environnement optionnelle `PORT` (défaut : 3001).

## Structure du projet

```
├── src/
│   ├── atoms/          # État Jotai (auth, pwa)
│   ├── components/     # Composants réutilisables (ex. InstallBanner)
│   ├── hooks/          # Hooks (ex. useAuth)
│   ├── pages/          # Pages (Home, Login, Register, Profile, UserProfile)
│   ├── config.js       # Configuration (URL API, etc.)
│   ├── App.jsx
│   └── main.jsx
├── server/
│   └── index.js        # API Express (auth, users, posts)
├── index.html
├── vite.config.js
└── package.json
```

## Licence

Projet à usage éducatif (THP).
