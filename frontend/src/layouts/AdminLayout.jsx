import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography
} from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  TagOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/**
 * Admin chrome. Reached only through `<AdminRoute>`, so anything rendered inside
 * is guaranteed to belong to a signed-in `ROLE_ADMIN` session (YG-3).
 */
const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { displayName, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/events', icon: <CalendarOutlined />, label: 'Manage Events' },
    { key: '/admin/shows', icon: <ClockCircleOutlined />, label: 'Show Slots' },
    { key: '/admin/ticket-types', icon: <TagOutlined />, label: 'Ticket Tiers' },
    { key: '/my-bookings', icon: <IdcardOutlined />, label: 'My Bookings' },
    { key: '/profile', icon: <UserOutlined />, label: 'Account' },
    { key: '/', icon: <HomeOutlined />, label: 'Back to Public Site' },
  ];

  const adminProfileMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Account', onClick: () => navigate('/profile') },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign out',
        danger: true,
        onClick: () => {
          signOut();
          navigate('/');
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: '#0f172a',
          boxShadow: '4px 0 20px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100
        }}
      >
        <div style={{ padding: '1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-logo-icon" style={{ minWidth: '36px', height: '36px', borderRadius: '10px' }}>
            <IdcardOutlined style={{ fontSize: '18px' }} />
          </div>
          {!collapsed && (
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              EventPass Admin
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#0f172a', borderRight: 0, marginTop: '1rem' }}
        />
      </Sider>

      {/* Main Container */}
      <Layout>
        
        {/* Top Navbar */}
        <Header
          style={{
            padding: '0 2rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px', width: 40, height: 40 }}
          />

          <Space size="large" align="center">
            <Button
              type="text"
              shape="circle"
              icon={isDarkMode ? <SunOutlined style={{ color: '#facc15', fontSize: '18px' }} /> : <MoonOutlined style={{ color: '#6366f1', fontSize: '18px' }} />}
              onClick={toggleTheme}
              style={{ width: 40, height: 40 }}
            />

            <Dropdown menu={adminProfileMenu} placement="bottomRight" arrow trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }} icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{displayName}</span>
                  <Text type="secondary" style={{ fontSize: '0.75rem' }}>Administrator</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Viewport */}
        <Content style={{ padding: '2rem', minHeight: 'calc(100vh - 64px)' }}>
          {children || <Outlet />}
        </Content>

      </Layout>
    </Layout>
  );
};

export default AdminLayout;
