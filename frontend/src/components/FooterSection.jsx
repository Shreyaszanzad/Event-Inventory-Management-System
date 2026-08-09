import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Row, Col, Space, Button, Divider } from 'antd';
import {
  IdcardOutlined,
  FacebookFilled,
  TwitterSquareFilled,
  InstagramFilled,
  YoutubeFilled,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  LockOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { CATEGORY_LABELS } from '../constants/categories';

const { Footer } = Layout;

const linkStyle = { color: '#94a3b8', textDecoration: 'none' };

/**
 * Site footer.
 *
 * The category list is built from `CATEGORY_LABELS` — the backend's four real
 * enum values — rather than the six invented ones this footer used to list
 * (Sports / Workshops / Theatre never existed in the API). Each one deep-links
 * into the events listing with that filter applied (§4, YG-7).
 *
 * The "Company" entries are plain text, not `href="#"` links: there are no such
 * pages, and a link that scrolls you to the top of the page reads as broken. The
 * newsletter box is gone for the same reason — nothing was behind it.
 */
const FooterSection = () => {
  return (
    <Footer style={{ background: '#0f172a', color: '#94a3b8', padding: '4rem 2rem 2rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Top Feature Highlights Bar */}
        <Row gutter={[24, 24]} style={{ paddingBottom: '3rem', borderBottom: '1px solid #1e293b' }}>
          <Col xs={24} md={8}>
            <Space size="middle" align="start">
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '12px', borderRadius: '12px' }}>
                <SafetyCertificateOutlined style={{ fontSize: '24px' }} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1rem' }}>100% Genuine Tickets</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Verified venue passes with guaranteed entry.</p>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Space size="middle" align="start">
              <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', padding: '12px', borderRadius: '12px' }}>
                <LockOutlined style={{ fontSize: '24px' }} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1rem' }}>Secure Payments</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Encrypted transactions via UPI, Cards & NetBanking.</p>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Space size="middle" align="start">
              <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '12px', borderRadius: '12px' }}>
                <CustomerServiceOutlined style={{ fontSize: '24px' }} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1rem' }}>24/7 Dedicated Support</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Instant assistance for your ticket bookings.</p>
              </div>
            </Space>
          </Col>
        </Row>

        {/* Main Footer Links */}
        <Row gutter={[32, 32]} style={{ padding: '3rem 0' }}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div className="brand-logo-icon">
                <IdcardOutlined style={{ fontSize: '20px' }} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                EventPass
              </span>
            </div>
            <p style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
              EventPass is an event discovery and ticket booking platform for movies, standup comedy,
              amusement parks and live events.
            </p>
            <Space size="middle" style={{ marginTop: '1rem' }}>
              <FacebookFilled style={{ fontSize: '22px', color: '#94a3b8' }} />
              <TwitterSquareFilled style={{ fontSize: '22px', color: '#94a3b8' }} />
              <InstagramFilled style={{ fontSize: '22px', color: '#94a3b8' }} />
              <YoutubeFilled style={{ fontSize: '22px', color: '#94a3b8' }} />
            </Space>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Browse Categories</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.9rem' }}>
              {Object.entries(CATEGORY_LABELS).map(([value, meta]) => (
                <li key={value}>
                  <Link to={`/events?category=${value}`} style={linkStyle}>
                    {meta.icon} {meta.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.9rem' }}>
              <li><Link to="/events" style={linkStyle}>All events</Link></li>
              <li><Link to="/my-bookings" style={linkStyle}>My bookings</Link></li>
              <li><Link to="/booking/lookup" style={linkStyle}>Find booking by code</Link></li>
              <li><Link to="/profile" style={linkStyle}>My account</Link></li>
              <li><Link to="/admin/login" style={linkStyle}>Administrator sign in</Link></li>
            </ul>
          </Col>

          <Col xs={24} md={6}>
            <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1rem' }}>Ready to book?</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Browse what&apos;s on sale, pick a show slot, and your seats are held for 10 minutes while you check out.
            </p>
            <Link to="/events">
              <Button type="primary" icon={<ArrowRightOutlined />} style={{ background: '#6366f1', borderRadius: 10, fontWeight: 600 }}>
                Explore events
              </Button>
            </Link>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#1e293b', margin: 0 }} />

        {/* Bottom Copyright */}
        <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} EventPass Management System. All rights reserved. Designed with Ant Design.
        </div>
      </div>
    </Footer>
  );
};

export default FooterSection;
