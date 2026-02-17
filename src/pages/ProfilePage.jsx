import { useState, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { RESET } from 'jotai/utils';

import { userAtom } from '../atoms/auth';
import { API_URL } from '../config';

function ProfilePage() {
  const navigate = useNavigate();
  const setUser = useSetAtom(userAtom);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const token = Cookies.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (res.status === 401 || res.status === 404) {
          // Session invalide (ex. serveur redémarré, données en mémoire perdues)
          Cookies.remove('token');
          setUser(RESET);
          navigate('/login', { state: { message: 'Session expirée, veuillez vous reconnecter.' } });
          return;
        }
        if (!res.ok) throw new Error('Impossible de charger le profil');
        const data = await res.json();
        setProfile(data);
        setEditUsername(data.username ?? '');
        setEditDescription(data.description ?? '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users-permissions/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          description: editDescription,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Erreur lors de la mise à jour');
      }
      const updated = await res.json();
      setProfile(updated);
      setUser(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><p className="loading">Chargement du profil…</p></div>;
  if (!profile && !token) return null;

  return (
    <div className="page">
      <h2 className="page-title">Mon profil</h2>
      {error && <p className="alert-error">{error}</p>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p><strong>Nom d'utilisateur :</strong> {profile?.username}</p>
        <p><strong>Email :</strong> {profile?.email}</p>
        {profile?.description != null && profile.description !== '' && (
          <p><strong>Description :</strong> {profile.description}</p>
        )}
      </div>

      <div className="card form-page">
        <h3>Modifier mon profil</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              placeholder="Quelques mots sur vous..."
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
