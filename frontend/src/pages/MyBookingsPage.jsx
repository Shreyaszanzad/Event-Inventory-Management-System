import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Button, Typography, Space, Popconfirm, Breadcrumb, Tabs, message } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { listMyBookings, cancelBooking } from '../api/bookings';
import { enrichBookings } from '../api/enrich';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary, { EmptyState, InlineError } from '../components/AsyncBoundary';
import { BOOKING_STATUS_COLOR, PAYMENT_STATUS_COLOR } from '../constants/categories';
import { formatDateTime, formatMoney, formatCountdown, secondsUntil } from '../utils/format';
import { Poster } from '../components/Poster';

const { Title, Text } = Typography;

/**
 * `GET /api/bookings/me` (integration plan §3.3, YG-8).
 *
 * Statuses are the backend's exact enum names — PENDING, CONFIRMED, CANCELLED,
 * EXPIRED. The mock data's `Completed` never existed and its title-case values
 * would never have matched (§4).
 *
 * We show `bookingReference` to the user but always call the API with the numeric
 * `id` (§2.5).
 */
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: '⏳ Awaiting confirmation' },
  { key: 'CONFIRMED', label: '🎟️ Confirmed' },
  { key: 'CANCELLED', label: '❌ Cancelled' },
  { key: 'EXPIRED', label: '⌛ Expired' },
];

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [actionError, setActionError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    const bookings = await listMyBookings();
    // Until SZ-1 enriches BookingResponse, event title/venue/date come from a
    // cached show → event lookup. See `src/api/enrich.js`.
    return enrichBookings(bookings);
  }, []);

  const { data, loading, error, reload } = useApiData(fetchBookings, []);
  const bookings = useMemo(() => data || [], [data]);

  const filtered = activeTab === 'all' ? bookings : bookings.filter((b) => b.status === activeTab);

  const handleCancel = async (booking) => {
    setCancellingId(booking.id);
    setActionError(null);
    try {
      await cancelBooking(booking.id);
      message.success(`Booking ${booking.bookingReference} cancelled — seats released.`);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setCancellingId(null);
    }
  };

  const counts = useMemo(() => {
    const map = { all: bookings.length };
    bookings.forEach((b) => {
      map[b.status] = (map[b.status] || 0) + 1;
    });
    return map;
  }, [bookings]);

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>

      <Breadcrumb
        items={[{ title: <a onClick={() => navigate('/')}>Home</a> }, { title: 'My Bookings' }]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            My Event Bookings
          </Title>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            Every pass you have booked, with its live status
          </Text>
        </div>
        <Space>
          <Button
            icon={<SearchOutlined />}
            onClick={() => navigate('/booking/lookup')}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            Find by code
          </Button>
          <Button icon={<ReloadOutlined />} onClick={reload} style={{ borderRadius: 12, fontWeight: 600 }}>
            Refresh
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={TABS.map((tab) => ({
          key: tab.key,
          label: counts[tab.key] ? `${tab.label} (${counts[tab.key]})` : tab.label,
        }))}
        style={{ marginBottom: '2rem' }}
      />

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={bookings.length === 0}
        loadingTip="Loading your bookings…"
        emptyDescription="You have not booked anything yet."
        emptyAction={
          <Button
            type="primary"
            onClick={() => navigate('/events')}
            style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}
          >
            Explore live events
          </Button>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState description="No bookings with this status." />
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {filtered.map((booking) => {
              const holdSecondsLeft = booking.status === 'PENDING' ? secondsUntil(booking.expiresAt) : 0;
              const totalTickets = (booking.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);

              return (
                <Card
                  key={booking.id}
                  style={{ borderRadius: '20px', overflow: 'hidden' }}
                  styles={{ body: { padding: '1.5rem' } }}
                >
                  <Row gutter={[24, 24]} align="middle">

                    <Col xs={24} sm={6} md={5}>
                      <Poster
                        source={booking}
                        alt={booking.eventTitle || booking.bookingReference}
                        style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '16px' }}
                      />
                    </Col>

                    <Col xs={24} sm={18} md={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <Tag
                          color={BOOKING_STATUS_COLOR[booking.status] || 'default'}
                          style={{ borderRadius: '10px', fontWeight: 700, padding: '2px 10px' }}
                        >
                          {booking.status}
                        </Tag>
                        <Tag color={PAYMENT_STATUS_COLOR[booking.paymentStatus] || 'default'} style={{ borderRadius: 10 }}>
                          {booking.paymentStatus}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {booking.bookingReference}
                        </Text>
                      </div>

                      <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, fontSize: '1.15rem' }}>
                        {booking.eventTitle || `Show #${booking.showId}`}
                      </h3>

                      <Space direction="vertical" size={2} style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {booking.showDatetime && (
                          <div>
                            <CalendarOutlined style={{ color: '#6366f1', marginRight: 6 }} />
                            {formatDateTime(booking.showDatetime)}
                          </div>
                        )}
                        {(booking.venueName || booking.city) && (
                          <div>
                            <EnvironmentOutlined style={{ color: '#ec4899', marginRight: 6 }} />
                            {[booking.venueName, booking.city].filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div>
                          <strong>{totalTickets}</strong> ticket{totalTickets === 1 ? '' : 's'}
                          {booking.items?.length
                            ? ` — ${booking.items.map((i) => i.ticketTypeName || `#${i.ticketTypeId}`).join(', ')}`
                            : ''}
                        </div>
                      </Space>

                      {booking.status === 'PENDING' && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: holdSecondsLeft > 0 ? '#fff7ed' : '#fef2f2',
                            border: `1px solid ${holdSecondsLeft > 0 ? '#fed7aa' : '#fecaca'}`,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: holdSecondsLeft > 0 ? '#c2410c' : '#b91c1c',
                          }}
                        >
                          <ClockCircleOutlined style={{ marginRight: 6 }} />
                          {holdSecondsLeft > 0
                            ? `Not confirmed yet — seats released in ${formatCountdown(holdSecondsLeft)}`
                            : 'Hold expired — the sweeper will release these seats shortly'}
                        </div>
                      )}
                    </Col>

                    <Col xs={24} md={7} style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>
                          {booking.paymentStatus === 'PAID' ? 'Total paid' : 'Total amount'}
                        </Text>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatMoney(booking.totalAmount)}</span>
                      </div>

                      <Space direction="vertical" style={{ width: '100%' }}>
                        {booking.status === 'PENDING' && holdSecondsLeft > 0 ? (
                          <Button
                            type="primary"
                            block
                            onClick={() => navigate(`/booking/${booking.id}/confirm`)}
                            style={{
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              fontWeight: 700,
                            }}
                          >
                            Confirm now
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            block
                            onClick={() => navigate(`/my-bookings/${booking.id}`)}
                            style={{
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              fontWeight: 600,
                            }}
                          >
                            View e-ticket
                          </Button>
                        )}

                        {/* Only a live booking can be cancelled — the API rejects the rest. */}
                        {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                          <Popconfirm
                            title="Cancel this booking?"
                            description="Your seats go back on sale immediately."
                            onConfirm={() => handleCancel(booking)}
                            okText="Yes, cancel"
                            cancelText="Keep it"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              danger
                              type="text"
                              icon={<CloseCircleOutlined />}
                              block
                              loading={cancellingId === booking.id}
                              style={{ fontWeight: 600 }}
                            >
                              Cancel booking
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </Col>

                  </Row>
                </Card>
              );
            })}
          </Space>
        )}
      </AsyncBoundary>

    </div>
  );
};

export default MyBookingsPage;
