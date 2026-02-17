/**
 * Backend intégré : API compatible avec ce que le front Strapi attend.
 * Auth (register/login), users/me, users/:id, posts CRUD.
 * Données en mémoire (redémarrage = reset). En prod tu peux brancher une DB.
 */
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'mini-social-secret-change-en-prod';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Stockage en mémoire (remplace par une DB si besoin)
const users = [];
const posts = [];
let nextUserId = 1;
let nextPostId = 1;

function findUserById(id) {
  return users.find((u) => u.id === Number(id));
}
function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
function findUserByUsername(username) {
  return users.find((u) => u.username === username);
}
function findPostById(id) {
  return posts.find((p) => p.id === Number(id));
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Non authentifié' } });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Token invalide' } });
  }
}

// ——— Auth ———
app.post('/api/auth/local/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: { message: 'username, email et password requis' } });
  }
  if (findUserByEmail(email)) {
    return res.status(400).json({ error: { message: 'Email déjà utilisé' } });
  }
  if (findUserByUsername(username)) {
    return res.status(400).json({ error: { message: 'Nom d\'utilisateur déjà pris' } });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    username,
    email,
    password: hash,
    description: '',
  };
  users.push(user);
  const { password: _, ...safe } = user;
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({ jwt: token, user: safe });
});

app.post('/api/auth/local', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: { message: 'identifier et password requis' } });
  }
  const user = findUserByEmail(identifier) || findUserByUsername(identifier);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: { message: 'Identifiants incorrects' } });
  }
  const { password: _, ...safe } = user;
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  res.json({ jwt: token, user: safe });
});

// ——— Users ———
app.get('/api/users/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  // Utilisateur absent (ex. serveur redémarré, données en mémoire perdues) → session invalide
  if (!user) return res.status(401).json({ error: { message: 'Session expirée ou invalide' } });
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.put('/api/users-permissions/users/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: { message: 'Utilisateur introuvable' } });
  const { username, description } = req.body || {};
  if (username != null) {
    if (findUserByUsername(username) && findUserByUsername(username).id !== user.id) {
      return res.status(400).json({ error: { message: 'Nom d\'utilisateur déjà pris' } });
    }
    user.username = username;
  }
  if (description != null) user.description = description;
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.get('/api/users/:id', (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: { message: 'Utilisateur introuvable' } });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ——— Posts (format Strapi-like pour le front) ———
function toStrapiPost(p) {
  const author = findUserById(p.author);
  return {
    id: p.id,
    documentId: p.id,
    attributes: {
      text: p.text,
      like: p.like ?? 0,
      author: author
        ? { data: { id: author.id, attributes: { username: author.username } } }
        : null,
      users_likes: { data: (p.users_likes || []).map((id) => ({ id })) },
    },
    createdAt: p.createdAt,
  };
}

app.get('/api/posts', (req, res) => {
  let list = [...posts];
  const authorId = req.query['filters[author][id][$eq]'];
  if (authorId) list = list.filter((p) => p.author === Number(authorId));
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const limit = Math.min(Number(req.query._limit) || 30, 100);
  list = list.slice(0, limit);
  res.json({ data: list.map(toStrapiPost) });
});

app.post('/api/posts', authMiddleware, (req, res) => {
  const data = req.body?.data || req.body || {};
  const text = (data.text || '').trim();
  if (!text) return res.status(400).json({ error: { message: 'Texte requis' } });
  // Toujours utiliser l'utilisateur du JWT comme auteur (évite 403 si types diffèrent côté client)
  const post = {
    id: nextPostId++,
    text,
    author: Number(req.userId),
    like: 0,
    users_likes: [],
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  res.status(201).json({ data: toStrapiPost(post) });
});

app.put('/api/posts/:id', authMiddleware, (req, res) => {
  const post = findPostById(req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post introuvable' } });
  const data = req.body?.data || req.body || {};
  if (data.like != null) post.like = data.like;
  if (Array.isArray(data.users_likes)) post.users_likes = data.users_likes.map(Number);
  res.json({ data: toStrapiPost(post) });
});

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
  const post = findPostById(req.params.id);
  if (!post) return res.status(404).json({ error: { message: 'Post introuvable' } });
  if (post.author !== req.userId) {
    return res.status(403).json({ error: { message: 'Vous ne pouvez supprimer que vos posts' } });
  }
  const idx = posts.indexOf(post);
  if (idx !== -1) posts.splice(idx, 1);
  res.json({ data: toStrapiPost(post) });
});

// En production : servir le front buildé (SPA fallback)
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend Mini Social sur http://localhost:${PORT}`);
  if (isProd) console.log('Mode production : front servi depuis /dist');
});
