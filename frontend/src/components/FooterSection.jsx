import React from 'react';
import { Layout, Row, Col, Space, Input, Button, Divider } from 'antd';
import {
  IdcardOutlined,
  SendOutlined,
  FacebookFilled,
  TwitterSquareFilled,
  InstagramFilled,
  YoutubeFilled,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  LockOutlined
} from '@ant-design/icons';

const { Footer } = Layout;

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
              EventPass is India's leading event discovery and ticket booking platform. Find and book tickets for concerts, comedy, sports, and live experiences near you.
            </p>
            <Space size="middle" style={{ marginTop: '1rem' }}>
              <FacebookFilled style={{ fontSize: '22px', color: '#94a3b8', cursor: 'pointer' }} />
              <TwitterSquareFilled style={{ fontSize: '22px', color: '#94a3b8', cursor: 'pointer' }} />
              <InstagramFilled style={{ fontSize: '22px', color: '#94a3b8', cursor: 'pointer' }} />
              <YoutubeFilled style={{ fontSize: '22px', color: '#94a3b8', cursor: 'pointer' }} />
            </Space>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Popular Categories</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.9rem' }}>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Music Concerts</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Standup Comedy</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Sports & Matches</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Workshops & Seminars</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Theatre & Plays</a></li>
            </ul>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.9rem' }}>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>About Us</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>List Your Event</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Careers</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</a></li>
              <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a></li>
            </ul>
          </Col>

          <Col xs={24} md={6}>
            <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontSize: '1rem' }}>Subscribe for Exclusive Offers</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Get early bird discounts and event alerts straight to your inbox.
            </p>
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="Enter your email" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
              <Button type="primary" icon={<SendOutlined />} style={{ background: '#6366f1' }}>
                Join
              </Button>
            </Space.Compact>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#1e293b', margin: 0 }} />

        {/* Bottom Copyright */}
        <div style={{ paddingT: '1.5rem', marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} EventPass Management System. All rights reserved. Designed with Ant Design.
        </div>
      </div>
    </Footer>
  );
};

export default FooterSection;
