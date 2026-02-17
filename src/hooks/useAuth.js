import Cookies from 'js-cookie';
import { useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import { userAtom } from '../atoms/auth';
import { API_URL } from '../config';

export function useAuth() {
  const setUser = useSetAtom(userAtom);

  const register = async ({ username, email, password }) => {
    const data = { username, email, password };

    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      throw new Error('Impossible de joindre le serveur. Lancez l’app avec npm run dev (front + back).');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erreur inscription');
    }

    const result = await res.json(); // { jwt, user }
    Cookies.set('token', result.jwt);
    setUser(result.user);
  };

  const login = async ({ identifier, password }) => {
    const data = { identifier, password };

    let res;
    try {
      res = await fetch(`${API_URL}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      throw new Error('Impossible de joindre le serveur. Lancez l’app avec npm run dev (front + back).');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erreur connexion');
    }

    const result = await res.json(); // { jwt, user }
    Cookies.set('token', result.jwt);
    setUser(result.user);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(RESET);
  };

  return { register, login, logout };
}
