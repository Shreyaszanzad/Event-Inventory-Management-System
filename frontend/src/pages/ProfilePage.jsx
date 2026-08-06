import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Avatar,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Breadcrumb,
  Tag,
  Divider,
  message,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
  LogoutOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { MOCK_USER_PROFILE, CITIES } from '../data/mockData';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(MOCK_USER_PROFILE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleEditSubmit = (values) => {
    setProfile((prev) => ({
      ...prev,
      name: values.name,
      email: values.email,
      city: values.city
    }));
    setIsEditModalOpen(false);
    message.success('Profile information updated successfully!');
  };

  const handleLogout = () => {
    message.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: 'User Profile' }
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Account Settings
          </Title>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            Manage your personal profile and account preferences
          </Text>
        </div>

        <Popconfirm
          title="Logout of EventPass?"
          description="Are you sure you want to sign out?"
          onConfirm={handleLogout}
          okText="Yes, Logout"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            icon={<LogoutOutlined />}
            style={{ borderRadius: '12px', fontWeight: 600 }}
          >
            Logout
          </Button>
        </Popconfirm>
      </div>

      <Row gutter={[24, 24]}>
        
        {/* User Card Header (Left 8 Cols) */}
        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0'
            }}
            bodyStyle={{ padding: '2rem 1.5rem' }}
          >
            <Avatar size={100} src={profile.avatar} icon={<UserOutlined />} style={{ marginBottom: '1rem', border: '4px solid #6366f1' }} />
            
            <Title level={4} style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#0f172a' }}>
              {profile.name} <CheckCircleFilled style={{ color: '#6366f1', fontSize: '16px' }} />
            </Title>
            
            <Text type="secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '1rem' }}>
              Verified Member
            </Text>

            <Tag color="purple" style={{ borderRadius: '12px', padding: '4px 12px', fontWeight: 600 }}>
              Member since {profile.memberSince}
            </Tag>

            <Divider style={{ margin: '1.5rem 0' }} />

            <Button
              type="primary"
              icon={<EditOutlined />}
              block
              onClick={() => {
                form.setFieldsValue({
                  name: profile.name,
                  email: profile.email,
                  city: profile.city
                });
                setIsEditModalOpen(true);
              }}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 600
              }}
            >
              Edit Profile
            </Button>
          </Card>
        </Col>

        {/* Profile Details (Right 16 Cols) */}
        <Col xs={24} md={16}>
          <Card
            style={{
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0'
            }}
            bodyStyle={{ padding: '2rem' }}
          >
            <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
              Personal Details
            </Title>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '14px', color: '#6366f1' }}>
                  <UserOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Full Name</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{profile.name}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '14px', color: '#16a34a' }}>
                  <MailOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Email Address</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{profile.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '14px', color: '#ea580c' }}>
                  <PhoneOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Mobile Number</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>+91 {profile.mobile}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#fdf2f8', padding: '12px', borderRadius: '14px', color: '#db2777' }}>
                  <EnvironmentOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.8rem', display: 'block' }}>Preferred City</Text>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{profile.city}</span>
                </div>
              </div>

            </Space>

            <Divider style={{ margin: '2rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Quick Navigation</div>
                <Text type="secondary" style={{ fontSize: '0.85rem' }}>Jump straight to your active passes</Text>
              </div>
              <Button
                onClick={() => navigate('/my-bookings')}
                style={{ borderRadius: '12px', fontWeight: 600 }}
              >
                View My Bookings
              </Button>
            </div>
          </Card>
        </Col>

      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Edit Profile Information</h3>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        centered
        style={{ borderRadius: '20px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: '1.5rem' }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item
            name="city"
            label="Preferred City"
            rules={[{ required: true, message: 'Please select a city' }]}
          >
            <Select
              size="large"
              style={{ borderRadius: '10px' }}
              options={CITIES.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '2rem', marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700
              }}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ProfilePage;
