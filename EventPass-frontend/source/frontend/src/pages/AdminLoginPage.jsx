import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { LockOutlined, MailOutlined, IdcardOutlined, LoginOutlined } from '@ant-design/icons';
import { adminLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

/**
 * Admin login — email + password (integration plan §3.1).
 *
 * The backend has always exposed `POST /api/auth/admin/login`, but there was no
 * screen for it, so `/admin/*` had no way in. Admin login is throttled per email
 * and per IP; a breach comes back as 429 with the wait spelled out in the message.
 *
 * The seeded dev account is created on first boot by `DataSeeder`
 * (`admin@eims.com` / `Admin@123` unless the SEED_ADMIN_* env vars override it).
 */
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAdmin, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAuthenticated && isAdmin) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, isAdmin, navigate, redirectTo]);

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const authResponse = await adminLogin(email, password);
      const stored = signIn(authResponse);
      if (stored.role !== 'ADMIN') {
        // Shouldn't happen — the endpoint only matches ADMIN accounts — but a
        // non-admin token here would strand the user on a guarded route.
        setError({ message: 'That account is not an administrator.' });
        return;
      }
      message.success(`Welcome back, ${stored.name || 'admin'}.`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ padding: '2.5rem 2rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1e1b4b, #4338ca)',
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                marginBottom: '1rem',
              }}
            >
              <IdcardOutlined style={{ fontSize: '28px' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              Administrator Sign In
            </Title>
            <Text type="secondary" style={{ fontSize: '0.9rem' }}>
              Manage events, show slots, and ticket tiers
            </Text>
          </div>

          {error && (
            <Alert
              type={error.isRateLimited ? 'warning' : 'error'}
              showIcon
              message={error.message}
              style={{ borderRadius: 12, marginBottom: '1.25rem' }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
            <Form.Item
              name="email"
              label={<Text style={{ fontWeight: 600 }}>Email</Text>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="admin@eims.com" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text style={{ fontWeight: 600 }}>Password</Text>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Enter password"
                style={{ borderRadius: 12 }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '1.5rem', marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontWeight: 700,
                  boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                }}
              >
                Sign in <LoginOutlined />
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>
              Sign in as a customer instead
            </Link>
          </div>

        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
