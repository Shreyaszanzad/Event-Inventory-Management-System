import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Steps,
  Divider,
  Statistic,
  Progress,
  Modal,
  Result,
  message,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { getBooking, confirmBooking, cancelBooking } from '../api/bookings';
import { enrichBooking } from '../api/enrich';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../components/AsyncBoundary';
import { formatDate, formatTime, formatMoney, secondsUntil, formatCountdown } from '../utils/format';

const { Title, Text } = Typography;

/** The hold window the backend grants (`app.booking.hold-minutes`), for the progress ring. */
const HOLD_WINDOW_SECONDS = 10 * 60;

/**
 * Step 3 of booking — the screen the mock flow never had (integration plan YG-6).
 *
 * `POST /api/bookings` did not complete anything: it placed a **PENDING hold**
 * with `expiresAt` set and the seats already decremented. Unless the user calls
 * `POST /api/bookings/{id}/confirm`, a sweeper running every 60 seconds flips the
 * booking to EXPIRED and hands the seats back.
 *
 * So this page does three things:
 *   1. counts down from `expiresAt` so the deadline is visible, not a surprise;
 *   2. confirms — and only then moves on to the success screen;
 *   3. cancels explicitly, releasing the seats immediately rather than making
 *      everyone wait out the sweeper.
 */
const BookingConfirmPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [actionError, setActionError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(location.state?.booking?.expiresAt));

  const fetchBooking = useCallback(async () => {
    // We usually arrive with the freshly-created hold in router state; re-fetch
    // anyway so a refresh or a back-navigation shows the true current status.
    const booking = await getBooking(bookingId);
    return enrichBooking(booking);
  }, [bookingId]);

  const { data: booking, loading, error, reload, setData } = useApiData(fetchBooking, [bookingId]);

  const isPending = booking?.status === 'PENDING';
  const expired = isPending && secondsLeft <= 0;

  // Re-sync the clock whenever the booking (re)loads.
  useEffect(() => {
    if (booking?.expiresAt) setSecondsLeft(secondsUntil(booking.expiresAt));
  }, [booking?.expiresAt]);

  // Tick once a second while the hold is live.
  useEffect(() => {
    if (!isPending || !booking?.expiresAt) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft(secondsUntil(booking.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPending, booking?.expiresAt]);

  const items = useMemo(() => booking?.items || [], [booking]);
  const totalTickets = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleConfirm = async () => {
    setConfirming(true);
    setActionError(null);
    try {
      const confirmed = await confirmBooking(booking.id);
      message.success('Booking confirmed — your seats are secured.');
      navigate('/booking/success', {
        state: { booking: { ...booking, ...confirmed } },
        replace: true,
      });
    } catch (err) {
      setActionError(err);
      // The hold may have expired between render and click; reload so the page
      // stops offering a button that can no longer work.
      reload();
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    Modal.confirm({
      title: 'Release these seats?',
      content: 'Your held seats go straight back on sale. You can book again, but availability is not guaranteed.',
      okText: 'Yes, cancel the hold',
      cancelText: 'Keep my seats',
      okButtonProps: { danger: true },
      onOk: async () => {
        setCancelling(true);
        setActionError(null);
        try {
          const cancelled = await cancelBooking(booking.id);
          setData({ ...booking, ...cancelled });
          message.success('Hold cancelled and seats released.');
        } catch (err) {
          setActionError(err);
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const countdownColor = secondsLeft <= 60 ? '#dc2626' : secondsLeft <= 180 ? '#f97316' : '#6366f1';

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        loadingTip="Loading your hold…"
        errorTitle="Could not load this booking"
      >
        {booking && (
          <>
            <Card style={{ borderRadius: '20px', marginBottom: '2rem' }}>
              <Steps
                current={2}
                status={expired || booking.status === 'EXPIRED' || booking.status === 'CANCELLED' ? 'error' : 'process'}
                items={[
                  { title: 'Select Show' },
                  { title: 'Select Tickets' },
                  { title: 'Confirm', description: 'Secure your seats' },
                ]}
              />
            </Card>

            <InlineError error={actionError} onClose={() => setActionError(null)} />

            {/* ── Terminal states ── */}
            {booking.status === 'CONFIRMED' && (
              <Result
                status="success"
                title="This booking is already confirmed"
                subTitle={`Booking reference ${booking.bookingReference}`}
                extra={[
                  <Button
                    key="ticket"
                    type="primary"
                    onClick={() => navigate(`/my-bookings/${booking.id}`)}
                    style={{ borderRadius: 12, fontWeight: 600 }}
                  >
                    View e-ticket
                  </Button>,
                  <Button key="all" onClick={() => navigate('/my-bookings')} style={{ borderRadius: 12 }}>
                    My bookings
                  </Button>,
                ]}
              />
            )}

            {(booking.status === 'EXPIRED' || booking.status === 'CANCELLED') && (
              <Result
                status="warning"
                title={booking.status === 'EXPIRED' ? 'This hold expired' : 'This hold was cancelled'}
                subTitle={
                  booking.status === 'EXPIRED'
                    ? 'The seats were released back on sale because the booking was not confirmed in time.'
                    : 'The seats have been released back on sale.'
                }
                extra={
                  <Button
                    type="primary"
                    onClick={() => navigate(booking.eventId ? `/booking/${booking.eventId}/shows` : '/events')}
                    style={{ borderRadius: 12, fontWeight: 600 }}
                  >
                    Book again
                  </Button>
                }
              />
            )}

            {/* ── Live hold ── */}
            {isPending && (
              <Row gutter={[32, 32]}>

                <Col xs={24} lg={14}>
                  <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }}>
                    <Tag color="orange" style={{ borderRadius: 10, fontWeight: 700, marginBottom: 12 }}>
                      SEATS HELD — NOT YET CONFIRMED
                    </Tag>

                    <Title level={3} style={{ margin: '0 0 4px 0', fontWeight: 800 }}>
                      {booking.eventTitle || 'Your booking'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                      Reference <strong>{booking.bookingReference}</strong>
                    </Text>

                    <Divider style={{ margin: '1.25rem 0' }} />

                    <Space direction="vertical" size="small" style={{ fontSize: '0.95rem' }}>
                      {booking.showDatetime && (
                        <>
                          <div>
                            <CalendarOutlined style={{ color: '#6366f1', marginRight: 8 }} />
                            {formatDate(booking.showDatetime)}
                          </div>
                          <div>
                            <ClockCircleOutlined style={{ color: '#ec4899', marginRight: 8 }} />
                            {formatTime(booking.showDatetime)}
                          </div>
                        </>
                      )}
                      {(booking.venueName || booking.city) && (
                        <div>
                          <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          {[booking.venueName, booking.city].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </Space>

                    <Divider style={{ margin: '1.25rem 0' }} />

                    <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Your tickets
                    </Text>
                    <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
                      {items.map((item) => (
                        <div key={item.ticketTypeId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span>
                            {item.quantity} × {item.ticketTypeName || `Ticket #${item.ticketTypeId}`}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatMoney(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </Space>

                    <Divider style={{ margin: '1.25rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                        Total ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})
                      </Text>
                      {/* Straight from the server — we never recompute this. */}
                      <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>
                        {formatMoney(booking.totalAmount)}
                      </span>
                    </div>
                  </Card>
                </Col>

                {/* Countdown + actions */}
                <Col xs={24} lg={10}>
                  <Card
                    style={{ borderRadius: '24px', position: 'sticky', top: '100px', textAlign: 'center' }}
                    styles={{ body: { padding: '2rem 1.75rem' } }}
                  >
                    <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <FieldTimeOutlined /> Seats released in
                    </Text>

                    <div style={{ margin: '1.25rem 0' }}>
                      <Progress
                        type="circle"
                        percent={Math.min(100, Math.round((secondsLeft / HOLD_WINDOW_SECONDS) * 100))}
                        strokeColor={countdownColor}
                        size={150}
                        format={() => (
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: countdownColor }}>
                            {formatCountdown(secondsLeft)}
                          </span>
                        )}
                      />
                    </div>

                    {expired ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="danger" style={{ fontWeight: 600 }}>
                          This hold has run out. The sweeper releases the seats within a minute.
                        </Text>
                        <Button block onClick={reload} style={{ borderRadius: 12, fontWeight: 600 }}>
                          Refresh status
                        </Button>
                      </Space>
                    ) : (
                      <>
                        <Text type="secondary" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '1.25rem' }}>
                          Confirm before the timer runs out or your seats go back on sale automatically.
                        </Text>

                        <Button
                          type="primary"
                          size="large"
                          block
                          loading={confirming}
                          icon={<CheckCircleOutlined />}
                          onClick={handleConfirm}
                          style={{
                            height: '52px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            fontWeight: 800,
                            fontSize: '1.02rem',
                            boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)',
                            marginBottom: '0.75rem',
                          }}
                        >
                          Confirm booking
                        </Button>

                        <Button
                          danger
                          type="text"
                          block
                          loading={cancelling}
                          icon={<CloseCircleOutlined />}
                          onClick={handleCancel}
                          style={{ fontWeight: 600 }}
                        >
                          Cancel and release seats
                        </Button>
                      </>
                    )}

                    <Divider style={{ margin: '1.25rem 0 0.75rem' }} />
                    <Statistic
                      title="Payment status"
                      value={booking.paymentStatus}
                      valueStyle={{ fontSize: '1rem', fontWeight: 700 }}
                    />
                  </Card>
                </Col>

              </Row>
            )}
          </>
        )}
      </AsyncBoundary>
    </div>
  );
};

export default BookingConfirmPage;
