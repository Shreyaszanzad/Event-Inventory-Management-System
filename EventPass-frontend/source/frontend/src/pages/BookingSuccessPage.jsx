import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Result, Card, Button, QRCode, Typography, Space, Row, Col, Tag, Divider } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { formatDate, formatTime, formatMoney } from '../utils/format';
import { BOOKING_STATUS_COLOR } from '../constants/categories';

const { Title, Text } = Typography;

/**
 * Reached only after `POST /api/bookings/{id}/confirm` succeeds — never straight
 * off the back of creating a hold (integration plan §3.3).
 *
 * There is no fallback booking object here on purpose. The mock version rendered
 * a hardcoded ticket when it had no state, which would now mean showing someone a
 * confirmation for a booking that does not exist.
 */
const BookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  if (!booking) {
    return <Navigate to="/my-bookings" replace />;
  }

  const items = booking.items || [];
  const totalTickets = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>

      <Card style={{ borderRadius: '24px', textAlign: 'center', marginBottom: '2rem' }}>
        <Result
          status="success"
          title={<span style={{ fontWeight: 800, fontSize: '1.8rem' }}>Booking Confirmed!</span>}
          subTitle={
            <Text type="secondary" style={{ fontSize: '1rem' }}>
              Your seats are secured. Show the code below at the venue entrance.
            </Text>
          }
          extra={[
            <Tag
              key="ref"
              color="purple"
              style={{ fontSize: '0.95rem', padding: '6px 16px', borderRadius: '12px', fontWeight: 700 }}
            >
              Reference: {booking.bookingReference}
            </Tag>,
            <Tag
              key="status"
              color={BOOKING_STATUS_COLOR[booking.status] || 'default'}
              style={{ fontSize: '0.95rem', padding: '6px 16px', borderRadius: '12px', fontWeight: 700 }}
            >
              {booking.status}
            </Tag>,
          ]}
        />
      </Card>

      <Card
        style={{ borderRadius: '24px', border: '2px dashed #cbd5e1', marginBottom: '2rem' }}
        styles={{ body: { padding: '2rem' } }}
      >
        <Row gutter={[24, 24]} align="middle">

          <Col xs={24} md={16}>
            <Tag color="blue" style={{ borderRadius: '10px', marginBottom: '8px' }}>Digital Pass</Tag>
            <Title level={3} style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>
              {booking.eventTitle || 'Your event'}
            </Title>

            <Space direction="vertical" size="small" style={{ fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              {booking.showDatetime && (
                <>
                  <div>
                    <CalendarOutlined style={{ color: '#6366f1', marginRight: 8 }} />
                    <strong>Date:</strong> {formatDate(booking.showDatetime)}
                  </div>
                  <div>
                    <ClockCircleOutlined style={{ color: '#ec4899', marginRight: 8 }} />
                    <strong>Time:</strong> {formatTime(booking.showDatetime)}
                  </div>
                </>
              )}
              {(booking.venueName || booking.city) && (
                <div>
                  <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <strong>Venue:</strong> {[booking.venueName, booking.city].filter(Boolean).join(', ')}
                </div>
              )}
            </Space>

            <Divider style={{ margin: '1rem 0' }} />

            <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Passes ({totalTickets})
            </Text>
            {items.map((item) => (
              <div key={item.ticketTypeId} style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                {item.quantity} × {item.ticketTypeName || `Ticket #${item.ticketTypeId}`} —{' '}
                {formatMoney(item.unitPrice * item.quantity)}
              </div>
            ))}

            <div style={{ marginTop: '1rem', fontWeight: 800, fontSize: '1.15rem' }}>
              Total paid: {formatMoney(booking.totalAmount)}
            </div>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#f8fafc', padding: '16px', borderRadius: '20px' }}>
              {/* The booking reference is the human-facing code, so it is what the gate scans. */}
              <QRCode value={booking.bookingReference} size={140} />
            </div>
            <Text type="secondary" style={{ display: 'block', fontSize: '0.75rem', marginTop: '8px' }}>
              Scan at the venue entrance
            </Text>
          </Col>

        </Row>
      </Card>

      <Row gutter={[16, 16]} justify="center">
        <Col xs={24} sm={12}>
          <Button
            type="primary"
            size="large"
            block
            icon={<IdcardOutlined />}
            onClick={() => navigate(`/my-bookings/${booking.id}`)}
            style={{
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            View e-ticket
          </Button>
        </Col>

        <Col xs={24} sm={12}>
          <Button
            size="large"
            block
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{ height: '50px', borderRadius: '16px', fontWeight: 700 }}
          >
            Back to home
          </Button>
        </Col>
      </Row>

    </div>
  );
};

export default BookingSuccessPage;
