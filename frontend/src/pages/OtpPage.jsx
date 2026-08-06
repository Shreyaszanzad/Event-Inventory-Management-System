import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Row, Col, message, Alert } from 'antd';
import { SafetyCertificateOutlined, ArrowLeftOutlined, ReloadOutlined, CheckCircleOutlined, IdcardOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const OtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileNumber = location.state?.mobileNumber || '9876543210';

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOtp = () => {
    setTimer(30);
    setCanResend(false);
    message.success('A new 6-digit OTP code has been sent to +91 ' + mobileNumber);
  };

  const handleVerify = () => {
    if (otp.length < 6) {
      message.error('Please enter the full 6-digit OTP code');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Authentication Successful! Welcome to EventPass.');
      navigate('/');
    }, 1000);
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ padding: '2.5rem 2rem' }}>
          
          {/* Back Button */}
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
            style={{ marginBottom: '1.5rem', color: '#64748b', fontWeight: 600 }}
          >
            Change Mobile Number
          </Button>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: '#f5f3ff', width: '64px', height: '64px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', marginBottom: '1rem' }}>
              <SafetyCertificateOutlined style={{ fontSize: '32px' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              OTP Verification
            </Title>
            <Text type="secondary" style={{ fontSize: '0.9rem', display: 'block', marginTop: '6px' }}>
              Enter 6-digit code sent to <strong style={{ color: '#0f172a' }}>+91 {mobileNumber}</strong>
            </Text>
          </div>

          <Alert
            message="Test OTP: 123456"
            type="info"
            showIcon
            style={{ marginBottom: '1.5rem', borderRadius: '12px' }}
          />

          {/* OTP Input Field using Antd Input.OTP */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }} className="otp-box-input">
            <Input.OTP
              length={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              size="large"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
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
              marginBottom: '1.5rem'
            }}
          >
            Verify & Proceed <CheckCircleOutlined />
          </Button>

          {/* Resend & Timer */}
          <div style={{ textAlign: 'center' }}>
            {canResend ? (
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={handleResendOtp}
                style={{ fontWeight: 700, color: '#6366f1' }}
              >
                Resend OTP Code
              </Button>
            ) : (
              <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                Resend OTP available in <strong style={{ color: '#6366f1' }}>{timer}s</strong>
              </Text>
            )}
          </div>

        </div>
      </Card>
    </div>
  );
};

export default OtpPage;
