import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import InstallBanner from './components/InstallBanner';
import { useAuth } from './hooks/useAuth';
import { userAtom } from './atoms/auth';
import { pageVisitCountAtom } from './atoms/pwa';

import './App.css';

function AppContent() {
  const user = useAtomValue(userAtom);
  const { logout } = useAuth();
  const location = useLocation();
  const setPageVisitCount = useSetAtom(pageVisitCountAtom);
  const prevPathRef = useRef(location.pathname);

  // Compter les pages visitées pour la notif PWA (3 pages, puis toutes les 2)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setPageVisitCount((c) => c + 1);
    }
  }, [location.pathname, setPageVisitCount]);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="app-header">
        <nav className="app-nav">
          <Link to="/" className="brand">Mini Social</Link>
          <div className="app-nav-links">
            {!user && (
              <>
                <Link to="/login">Connexion</Link>
                <Link to="/register">Inscription</Link>
              </>
            )}
            {user && (
              <>
                <Link to="/">Accueil</Link>
                <Link to="/profile">Mon profil</Link>
                <button type="button" onClick={handleLogout}>Déconnexion</button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
        </Routes>
      </main>
      <InstallBanner />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;