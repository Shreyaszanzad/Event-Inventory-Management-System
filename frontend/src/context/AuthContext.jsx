import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { readStoredAuth, writeStoredAuth, setSessionExpiredHandler } from '../api/client';

/**
 * Holds `{ token, userId, name, role }` and mirrors it into localStorage so a
 * refresh keeps you signed in. The JWT is valid for 24 hours; when the server
 * stops accepting it, the API client calls back into `signOut` through
 * `setSessionExpiredHandler` and every guarded route bounces to /login.
 *
 * `role` is the bare backend enum (`USER` / `ADMIN`). We also tolerate a
 * `ROLE_`-prefixed value so a future backend change can't silently lock admins out.
 */

const AuthContext = createContext(null);

const normaliseRole = (role) => (role || '').replace(/^ROLE_/, '').toUpperCase();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => readStoredAuth());
  /** Set when a session dies mid-session, so /login can explain why you're back. */
  const [expiredNotice, setExpiredNotice] = useState(false);

  const signIn = useCallback((authResponse) => {
    const next = {
      token: authResponse.token,
      userId: authResponse.userId,
      name: authResponse.name,
      role: normaliseRole(authResponse.role),
    };
    writeStoredAuth(next);
    setExpiredNotice(false);
    setAuth(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    writeStoredAuth(null);
    setAuth(null);
  }, []);

  // The interceptor lives outside React, so it needs a way back in.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (readStoredAuth()) setExpiredNotice(true);
      writeStoredAuth(null);
      setAuth(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // A second tab signing in or out should not leave this one out of sync.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === null || event.key === 'eventpass_auth') setAuth(readStoredAuth());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      isAdmin: normaliseRole(auth?.role) === 'ADMIN',
      /** Falls back to the phone number, which is what the backend sends for fresh OTP users. */
      displayName: auth?.name || 'Guest',
      expiredNotice,
      clearExpiredNotice: () => setExpiredNotice(false),
      signIn,
      signOut,
    }),
    [auth, expiredNotice, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>');
  return context;
};
