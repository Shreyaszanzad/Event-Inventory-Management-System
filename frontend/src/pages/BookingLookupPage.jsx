import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Space, Breadcrumb, Tag, Alert, Divider } from 'antd';
import {
  SearchOutlined,
  IdcardOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { getBookingByReference } from '../api/bookings';
import { enrichBooking } from '../api/enrich';
import { InlineError } from '../components/AsyncBoundary';
import { BOOKING_STATUS_COLOR, PAYMENT_STATUS_COLOR } from '../constants/categories';
import { formatDateTime, formatMoney } from '../utils/format';

const { Title, Text } = Typography;

/**
 * Look a booking up by its reference code — `GET /api/bookings/reference/{ref}`
 * (integration plan §3.3).
 *
 * The endpoint is scoped to the caller server-side, so this only ever finds your
 * own bookings; a stranger's code returns 404 rather than leaking anything.
 *
 * `bookingReference` is the human-facing string (`EVB-2QPG445X`) — it is what
 * people read off a ticket. The numeric `id` is what we then navigate with (§2.5).
 */
const BookingLookupPage = () => {
  const navigate = useNavigate();

  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    const code = reference.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const found = await getBookingByReference(code);
      setBooking(await enrichBooking(found));
    } catch (err) {
      // A 404 here means "not yours, or not a real code" — say that plainly
      // rather than surfacing a bare "not found".
      setError(
        err.isNotFound
          ? { message: `No booking of yours matches ${code}. Check the code and try again.` }
          : err,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>

      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/my-bookings')}>My Bookings</a> },
          { title: 'Find by code' },
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          Find a booking
        </Title>
        <Text type="secondary" style={{ fontSize: '0.95rem' }}>
          Enter the reference code from your ticket, e.g. <code>EVB-2QPG445X</code>
        </Text>
      </div>

      <Card style={{ borderRadius: 20, marginBottom: '1.5rem' }}>
        <Space.Compact style={{ width: '100%' }} size="large">
          <Input
            prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
            placeholder="EVB-XXXXXXXX"
            value={reference}
            // Codes are uppercase; normalising as they type avoids a pointless 404.
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            onPressEnter={handleSearch}
            allowClear
            style={{ borderRadius: '12px 0 0 12px', fontFamily: 'monospace', letterSpacing: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            disabled={!reference.trim()}
            onClick={handleSearch}
            style={{
              borderRadius: '0 12px 12px 0',
              background: reference.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : undefined,
              fontWeight: 700,
            }}
          >
            Find
          </Button>
        </Space.Compact>
      </Card>

      <InlineError error={error} onClose={() => setError(null)} />

      {booking && (
        <Card style={{ borderRadius: 20 }}>
          <Space wrap style={{ marginBottom: 12 }}>
            <Tag color={BOOKING_STATUS_COLOR[booking.status] || 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
              {booking.status}
            </Tag>
            <Tag color={PAYMENT_STATUS_COLOR[booking.paymentStatus] || 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
              {booking.paymentStatus}
            </Tag>
            <Text type="secondary" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {booking.bookingReference}
            </Text>
          </Space>

          <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>
            {booking.eventTitle || `Show #${booking.showId}`}
          </Title>

          <Space direction="vertical" size={4} style={{ fontSize: '0.9rem', color: '#475569' }}>
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
          </Space>

          <Divider style={{ margin: '1.25rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Total</Text>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatMoney(booking.totalAmount)}</span>
            </div>

            <Space>
              {booking.status === 'PENDING' && (
                <Button
                  type="primary"
                  onClick={() => navigate(`/booking/${booking.id}/confirm`)}
                  style={{
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    fontWeight: 700,
                  }}
                >
                  Confirm now
                </Button>
              )}
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/my-bookings/${booking.id}`)}
                style={{
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontWeight: 600,
                }}
              >
                Open e-ticket
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {!booking && !error && !loading && (
        <Alert
          type="info"
          showIcon
          message="Only your own bookings are searchable"
          description="The server matches the code against the account you are signed in with, so someone else's code will not resolve."
          style={{ borderRadius: 12 }}
        />
      )}

    </div>
  );
};

export default BookingLookupPage;
