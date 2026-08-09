import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Avatar, Button, Typography, Space, Breadcrumb, Tag, Divider, Popconfirm, Modal, Form, Input, message } from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  MobileOutlined,
  MailOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../api/users';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../components/AsyncBoundary';
import { formatDate } from '../utils/format';

const { Title, Text } = Typography;

/**
 * Account screen.
 *
 * Backed by `GET /api/users/me`, so phone, email and member-since are real rather
 * than whatever the login response happened to carry. `PUT /api/users/me` edits
 * the display name and email.
 *
 * Phone is shown but not editable: it is the credential the OTP flow
 * authenticates against, so changing it here would move the account to a number
 * nobody has proven they control.
 *
 * The mock `avatar` and preferred-`city` fields have no column on `User` and stay
 * dropped (integration plan §4, §6).
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { auth, isAdmin, displayName, signOut } = useAuth();

  const { data: me, loading, error, reload, setData } = useApiData(useCallback(() => getMe(), []), []);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form] = Form.useForm();

  const openEdit = () => {
    setSaveError(null);
    form.setFieldsValue({ name: me?.name || '', email: me?.email || '' });
    setEditing(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateMe({ name: values.name || null, email: values.email || null });
      setData(updated);
      setEditing(false);
      message.success('Profile updated.');
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

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
          <Card
            style={{ borderRadius: '24px' }}
            styles={{ body: { padding: '2rem' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Title level={4} style={{ fontWeight: 800, margin: 0 }}>
                Account details
              </Title>
              <Button icon={<EditOutlined />} onClick={openEdit} disabled={!me} style={{ borderRadius: 10 }}>
                Edit
              </Button>
            </div>

            <InlineError error={saveError} onClose={() => setSaveError(null)} />

            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={reload}
              loadingTip="Loading your account…"
            >
              {me && (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>

                  {[
                    {
                      icon: <UserOutlined style={{ fontSize: '20px' }} />,
                      tint: '#f5f3ff', colour: '#6366f1',
                      label: 'Display name',
                      value: me.name,
                      fallback: 'Not set — add one with Edit',
                    },
                    {
                      icon: <MobileOutlined style={{ fontSize: '20px' }} />,
                      tint: '#eff6ff', colour: '#2563eb',
                      label: 'Phone',
                      value: me.phone,
                      fallback: 'No phone on this account',
                      hint: me.phone ? 'Used to sign in — cannot be changed here' : null,
                    },
                    {
                      icon: <MailOutlined style={{ fontSize: '20px' }} />,
                      tint: '#fdf2f8', colour: '#db2777',
                      label: 'Email',
                      value: me.email,
                      fallback: 'Not set',
                    },
                    {
                      icon: <CalendarOutlined style={{ fontSize: '20px' }} />,
                      tint: '#ecfeff', colour: '#0891b2',
                      label: 'Member since',
                      value: me.createdAt ? formatDate(me.createdAt) : null,
                      fallback: '—',
                    },
                    {
                      icon: <KeyOutlined style={{ fontSize: '20px' }} />,
                      tint: '#f0fdf4', colour: '#16a34a',
                      label: 'User ID',
                      value: String(me.id),
                      fallback: '—',
                    },
                    {
                      icon: <SafetyCertificateOutlined style={{ fontSize: '20px' }} />,
                      tint: '#fff7ed', colour: '#ea580c',
                      label: 'Role',
                      value: me.role,
                      fallback: '—',
                    },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: row.tint, padding: '12px', borderRadius: '14px', color: row.colour }}>
                        {row.icon}
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>{row.label}</Text>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                          {row.value || <Text type="secondary">{row.fallback}</Text>}
                        </span>
                        {row.hint && (
                          <div>
                            <Text type="secondary" style={{ fontSize: '0.75rem' }}>{row.hint}</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {me.status && me.status !== 'ACTIVE' && (
                    <Tag color="red" style={{ borderRadius: 10, fontWeight: 700 }}>
                      Account {me.status.toLowerCase()}
                    </Tag>
                  )}

                </Space>
              )}
            </AsyncBoundary>
          </Card>
        </Col>

      </Row>

      <Modal
        open={editing}
        title="Edit profile"
        onCancel={() => setEditing(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: '1rem' }}>
          <Form.Item name="name" label="Display name">
            <Input placeholder="How should we address you?" maxLength={255} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'That does not look like an email address' }]}
          >
            <Input placeholder="you@example.com" maxLength={255} />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: '0.78rem' }}>
            Your phone number signs you in, so it cannot be changed here.
          </Text>

          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            block
            size="large"
            style={{ borderRadius: 12, marginTop: '1.25rem', fontWeight: 700 }}
          >
            Save changes
          </Button>
        </Form>
      </Modal>

    </div>
  );
};

export default ProfilePage;
