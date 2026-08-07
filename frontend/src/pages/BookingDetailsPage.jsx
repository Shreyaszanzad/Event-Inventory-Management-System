import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Button, QRCode, Typography, Space, Divider, Breadcrumb } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { getBooking } from '../api/bookings';
import { enrichBooking } from '../api/enrich';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary from '../components/AsyncBoundary';
import { BOOKING_STATUS_COLOR, PAYMENT_STATUS_COLOR } from '../constants/categories';
import { formatDate, formatTime, formatDateTime, formatMoney, posterOf } from '../utils/format';

const { Title, Text } = Typography;

/**
 * `GET /api/bookings/{id}` — scoped to the signed-in user by the backend
 * (integration plan §3.3). The URL carries the numeric id; the reference code is
 * what we show and what the QR encodes.
 *
 * The mock version had a `paymentMethod` field. Payment *mode* lives on an
 * invoice's payments, not on the booking (§4), so this shows the booking's own
 * `paymentStatus` instead. Payment mode arrives with the billing screens (YG-10)
 * once PR #2 and the payment package are merged.
 */
const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const fetchBooking = useCallback(async () => {
    const booking = await getBooking(bookingId);
    return enrichBooking(booking);
  }, [bookingId]);

  const { data: booking, loading, error, reload } = useApiData(fetchBooking, [bookingId]);

  const items = booking?.items || [];
  const totalTickets = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        loadingTip="Loading your ticket…"
        errorTitle="Could not load this booking"
      >
        {booking && (
          <>
            <Breadcrumb
              items={[
                { title: <a onClick={() => navigate('/')}>Home</a> },
                { title: <a onClick={() => navigate('/my-bookings')}>My Bookings</a> },
                { title: booking.bookingReference },
              ]}
              style={{ marginBottom: '1.5rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/my-bookings')}
                style={{ fontWeight: 600, color: '#64748b' }}
              >
                Back to My Bookings
              </Button>

              <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontWeight: 600,
                }}
              >
                Print ticket
              </Button>
            </div>

            <Card style={{ borderRadius: '24px', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>

              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img
                  src={posterOf(booking)}
                  alt={booking.eventTitle || booking.bookingReference}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1.5rem',
                  }}
                >
                  <div>
                    <Space>
                      <Tag
                        color={BOOKING_STATUS_COLOR[booking.status] || 'default'}
                        style={{ borderRadius: '10px', fontWeight: 700, padding: '4px 12px' }}
                      >
                        {booking.status}
                      </Tag>
                      <Tag
                        color={PAYMENT_STATUS_COLOR[booking.paymentStatus] || 'default'}
                        style={{ borderRadius: '10px', fontWeight: 700, padding: '4px 12px' }}
                      >
                        {booking.paymentStatus}
                      </Tag>
                    </Space>
                    <h2 style={{ color: '#ffffff', margin: '6px 0 0 0', fontWeight: 800, fontSize: '1.8rem' }}>
                      {booking.eventTitle || `Show #${booking.showId}`}
                    </h2>
                  </div>
                </div>
              </div>

              <div style={{ padding: '2rem' }}>
                <Row gutter={[32, 32]}>

                  <Col xs={24} md={15}>
                    <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                      Event &amp; Show Information
                    </Title>

                    <Space direction="vertical" size="middle" style={{ width: '100%', fontSize: '0.95rem' }}>
                      {booking.showDatetime && (
                        <>
                          <div>
                            <CalendarOutlined style={{ color: '#6366f1', marginRight: 8 }} />
                            <strong>Show date:</strong> {formatDate(booking.showDatetime)}
                          </div>
                          <div>
                            <ClockCircleOutlined style={{ color: '#ec4899', marginRight: 8 }} />
                            <strong>Show time:</strong> {formatTime(booking.showDatetime)}
                          </div>
                        </>
                      )}
                      {(booking.venueName || booking.city) && (
                        <div>
                          <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          <strong>Venue:</strong> {[booking.venueName, booking.city].filter(Boolean).join(', ')}
                        </div>
                      )}
                      <div>
                        <CreditCardOutlined style={{ color: '#0ea5e9', marginRight: 8 }} />
                        <strong>Payment status:</strong> {booking.paymentStatus}
                      </div>
                      <div>
                        <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                        <strong>Booked on:</strong> {formatDateTime(booking.bookingDate)}
                      </div>
                    </Space>

                    <Divider style={{ margin: '1.5rem 0' }} />

                    <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                      Ticket Breakdown
                    </Title>

                    <Space direction="vertical" style={{ width: '100%' }}>
                      {items.map((item) => (
                        <div
                          key={item.ticketTypeId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            background: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {item.ticketTypeName || `Ticket #${item.ticketTypeId}`}
                            </div>
                            <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                              {item.quantity} × {formatMoney(item.unitPrice)}
                            </Text>
                          </div>
                          <span style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                            {formatMoney(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </Space>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1.5rem',
                        paddingTop: '1rem',
                        borderTop: '2px dashed #e2e8f0',
                      }}
                    >
                      <Text style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        Total ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})
                      </Text>
                      {/* Server-computed; never recalculated here (§2.5). */}
                      <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>{formatMoney(booking.totalAmount)}</span>
                    </div>
                  </Col>

                  <Col xs={24} md={9} style={{ textAlign: 'center' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#6366f1',
                          marginBottom: '8px',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Entry Pass
                      </div>
                      <QRCode
                        value={booking.bookingReference}
                        size={180}
                        status={booking.status === 'CONFIRMED' ? 'active' : 'expired'}
                      />
                      <Text style={{ display: 'block', fontWeight: 800, marginTop: '12px', fontSize: '1.05rem' }}>
                        {booking.bookingReference}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                        {booking.status === 'CONFIRMED'
                          ? 'Show this at the venue entry gate'
                          : 'Only a CONFIRMED booking grants entry'}
                      </Text>
                    </div>

                    {booking.status === 'CONFIRMED' && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <Space style={{ color: '#52c41a', fontWeight: 600, fontSize: '0.85rem' }}>
                          <SafetyCertificateOutlined style={{ fontSize: '18px' }} /> Verified venue access pass
                        </Space>
                      </div>
                    )}

                    {booking.status === 'PENDING' && (
                      <Button
                        type="primary"
                        block
                        onClick={() => navigate(`/booking/${booking.id}/confirm`)}
                        style={{
                          marginTop: '1.5rem',
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          fontWeight: 700,
                        }}
                      >
                        Confirm this booking
                      </Button>
                    )}
                  </Col>

                </Row>
              </div>
            </Card>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
};

export default BookingDetailsPage;
