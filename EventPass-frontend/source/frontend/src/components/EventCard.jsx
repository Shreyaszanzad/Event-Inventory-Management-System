import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { categoryMeta } from '../constants/categories';
import { formatDateTime, posterOf } from '../utils/format';

const { Title, Text } = Typography;

/**
 * One event tile, shared by the homepage and the events listing.
 *
 * Renders only fields the API actually returns. The mock data's `rating`,
 * `reviewsCount`, `price`, `originalPrice` and `tag` have no backing column, so
 * they are gone (integration plan §6) — an event's price lives on its ticket
 * tiers, which are per-show, and showing a fake one here would mislead.
 */
const EventCard = ({ event, onWishlistToggle, wishlisted = false, className = '' }) => {
  const navigate = useNavigate();
  const meta = categoryMeta(event.category);
  const open = () => navigate(`/events/${event.id}`);

  return (
    <Card
      className={`event-card ${className}`.trim()}
      hoverable
      onClick={open}
      cover={
        <div className="event-card-img-container">
          <img alt={event.title} src={posterOf(event)} className="event-card-img" />

          <span className="event-badge" style={{ backgroundColor: meta.color }}>
            {meta.icon} {meta.label}
          </span>

          {onWishlistToggle && (
            <div
              className="event-wishlist-btn"
              onClick={(e) => {
                e.stopPropagation();
                onWishlistToggle(event.id);
              }}
              style={{
                color: wishlisted ? '#ec4899' : 'white',
                background: wishlisted ? 'rgba(236,72,153,0.85)' : undefined,
              }}
            >
              ♥
            </div>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: 'var(--primary)',
              fontWeight: 700,
            }}
          >
            {meta.label}
          </Text>
          {event.city && (
            <Tag color="purple" style={{ borderRadius: 12, marginInlineEnd: 0 }}>
              {event.city}
            </Tag>
          )}
        </div>

        <Title
          level={5}
          style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3, color: 'var(--text-primary)' }}
        >
          {event.title}
        </Title>

        <Space style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
          <CalendarOutlined /> {formatDateTime(event.startTime)}
        </Space>
        <Space style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
          <EnvironmentOutlined /> {event.venueName || 'Venue to be announced'}
        </Space>

        <div className="card-price-row">
          <Text style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Pick a show to see ticket tiers
          </Text>

          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            style={{
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              padding: '0 18px',
            }}
          >
            View
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
