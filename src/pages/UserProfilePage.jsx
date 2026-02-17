import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { API_URL } from '../config';

function UserProfilePage() {
  const { id } = useParams();
  const token = Cookies.get('token');

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchUserAndPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const [userRes, postsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${id}`, { headers }),
          fetch(
            `${API_URL}/api/posts?filters[author][id][$eq]=${id}&populate[0]=author&_sort=createdAt:desc&_limit=30`,
            { headers }
          ),
        ]);

        if (!userRes.ok) {
          if (userRes.status === 403) throw new Error('Accès refusé');
          if (userRes.status === 404) throw new Error('Utilisateur introuvable');
          throw new Error('Impossible de charger le profil');
        }

        const userData = await userRes.json();
        setProfile(userData);

        if (postsRes.ok) {
          const postsJson = await postsRes.json();
          const list = Array.isArray(postsJson.data) ? postsJson.data : postsJson.data?.data ?? postsJson ?? [];
          setPosts(list);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPosts();
  }, [id, token]);

  if (loading) return <div className="page"><p className="loading">Chargement du profil…</p></div>;
  if (error) return <div className="page"><p className="alert-error">{error}</p></div>;
  if (!profile) return null;

  const getPostText = (post) => (post.attributes ?? post).text ?? '';
  const getLikeCount = (post) => {
    const like = (post.attributes ?? post).like;
    return like == null ? 0 : like;
  };

  return (
    <div className="page">
      <h2 className="page-title">Profil de {profile.username}</h2>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p><strong>Nom d'utilisateur :</strong> {profile.username}</p>
        {profile.description != null && profile.description !== '' && (
          <p><strong>Description :</strong> {profile.description}</p>
        )}
        <p style={{ marginTop: '1rem', marginBottom: 0 }}>
          <Link to="/">← Retour à l'accueil</Link>
        </p>
      </div>

      <h3>Posts</h3>
      {posts.length === 0 ? (
        <p className="empty-message">Aucun post.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id ?? post.documentId} className="card">
              <p className="card-meta">{getLikeCount(post)} like(s)</p>
              <p>{getPostText(post)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserProfilePage;
