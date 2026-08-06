import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Row, Col, Alert } from 'antd';
import { MobileOutlined, SafetyOutlined, IdcardOutlined, ArrowRightOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      setLoading(false);
      navigate('/otp-verify', { state: { mobileNumber: values.mobile } });
    }, 800);
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" style={{ maxWidth: '900px', width: '100%' }} bodyStyle={{ padding: 0 }}>
        <Row align="stretch">
          
          {/* Left Decorative Banner */}
          <Col xs={0} md={12} style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            padding: '3rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                <div className="brand-logo-icon">
                  <IdcardOutlined style={{ fontSize: '20px' }} />
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  EventPass
                </span>
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '1rem', color: '#ffffff' }}>
                Unlock Amazing Live Experiences
              </h2>
              <p style={{ color: '#c7d2fe', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Sign in with your mobile number to instantly book tickets, access exclusive discounts, and track your upcoming events.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Space align="center">
                <SafetyOutlined style={{ fontSize: '24px', color: '#818cf8' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>100% Safe & Instant Login</div>
                  <Text style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>No password required. OTP verification only.</Text>
                </div>
              </Space>
            </div>
          </Col>

          {/* Right Form Section */}
          <Col xs={24} md={12} style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ background: '#f5f3ff', width: '56px', height: '56px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', marginBottom: '1rem' }}>
                <MobileOutlined style={{ fontSize: '28px' }} />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Enter Mobile Number
              </Title>
              <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                We will send you a 6-digit OTP code to verify your account
              </Text>
            </div>

            <Form
              name="login_form"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="mobile"
                label={<Text style={{ fontWeight: 600, color: '#334155' }}>Mobile Number</Text>}
                rules={[
                  { required: true, message: 'Please enter your 10-digit mobile number' },
                  { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit Indian mobile number' }
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
                  block
                  style={{
                    height: '50px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  Request OTP <ArrowRightOutlined />
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                By continuing, you agree to EventPass's <a href="#" style={{ color: '#6366f1' }}>Terms of Service</a> & <a href="#" style={{ color: '#6366f1' }}>Privacy Policy</a>.
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LoginPage;
