import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Avatar, Button, Typography, Space, Breadcrumb, Tag, Divider, Popconfirm, Alert, message } from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

/**
 * Account screen.
 *
 * Everything shown here comes from the JWT login response we already hold —
 * `{ userId, name, role }`. There is **no `GET /api/users/me` yet** (backend task
 * SZ-4), so phone, email and created-at cannot be displayed, and there is no
 * update endpoint either, which is why the mock "Edit profile" form is gone
 * rather than pretending to save.
 *
 * The mock `avatar`, `memberSince` and preferred-`city` fields have no column on
 * `User` at all and are dropped for good (integration plan §4, §6).
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { auth, isAdmin, displayName, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    message.success('Signed out.');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>

      <Breadcrumb
        items={[{ title: <a onClick={() => navigate('/')}>Home</a> }, { title: 'Profile' }]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            Account
          </Title>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            Your signed-in session
          </Text>
        </div>

        <Popconfirm
          title="Sign out?"
          description="You will need to sign in again to book or manage tickets."
          onConfirm={handleLogout}
          okText="Yes, sign out"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<LogoutOutlined />} style={{ borderRadius: '12px', fontWeight: 600 }}>
            Sign out
          </Button>
        </Popconfirm>
      </div>

      <Row gutter={[24, 24]}>

        <Col xs={24} md={8}>
          <Card style={{ borderRadius: '24px', textAlign: 'center' }} styles={{ body: { padding: '2rem 1.5rem' } }}>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
            />

            <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800, wordBreak: 'break-word' }}>
              {displayName}
            </Title>

            <Tag
              color={isAdmin ? 'gold' : 'purple'}
              style={{ borderRadius: '12px', padding: '4px 12px', fontWeight: 600, marginTop: 8 }}
            >
              {isAdmin ? '⚙️ Administrator' : '🎟️ Customer'}
            </Tag>

            <Divider style={{ margin: '1.5rem 0' }} />

            <Button
              type="primary"
              icon={<IdcardOutlined />}
              block
              onClick={() => navigate('/my-bookings')}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 600,
              }}
            >
              My bookings
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card style={{ borderRadius: '24px' }} styles={{ body: { padding: '2rem' } }}>
            <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem' }}>
              Session details
            </Title>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '14px', color: '#6366f1' }}>
                  <UserOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Display name</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {auth?.name || <Text type="secondary">Not set — the backend falls back to your phone number</Text>}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '14px', color: '#16a34a' }}>
                  <KeyOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>User ID</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{auth?.userId ?? '—'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '14px', color: '#ea580c' }}>
                  <SafetyCertificateOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Role</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{auth?.role || '—'}</span>
                </div>
              </div>

            </Space>

            <Divider style={{ margin: '2rem 0 1.5rem' }} />

            <Alert
              type="info"
              showIcon
              message="Phone, email and member-since are not available yet"
              description={
                <>
                  The API has no <code>GET /api/users/me</code> endpoint, so this page can only show what the
                  login response returned. Backend task <strong>SZ-4</strong> adds it; this panel fills in once it lands.
                </>
              }
              style={{ borderRadius: 12 }}
            />
          </Card>
        </Col>

      </Row>

    </div>
  );
};

export default ProfilePage;
