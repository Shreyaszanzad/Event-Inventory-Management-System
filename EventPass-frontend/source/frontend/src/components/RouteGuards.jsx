import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../context/AuthContext';

/**
 * Route guards (integration plan YG-3). Before this, `/admin/*` was reachable by
 * anyone who typed the URL.
 *
 * Both guards remember where you were headed in `location.state.from`, so the
 * login flow can drop you back there instead of on the homepage.
 */

/** Any signed-in user. */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

/** Signed in *and* holding ROLE_ADMIN. */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    // Signed in as a regular user: this is a permissions problem, not a login
    // problem, so bouncing to a login form would just be confusing.
    return (
      <Result
        status="403"
        title="Admin access only"
        subTitle="You are signed in, but this area needs an administrator account."
        extra={
          <Button type="primary" href="/" style={{ borderRadius: 12, fontWeight: 600 }}>
            Back to the site
          </Button>
        }
        style={{ padding: '4rem 1rem' }}
      />
    );
  }

  return children;
};
