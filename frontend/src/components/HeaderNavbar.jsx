import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Input, Space, Tooltip, Dropdown, Avatar } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  IdcardOutlined,
  CompassOutlined,
  DownOutlined,
  SunOutlined,
  MoonOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { listPublicEvents } from '../api/events';
import { useApiData } from '../hooks/useApiData';
import { deriveCityOptions } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;

/**
 * Top navigation.
 *
 * Two things changed from the mock version: the city list is derived from the
 * events the API returned rather than a hardcoded three (§4, YG-7), and the
 * right-hand side reflects the real session — sign in when signed out, a profile
 * menu when signed in, and the Admin link only for `ROLE_ADMIN`.
 */
const HeaderNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, isAdmin, displayName, signOut } = useAuth();

  const [selectedCity, setSelectedCity] = useState(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cities come from live data; a failure here just leaves the picker on "All cities".
  const { data: events } = useApiData(listPublicEvents, []);
  const cityOptions = deriveCityOptions(events || []);

  const isActive = (path) => location.pathname.startsWith(path);

  const submitSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const chooseCity = (city) => {
    setSelectedCity(city);
    setCityOpen(false);
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    navigate(`/events${params.toString() ? `?${params}` : ''}`);
  };

  const navBtn = (label, icon, path) => (
    <button
      onClick={() => navigate(path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        border: 'none',
        borderRadius: 8,
        background: isActive(path) ? (isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent',
        color: isActive(path) ? '#6366f1' : (isDarkMode ? '#94a3b8' : '#475569'),
        fontWeight: isActive(path) ? 700 : 500,
        fontSize: '0.875rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {icon} {label}
    </button>
  );

  const profileMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'My profile', onClick: () => navigate('/profile') },
      { key: 'bookings', icon: <IdcardOutlined />, label: 'My bookings', onClick: () => navigate('/my-bookings') },
      ...(isAdmin
        ? [{ key: 'admin', icon: <DashboardOutlined />, label: 'Admin panel', onClick: () => navigate('/admin') }]
        : []),
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
    <>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 64,
          padding: '0 24px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: isDarkMode ? 'rgba(8,12,24,0.92)' : 'rgba(255,255,255,0.92)',
          borderBottom: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
          boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', maxWidth: 1280, margin: '0 auto', gap: 16 }}>

          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                flexShrink: 0,
              }}
            >
              <IdcardOutlined />
            </div>
            <span className="brand-text" style={{ fontSize: '1.2rem' }}>EventPass</span>
          </div>

          {/* City picker, populated from the live event feed */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setCityOpen((o) => !o)}
              disabled={cityOptions.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                background: isDarkMode ? '#1e293b' : '#f8fafc',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: cityOptions.length === 0 ? 'default' : 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                opacity: cityOptions.length === 0 ? 0.6 : 1,
              }}
            >
              📍 {selectedCity || 'All cities'}
              <DownOutlined
                style={{ fontSize: 10, color: '#94a3b8', transform: cityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {cityOpen && cityOptions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  background: isDarkMode ? '#0f172a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  minWidth: 160,
                  zIndex: 9999,
                }}
              >
                {[{ value: null, label: 'All cities' }, ...cityOptions].map((city) => (
                  <div
                    key={city.value ?? 'all'}
                    onClick={() => chooseCity(city.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontWeight: selectedCity === city.value ? 700 : 500,
                      fontSize: '0.875rem',
                      color: selectedCity === city.value ? '#6366f1' : (isDarkMode ? '#e2e8f0' : '#374151'),
                    }}
                  >
                    {city.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1, maxWidth: 360 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search events, venues…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={submitSearch}
              allowClear
              style={{
                borderRadius: 8,
                background: isDarkMode ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              }}
            />
          </div>

          <Space size={4} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            {navBtn('Explore', <CompassOutlined />, '/events')}
            {isAuthenticated && navBtn('Bookings', <IdcardOutlined />, '/my-bookings')}

            <div style={{ width: 1, height: 20, background: isDarkMode ? '#334155' : '#e2e8f0', margin: '0 4px' }} />

            {/* Admin entry point only exists for accounts that can actually use it. */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 8,
                  border: '1.5px dashed #6366f1',
                  background: 'transparent',
                  color: '#6366f1',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Admin
              </button>
            )}

            <Tooltip title={isDarkMode ? 'Light mode' : 'Dark mode'} placement="bottom">
              <button
                onClick={toggleTheme}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  background: isDarkMode ? '#1e293b' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDarkMode ? '#facc15' : '#6366f1',
                  fontSize: 16,
                }}
              >
                {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            {isAuthenticated ? (
              <Dropdown menu={profileMenu} placement="bottomRight" arrow trigger={['click']}>
                <Space style={{ cursor: 'pointer', padding: '4px 8px' }}>
                  <Avatar style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }} icon={<UserOutlined />} />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: isDarkMode ? '#e2e8f0' : '#0f172a',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                </Space>
              </Dropdown>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '7px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                }}
              >
                Sign In
              </button>
            )}
          </Space>

        </div>
      </Header>

      {cityOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setCityOpen(false)} />
      )}
    </>
  );
};

export default HeaderNavbar;
