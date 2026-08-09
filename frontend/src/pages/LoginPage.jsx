import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Row, Col, Alert } from 'antd';
import {
  MobileOutlined,
  SafetyOutlined,
  IdcardOutlined,
  ArrowRightOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { requestOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

/**
 * Step 1 of user login: ask the backend for an OTP (integration plan §3.1).
 *
 * The backend allows 5 OTP requests per phone per 15 minutes with a 60-second
 * resend cooldown, and answers a breach with HTTP 429. That *will* fire during
 * testing, so a rate-limit reply disables the button and says how long to wait
 * rather than letting the user hammer it.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, expiredNotice, clearExpiredNotice } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  /** Where the user was headed before the guard bounced them here. */
  // Keep the query string — the ticket page carries its `showId` there.
  const redirectTo = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/';

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onFinish = async ({ phone }) => {
    setLoading(true);
    setError(null);
    clearExpiredNotice();
    try {
      const result = await requestOtp(phone);
      navigate('/otp-verify', {
        state: {
          phone,
          // Only present while the backend runs OTP in mock mode (SZ-6 turns it
          // off before the demo); the OTP screen treats it as optional.
          devOtp: result?.devOtp || null,
          from: location.state?.from || null,
        },
      });
    } catch (err) {
      setError(err);
      if (err.isRateLimited) setCooldown(60);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" style={{ maxWidth: '900px', width: '100%' }} styles={{ body: { padding: 0 } }}>
        <Row align="stretch">

          {/* Left Decorative Banner */}
          <Col
            xs={0}
            md={12}
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              padding: '3rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                <div className="brand-logo-icon">
                  <IdcardOutlined style={{ fontSize: '20px' }} />
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>EventPass</span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '1rem', color: '#ffffff' }}>
                Unlock Amazing Live Experiences
              </h2>
              <p style={{ color: '#c7d2fe', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Sign in with your mobile number to instantly book tickets, access exclusive discounts,
                and track your upcoming events.
              </p>
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 2,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Space align="center">
                <SafetyOutlined style={{ fontSize: '24px', color: '#818cf8' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>100% Safe &amp; Instant Login</div>
                  <Text style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>
                    No password required. OTP verification only.
                  </Text>
                </div>
              </Space>
            </div>
          </Col>

          {/* Right Form Section */}
          <Col
            xs={24}
            md={12}
            style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  background: '#f5f3ff',
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                  marginBottom: '1rem',
                }}
              >
                <MobileOutlined style={{ fontSize: '28px' }} />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                Enter Mobile Number
              </Title>
              <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                We will send you a 6-digit OTP code to verify your account
              </Text>
            </div>

            {expiredNotice && (
              <Alert
                type="warning"
                showIcon
                message="Your session expired"
                description="Please sign in again to pick up where you left off."
                style={{ borderRadius: 12, marginBottom: '1.25rem' }}
              />
            )}

            {error && (
              <Alert
                type={error.isRateLimited ? 'warning' : 'error'}
                showIcon
                message={error.message}
                description={
                  error.isRateLimited
                    ? `Too many requests for this number. Try again in ${cooldown}s.`
                    : null
                }
                style={{ borderRadius: 12, marginBottom: '1.25rem' }}
              />
            )}

            <Form name="login_form" layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
              <Form.Item
                name="phone"
                label={<Text style={{ fontWeight: 600 }}>Mobile Number</Text>}
                // Same reason as the admin email: a pasted number often carries spaces, and
                // "+91" or dashes if it came from a contact card. Reduce to digits so the
                // pattern judges the number rather than its formatting.
                normalize={(value) =>
                  typeof value === 'string' ? value.replace(/\D/g, '').slice(-10) : value
                }
                rules={[
                  { required: true, message: 'Please enter your 10-digit mobile number' },
                  // The API validator is \d{10}; this is the stricter Indian-mobile
                  // subset and is compatible with it.
                  { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit Indian mobile number' },
                ]}
              >
                <Input
                  addonBefore="+91"
                  placeholder="Enter 10 digit number"
                  maxLength={10}
                  allowClear
                  style={{ borderRadius: '12px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: '1.5rem' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={cooldown > 0}
                  block
                  style={{
                    height: '50px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  {cooldown > 0 ? `Please wait ${cooldown}s` : 'Request OTP'} <ArrowRightOutlined />
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link to="/admin/login" style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>
                <LockOutlined /> Sign in as administrator
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                By continuing, you agree to EventPass&apos;s Terms of Service &amp; Privacy Policy.
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LoginPage;
