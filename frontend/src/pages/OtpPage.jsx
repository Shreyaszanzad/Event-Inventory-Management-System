import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Card, Typography, message, Alert } from 'antd';
import {
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { verifyOtp, requestOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

/**
 * Step 2 of user login: verify the OTP and store the JWT (integration plan §3.1).
 *
 * The resend timer is set to 60s to match `app.otp.resend-cooldown-seconds`;
 * resending earlier just earns a 429. While the backend runs in mock mode the
 * previous screen hands us `devOtp`, which we prefill to keep testing quick —
 * once SZ-6 turns mock mode off that field is simply absent and the box starts empty.
 */
const RESEND_COOLDOWN_SECONDS = 60;

const OtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const phone = location.state?.phone;
  const redirectTo = location.state?.from?.pathname || '/';

  // Deliberately NOT prefilled from `devOtp`. Auto-filling the box makes the
  // verification step look staged, hides the wrong-OTP and rate-limit paths from
  // testing, and would change behaviour the moment SZ-6 turns mock mode off.
  // The code is shown in the notice below instead, so testing stays quick.
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || null);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);

  // Landing here directly (refresh, bookmark) means we have no phone to verify.
  useEffect(() => {
    if (!phone) navigate('/login', { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(interval);
  }, [timer]);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const result = await requestOtp(phone);
      setDevOtp(result?.devOtp || null);
      // The previous code is now dead — the backend invalidates it on resend.
      setOtp('');
      setTimer(RESEND_COOLDOWN_SECONDS);
      message.success(`A new OTP has been sent to +91 ${phone}`);
    } catch (err) {
      setError(err);
      // A 429 here means the per-phone window is exhausted, not just the cooldown.
      if (err.isRateLimited) setTimer(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError({ message: 'Please enter the full 6-digit OTP code.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const authResponse = await verifyOtp(phone, otp);
      signIn(authResponse);
      message.success('Signed in successfully.');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
      // Wrong codes are capped and then burned, so clear the box to make it
      // obvious the previous attempt is spent.
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="auth-container">
      <Card className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ padding: '2.5rem 2rem' }}>

          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
            style={{ marginBottom: '1.5rem', color: '#64748b', fontWeight: 600 }}
          >
            Change Mobile Number
          </Button>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                background: '#f5f3ff',
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                marginBottom: '1rem',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: '32px' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
              OTP Verification
            </Title>
            <Text type="secondary" style={{ fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>
              Enter the 6-digit code sent to <strong>+91 {phone}</strong>
            </Text>
          </div>

          {/* Dev-mode only: disappears once `app.otp.mock-enabled` is false (SZ-6). */}
          {devOtp && (
            <Alert
              type="info"
              showIcon
              message={
                <span>
                  Dev mode — your code is{' '}
                  <strong style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '2px' }}>
                    {devOtp}
                  </strong>
                </span>
              }
              description="No SMS is sent while OTP is mocked, so the backend returns the code in its response. Type it in below."
              style={{ marginBottom: '1.5rem', borderRadius: '12px' }}
            />
          )}

          {error && (
            <Alert
              type={error.isRateLimited ? 'warning' : 'error'}
              showIcon
              message={error.message}
              style={{ marginBottom: '1.5rem', borderRadius: '12px' }}
            />
          )}

          <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="otp-box-input">
            <Input.OTP
              length={6}
              value={otp}
              onChange={setOtp}
              size="large"
              autoFocus
            />
          </div>

          <Button
            type="primary"
            onClick={handleVerify}
            loading={loading}
            disabled={otp.length < 6}
            block
            style={{
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
              marginBottom: '1.5rem',
            }}
          >
            Verify &amp; Proceed <CheckCircleOutlined />
          </Button>

          <div style={{ textAlign: 'center' }}>
            {timer > 0 ? (
              <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                Resend OTP available in <strong style={{ color: '#6366f1' }}>{timer}s</strong>
              </Text>
            ) : (
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={handleResend}
                loading={resending}
                style={{ fontWeight: 700, color: '#6366f1' }}
              >
                Resend OTP Code
              </Button>
            )}
          </div>

        </div>
      </Card>
    </div>
  );
};

export default OtpPage;
