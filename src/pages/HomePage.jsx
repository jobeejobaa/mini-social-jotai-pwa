import { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

import { userAtom } from '../atoms/auth';
import { postsWrittenCountAtom } from '../atoms/pwa';
import { API_URL } from '../config';

function HomePage() {
  const user = useAtomValue(userAtom);
  const setPostsWrittenCount = useSetAtom(postsWrittenCountAtom);
  const token = Cookies.get('token');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likingPostId, setLikingPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);

  const isLoggedIn = Boolean(token && user);

  const getPostId = (post) => post.id ?? post.documentId;

  // Charger les posts (connecté ou pas : l'API Public permet find)
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${API_URL}/api/posts?populate[0]=author&populate[1]=users_likes&_sort=createdAt:desc&_limit=30`,
          { headers }
        );
        if (!res.ok) throw new Error('Impossible de charger les posts');
        const json = await res.json();
        // Strapi 4 peut renvoyer { data: [...] } ou directement un tableau
        const list = Array.isArray(json.data) ? json.data : json.data?.data ?? json ?? [];
        setPosts(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() || !user || !token) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            text: newPostText.trim(),
            author: user.id,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Erreur lors de la création du post');
      }
      const created = await res.json();
      const newPost = created.data ?? created;
      // Ajouter le post avec l'auteur courant (réponse Strapi n'inclut pas toujours author peuplé)
      const postWithAuthor = {
        ...newPost,
        attributes: {
          ...(newPost.attributes ?? newPost),
          author: { data: { id: user.id, attributes: { username: user.username } } },
        },
      };
      setPosts((prev) => [postWithAuthor, ...prev]);
      setNewPostText('');
      setPostsWrittenCount((c) => c + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post) => {
    if (!user || !token) return;
    const postId = getPostId(post);
    setLikingPostId(postId);
    setError('');
    const attrs = post.attributes ?? post;
    const currentLike = attrs.like == null ? 0 : attrs.like;
    const usersLikesData = attrs.users_likes;
    const currentIds = [];
    if (usersLikesData) {
      const arr = usersLikesData.data ?? usersLikesData;
      if (Array.isArray(arr)) arr.forEach((u) => currentIds.push(u.id ?? u));
      else if (usersLikesData.id) currentIds.push(usersLikesData.id);
    }
    const hasLiked = currentIds.includes(user.id);
    const newLike = hasLiked ? currentLike - 1 : currentLike + 1;
    const newIds = hasLiked ? currentIds.filter((id) => id !== user.id) : [...currentIds, user.id];
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            like: newLike,
            users_likes: newIds,
          },
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Erreur like');
      }
      const updated = await res.json();
      const updatedPost = updated.data ?? updated;
      setPosts((prev) =>
        prev.map((p) => (getPostId(p) === postId ? { ...p, ...updatedPost, attributes: { ...(p.attributes ?? p), ...(updatedPost.attributes ?? updatedPost), like: newLike, users_likes: { data: newIds.map((id) => ({ id })) } } } : p))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLikingPostId(null);
    }
  };

  const getUsersLikesIds = (post) => {
    const attrs = post.attributes ?? post;
    const usersLikesData = attrs.users_likes;
    if (!usersLikesData) return [];
    const arr = usersLikesData.data ?? usersLikesData;
    if (!Array.isArray(arr)) return attrs.users_likes.id ? [attrs.users_likes.id] : [];
    return arr.map((u) => u.id ?? u);
  };

  const handleDeletePost = async (post) => {
    if (!user || !token) return;
    const postId = getPostId(post);
    const { id: authorId } = getAuthor(post);
    if (authorId !== user.id) return;
    setDeletingPostId(postId);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Impossible de supprimer le post');
      }
      setPosts((prev) => prev.filter((p) => getPostId(p) !== postId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingPostId(null);
    }
  };

  // Non connecté : message de bienvenue
  if (!isLoggedIn) {
    return (
      <div className="page">
        <div className="welcome-box">
          <h2>Bienvenue sur Mini Social</h2>
          <p>
            Ce site est un entraînement à React, à la gestion d'état globale et aux tokens.
            Authentification et routage sont utilisés pour créer un petit réseau social.
          </p>
          <p>
            <Link to="/login">Se connecter</Link> ou <Link to="/register">s'inscrire</Link> pour voir et écrire des posts.
          </p>
        </div>
      </div>
    );
  }

  // Connecté : formulaire + liste
  const getAuthor = (post) => {
    const attrs = post.attributes ?? post;
    const author = attrs.author;
    if (!author) return { username: '?', id: null };
    const data = author.data ?? author;
    const id = data.id ?? author.id;
    const username = data?.attributes?.username ?? data?.username ?? '?';
    return { username, id };
  };

  const getPostText = (post) => (post.attributes ?? post).text ?? '';
  const getLikeCount = (post) => {
    const like = (post.attributes ?? post).like;
    return like == null ? 0 : like;
  };

  return (
    <div className="page">
      <h2 className="page-title">Accueil</h2>
      {error && <p className="alert-error">{error}</p>}

      <div className="post-composer">
        <form onSubmit={handleCreatePost}>
          <input
            type="text"
            placeholder="Écrire un post..."
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
          />
          <button type="submit" disabled={submitting || !newPostText.trim()}>
            {submitting ? 'Envoi…' : 'Publier'}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="loading">Chargement des posts…</p>
      ) : posts.length === 0 ? (
        <p className="empty-message">Aucun post pour le moment. Sois le premier à poster !</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => {
            const { username, id: authorId } = getAuthor(post);
            const text = getPostText(post);
            const likeCount = getLikeCount(post);
            const postId = getPostId(post);
            const hasLiked = getUsersLikesIds(post).includes(user.id);
            return (
              <li key={postId} className="card">
                <p className="card-meta">
                  {authorId != null ? (
                    <Link to={`/user/${authorId}`}>{username}</Link>
                  ) : (
                    <span>{username}</span>
                  )}{' '}
                  · {likeCount} like(s)
                </p>
                <p>{text}</p>
                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() => handleLike(post)}
                    disabled={likingPostId === postId}
                    className={hasLiked ? 'btn-secondary' : ''}
                  >
                    {likingPostId === postId ? '…' : hasLiked ? 'Unlike' : 'Like'}
                  </button>
                  {authorId === user.id && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post)}
                      disabled={deletingPostId === postId}
                    >
                      {deletingPostId === postId ? '…' : 'Supprimer'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default HomePage;
