import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Input, Button, Space, Tooltip } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  IdcardOutlined,
  CompassOutlined,
  DownOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { CITIES } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

const { Header } = Layout;

const HeaderNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname.startsWith(path);

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
      onMouseEnter={e => { if (!isActive(path)) { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#1e293b'; } }}
      onMouseLeave={e => { if (!isActive(path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#475569'; } }}
    >
      {icon} {label}
    </button>
  );

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          gap: 16,
        }}>

          {/* ── Brand ── */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 18,
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}>
              <IdcardOutlined />
            </div>
            <span className="brand-text" style={{ fontSize: '1.2rem' }}>EventPass</span>
          </div>

          {/* ── City Selector — simple dropdown ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setCityOpen(o => !o)}
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
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedCity.icon} {selectedCity.name}
              <DownOutlined style={{ fontSize: 10, color: '#94a3b8', transform: cityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown */}
            {cityOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                background: isDarkMode ? '#0f172a' : '#fff',
                border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
                borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                minWidth: 140,
                zIndex: 9999,
              }}>
                {CITIES.map(city => (
                  <div
                    key={city.id}
                    onClick={() => { setSelectedCity(city); setCityOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontWeight: selectedCity.id === city.id ? 700 : 500,
                      fontSize: '0.875rem',
                      color: selectedCity.id === city.id ? '#6366f1' : (isDarkMode ? '#e2e8f0' : '#374151'),
                      background: selectedCity.id === city.id
                        ? (isDarkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)')
                        : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (selectedCity.id !== city.id) e.currentTarget.style.background = isDarkMode ? '#1e293b' : '#f8fafc'; }}
                    onMouseLeave={e => { if (selectedCity.id !== city.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{city.icon}</span>
                    {city.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Search ── */}
          <div style={{ flex: 1, maxWidth: 360 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search events, venues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              style={{
                borderRadius: 8,
                background: isDarkMode ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
            />
          </div>

          {/* ── Nav Links ── */}
          <Space size={4} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            {navBtn('Explore', <CompassOutlined />, '/events')}
            {navBtn('Bookings', <IdcardOutlined />, '/my-bookings')}
            {navBtn('Profile', <UserOutlined />, '/profile')}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: isDarkMode ? '#334155' : '#e2e8f0', margin: '0 4px' }} />

            {/* Admin */}
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '5px 14px',
                borderRadius: 8,
                border: `1.5px dashed #6366f1`,
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

            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'} placement="bottom">
              <button
                onClick={toggleTheme}
                style={{
                  width: 36, height: 36,
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

            {/* Sign In */}
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
          </Space>

        </div>
      </Header>

      {/* Close dropdown on outside click */}
      {cityOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          onClick={() => setCityOpen(false)}
        />
      )}
    </>
  );
};

export default HeaderNavbar;
