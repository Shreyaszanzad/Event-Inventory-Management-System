import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Carousel,
  Button,
  Tabs,
  Typography,
  Space,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  StarFilled,
  HeartOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { HERO_BANNERS, CATEGORIES, EVENTS, FEATURES } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [wishlist, setWishlist] = useState([]);

  const filteredEvents = activeTab === 'all'
    ? EVENTS
    : EVENTS.filter(e => e.category === activeTab);

  const toggleWishlist = (e, id) => {
    e.stopPropagation();
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const tabItems = [
    { key: 'all',       label: '🔥 All Featured' },
    { key: 'music',     label: '🎵 Music' },
    { key: 'comedy',    label: '🎙️ Comedy' },
    { key: 'sports',    label: '⚽ Sports' },
    { key: 'workshops', label: '🎨 Workshops' },
    { key: 'theatre',   label: '🎭 Theatre' },
  ];

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* ── Hero Carousel ── */}
      <section className="hero-section" style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
        <Carousel autoplay autoplaySpeed={4500} effect="fade" dots={{ className: 'hero-dots' }}>
          {HERO_BANNERS.map((banner) => (
            <div key={banner.id}>
              <div
                className="hero-card"
                style={{ backgroundImage: `url(${banner.image})` }}
              >
                <div className="hero-overlay" />
                <div className="hero-content">
                  <span className="hero-tag">
                    <ThunderboltOutlined /> {banner.tag}
                  </span>
                  <h1 className="hero-title">{banner.title}</h1>
                  <p className="hero-subtitle">{banner.subtitle}</p>

                  <div className="hero-meta">
                    <div className="hero-meta-item">
                      <CalendarOutlined style={{ color: '#818cf8' }} />
                      {banner.date}
                    </div>
                    <div className="hero-meta-item">
                      <EnvironmentOutlined style={{ color: '#f472b6' }} />
                      {banner.venue}
                    </div>
                  </div>

                  <Button
                    className="hero-cta"
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    <span>Book Tickets — {banner.price} &nbsp;<ArrowRightOutlined /></span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* ── Categories ── */}
      <section style={{ maxWidth: '1280px', margin: '3.5rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-accent" />
          <Title className="section-heading" level={3}>Explore Categories</Title>
          <Text className="section-subheading">Pick your favorite entertainment genre</Text>
        </div>

        <Row gutter={[16, 16]}>
          {CATEGORIES.map((cat, i) => (
            <Col xs={12} sm={8} md={4} key={cat.id}>
              <div
                className={`category-card fade-up fade-up-delay-${Math.min(i + 1, 4)}`}
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : cat.bg }}
                onClick={() => setActiveTab(cat.id)}
              >
                <div className="category-icon" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff' }}>
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {cat.name}
                  </div>
                  <Text style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.count}</Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── Featured Events ── */}
      <section style={{ maxWidth: '1280px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div className="section-accent" />
            <Title className="section-heading" level={3}>Trending &amp; Featured Events</Title>
            <Text className="section-subheading">Handpicked live experiences you don&apos;t want to miss</Text>
          </div>
          <Button
            type="text"
            style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}
            onClick={() => navigate('/events')}
          >
            View all <RightOutlined />
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: '2rem' }}
        />

        <Row gutter={[24, 28]}>
          {filteredEvents.map((evt, i) => (
            <Col xs={24} sm={12} lg={8} key={evt.id}>
              <Card
                className={`event-card fade-up fade-up-delay-${Math.min((i % 3) + 1, 4)}`}
                hoverable
                onClick={() => navigate(`/events/${evt.id}`)}
                cover={
                  <div className="event-card-img-container">
                    <img alt={evt.title} src={evt.image} className="event-card-img" />

                    {/* Tag badge */}
                    <span className="event-badge" style={{ backgroundColor: evt.tagColor }}>
                      {evt.tag}
                    </span>

                    {/* Wishlist */}
                    <div
                      className="event-wishlist-btn"
                      onClick={(e) => toggleWishlist(e, evt.id)}
                      style={{ color: wishlist.includes(evt.id) ? '#ec4899' : 'white', background: wishlist.includes(evt.id) ? 'rgba(236,72,153,0.85)' : undefined }}
                    >
                      ♥
                    </div>

                    {/* Rating */}
                    <span className="event-rating-badge">
                      <StarFilled /> {evt.rating} ({evt.reviewsCount})
                    </span>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {/* Category label */}
                  <Text style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--primary)', fontWeight: 700 }}>
                    {evt.categoryName}
                  </Text>

                  {/* Event Title */}
                  <Title level={5} style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', lineHeight: '1.3', color: 'var(--text-primary)' }}>
                    {evt.title}
                  </Title>

                  {/* Date & Venue */}
                  <Space style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                    <CalendarOutlined /> {evt.date} · {evt.time}
                  </Space>
                  <Space style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                    <EnvironmentOutlined /> {evt.venue}
                  </Space>

                  {/* Price & CTA */}
                  <div className="card-price-row">
                    <div>
                      <Text style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Starts from</Text>
                      <Space align="baseline">
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ₹{evt.price}
                        </span>
                        {evt.originalPrice && (
                          <Text delete style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            ₹{evt.originalPrice}
                          </Text>
                        )}
                      </Space>
                    </div>

                    <Button
                      type="primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/events/${evt.id}`); }}
                      style={{
                        borderRadius: '50px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        padding: '0 18px'
                      }}
                    >
                      Book Pass
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── Why EventPass ── */}
      <section className="why-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-accent" style={{ margin: '0 auto 10px' }} />
            <Title className="section-heading" level={3}>Why Book On EventPass?</Title>
            <Text className="section-subheading">Your trusted destination for hassle-free live ticket bookings</Text>
          </div>

          <Row gutter={[28, 28]}>
            {FEATURES.map((feat, i) => (
              <Col xs={24} sm={12} md={6} key={i}>
                <Card
                  className={`feature-card fade-up fade-up-delay-${Math.min(i + 1, 4)}`}
                  bordered={false}
                >
                  <div className="feature-icon-wrap">{feat.icon}</div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {feat.title}
                  </h4>
                  <Text style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {feat.description}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
