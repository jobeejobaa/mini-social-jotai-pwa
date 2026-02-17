import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // email ou username
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const { login }                   = useAuth();
  const navigate                    = useNavigate();
  const location                    = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.message, location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ identifier, password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="form-page card">
        <h2 className="page-title">Connexion</h2>
        {error && <p className="alert-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email ou nom d'utilisateur</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="form-actions">
            <button type="submit">Se connecter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;