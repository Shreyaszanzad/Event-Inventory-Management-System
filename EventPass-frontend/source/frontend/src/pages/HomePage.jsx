import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Carousel, Button, Tabs, Typography } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { listPublicEvents } from '../api/events';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary from '../components/AsyncBoundary';
import EventCard from '../components/EventCard';
import { CATEGORY_LABELS, categoryMeta } from '../constants/categories';
import { formatDateTime, posterOf } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

/**
 * Static marketing copy, not data. It used to sit in `mockData.js`; it lives here
 * now so deleting the mock dataset doesn't take the section with it.
 */
const FEATURES = [
  { icon: '⚡', title: 'Instant E-Tickets', description: 'Your booking reference and QR pass are ready the moment you confirm.' },
  { icon: '🛡️', title: 'Seats Held While You Pay', description: 'Your seats are reserved for 10 minutes so nobody can take them mid-checkout.' },
  { icon: '🔄', title: 'Cancel Anytime Before The Show', description: 'Cancelling releases your seats straight back to the pool.' },
  { icon: '💬', title: 'Booking History In One Place', description: 'Every pass you have booked, with its live status, under My Bookings.' },
];

/**
 * Homepage, backed by `GET /api/events` (integration plan §3.2).
 *
 * The hero carousel used to run off a hardcoded `HERO_BANNERS` list; it now
 * features the first few real events, so an empty database shows an empty state
 * instead of three events that don't exist.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [wishlist, setWishlist] = useState([]);

  const { data, loading, error, reload } = useApiData(listPublicEvents, []);
  const events = data || [];

  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const filteredEvents = activeTab === 'all' ? events : events.filter((e) => e.category === activeTab);
  const heroEvents = events.slice(0, 3);

  /** Only offer a category tab when at least one live event uses it. */
  const usedCategories = [...new Set(events.map((e) => e.category).filter(Boolean))];
  const tabItems = [
    { key: 'all', label: '🔥 All Events' },
    ...usedCategories.map((key) => ({
      key,
      label: `${CATEGORY_LABELS[key]?.icon || '🎟️'} ${CATEGORY_LABELS[key]?.label || key}`,
    })),
  ];

  return (
    <div style={{ paddingBottom: '4rem' }}>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={events.length === 0}
        loadingTip="Loading events…"
        emptyDescription="No events are published yet. An administrator can add the first one from the admin panel."
        emptyAction={
          <Button
            type="primary"
            onClick={() => navigate('/admin/events')}
            style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}
          >
            Go to admin panel
          </Button>
        }
      >
        <>
          {/* ── Hero Carousel — built from the newest real events ── */}
          <section className="hero-section" style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
            <Carousel autoplay autoplaySpeed={4500} effect="fade" dots={{ className: 'hero-dots' }}>
              {heroEvents.map((event) => (
                <div key={event.id}>
                  <div className="hero-card" style={{ backgroundImage: `url(${posterOf(event)})` }}>
                    <div className="hero-overlay" />
                    <div className="hero-content">
                      <span className="hero-tag">
                        <ThunderboltOutlined /> {categoryMeta(event.category).label}
                      </span>
                      <h1 className="hero-title">{event.title}</h1>
                      <p className="hero-subtitle">
                        {event.description || 'Book your seats before they are gone.'}
                      </p>

                      <div className="hero-meta">
                        <div className="hero-meta-item">
                          <CalendarOutlined style={{ color: '#818cf8' }} />
                          {formatDateTime(event.startTime)}
                        </div>
                        <div className="hero-meta-item">
                          <EnvironmentOutlined style={{ color: '#f472b6' }} />
                          {[event.venueName, event.city].filter(Boolean).join(', ') || 'Venue TBA'}
                        </div>
                      </div>

                      <Button className="hero-cta" size="large" onClick={() => navigate(`/events/${event.id}`)}>
                        <span>
                          Book Tickets &nbsp;
                          <ArrowRightOutlined />
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </section>

          {/* ── Categories — the backend's four, as a display map (§4) ── */}
          <section style={{ maxWidth: '1280px', margin: '3.5rem auto 0', padding: '0 1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="section-accent" />
              <Title className="section-heading" level={3}>Explore Categories</Title>
              <Text className="section-subheading">Pick your favourite entertainment genre</Text>
            </div>

            <Row gutter={[16, 16]}>
              {Object.entries(CATEGORY_LABELS).map(([key, meta], i) => {
                const count = events.filter((e) => e.category === key).length;
                return (
                  <Col xs={12} sm={12} md={6} key={key}>
                    <div
                      className={`category-card fade-up fade-up-delay-${Math.min(i + 1, 4)}`}
                      style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : meta.bg }}
                      onClick={() => setActiveTab(key)}
                    >
                      <div
                        className="category-icon"
                        style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#ffffff' }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {meta.label}
                        </div>
                        <Text style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {count} {count === 1 ? 'event' : 'events'}
                        </Text>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </section>

          {/* ── Event grid ── */}
          <section style={{ maxWidth: '1280px', margin: '4rem auto', padding: '0 1.5rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div className="section-accent" />
                <Title className="section-heading" level={3}>Live &amp; Upcoming Events</Title>
                <Text className="section-subheading">Everything currently on sale</Text>
              </div>
              <Button
                type="text"
                style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}
                onClick={() => navigate('/events')}
              >
                View all <RightOutlined />
              </Button>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: '2rem' }} />

            {filteredEvents.length === 0 ? (
              <Card style={{ borderRadius: 20, textAlign: 'center', padding: '2rem' }}>
                <Text type="secondary">No events in this category yet.</Text>
              </Card>
            ) : (
              <Row gutter={[24, 28]}>
                {filteredEvents.map((event, i) => (
                  <Col xs={24} sm={12} lg={8} key={event.id}>
                    <EventCard
                      event={event}
                      className={`fade-up fade-up-delay-${Math.min((i % 3) + 1, 4)}`}
                      wishlisted={wishlist.includes(event.id)}
                      onWishlistToggle={toggleWishlist}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </section>
        </>
      </AsyncBoundary>

      {/* ── Why EventPass — static copy, shown regardless of API state ── */}
      <section className="why-section">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-accent" style={{ margin: '0 auto 10px' }} />
            <Title className="section-heading" level={3}>Why Book On EventPass?</Title>
            <Text className="section-subheading">Straightforward booking, with your seats protected while you check out</Text>
          </div>

          <Row gutter={[28, 28]}>
            {FEATURES.map((feat, i) => (
              <Col xs={24} sm={12} md={6} key={feat.title}>
                <Card className={`feature-card fade-up fade-up-delay-${Math.min(i + 1, 4)}`} variant="borderless">
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
