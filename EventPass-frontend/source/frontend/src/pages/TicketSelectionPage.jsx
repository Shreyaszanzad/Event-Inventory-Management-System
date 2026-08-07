import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Space, Steps, InputNumber, Divider, Breadcrumb, Alert } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { getEvent } from '../api/events';
import { getShow, listTicketTypes } from '../api/shows';
import { createBooking } from '../api/bookings';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../components/AsyncBoundary';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime, formatMoney } from '../utils/format';

const { Title, Text } = Typography;

/** Matches the backend's per-tier practical ceiling; the server is still the authority. */
const MAX_PER_TIER = 10;

/**
 * Step 2 of booking: choose tiers and quantities, then place the hold
 * (integration plan §3.3).
 *
 * Two deliberate changes from the mock version:
 *
 *  - **No convenience fee, no GST.** The backend computes `totalAmount` as
 *    `Σ (unitPrice × quantity)` and nothing else. Adding client-side fees would
 *    show the user a number the server never agrees with. Totals are the
 *    backend's job (§2.5); the figure here is only a preview of the same sum.
 *  - **Submitting creates a hold, not a booking.** We go to the confirmation
 *    screen, which runs the countdown and calls `/confirm`. Jumping straight to a
 *    success page would produce bookings that silently expire (§3.3, YG-6).
 */
const TicketSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const showId = location.state?.showId;

  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchAll = useCallback(async () => {
    const [event, show, tiers] = await Promise.all([
      getEvent(eventId),
      getShow(showId),
      listTicketTypes(showId),
    ]);
    return { event, show, tiers };
  }, [eventId, showId]);

  const { data, loading, error, reload } = useApiData(fetchAll, [eventId, showId], {
    enabled: Boolean(showId),
  });

  const event = data?.event;
  const show = data?.show;
  const tiers = useMemo(() => data?.tiers || [], [data]);

  const setQuantity = (tierId, value) => {
    setQuantities((prev) => ({ ...prev, [tierId]: value || 0 }));
  };

  const selectedItems = useMemo(
    () =>
      tiers
        .filter((tier) => (quantities[tier.id] || 0) > 0)
        .map((tier) => ({
          ticketTypeId: tier.id,
          quantity: quantities[tier.id],
          name: tier.name,
          unitPrice: Number(tier.price),
        })),
    [tiers, quantities],
  );

  const totalTickets = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  /** Preview of the same sum the server will compute — never sent anywhere. */
  const previewTotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleHoldSeats = async () => {
    if (totalTickets === 0) return;

    if (!isAuthenticated) {
      // Booking needs a JWT. Send them to login and come straight back here with
      // their selection intact.
      navigate('/login', {
        state: { from: { pathname: `/booking/${eventId}/tickets` }, showId },
      });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await createBooking(
        showId,
        selectedItems.map(({ ticketTypeId, quantity }) => ({ ticketTypeId, quantity })),
      );
      navigate(`/booking/${booking.id}/confirm`, { state: { booking } });
    } catch (err) {
      // Seat allocation is atomic server-side, so a race here comes back as a 400
      // with a real message ("Not enough seats available") — show it and refresh
      // the counts so the user sees the current availability.
      setSubmitError(err);
      reload();
    } finally {
      setSubmitting(false);
    }
  };

  // Landing here without a show (deep link, refresh) — send them back to pick one.
  if (!showId) {
    return (
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <Alert
          type="info"
          showIcon
          message="Pick a show first"
          description="Ticket tiers belong to a specific show slot."
          action={
            <Button type="primary" onClick={() => navigate(`/booking/${eventId}/shows`)}>
              Choose a show
            </Button>
          }
          style={{ borderRadius: 12 }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={Boolean(data) && tiers.length === 0}
        loadingTip="Loading ticket tiers…"
        emptyDescription="No ticket tiers have been configured for this show yet."
        emptyAction={
          <Button
            type="primary"
            onClick={() => navigate(`/booking/${eventId}/shows`)}
            style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}
          >
            Pick another show
          </Button>
        }
      >
        {event && show && (
          <>
            <Breadcrumb
              items={[
                { title: <a onClick={() => navigate('/')}>Home</a> },
                { title: <a onClick={() => navigate('/events')}>Events</a> },
                { title: <a onClick={() => navigate(`/booking/${eventId}/shows`)}>Select Show</a> },
                { title: 'Select Tickets' },
              ]}
              style={{ marginBottom: '1.5rem' }}
            />

            <Card style={{ borderRadius: '20px', marginBottom: '2rem' }}>
              <Steps
                current={1}
                items={[
                  { title: 'Select Show', description: formatTime(show.showDatetime) },
                  { title: 'Select Tickets', description: 'Pick tier & quantity' },
                  { title: 'Confirm', description: 'Secure your seats' },
                ]}
              />
            </Card>

            <InlineError error={submitError} onClose={() => setSubmitError(null)} />

            <Row gutter={[32, 32]}>

              <Col xs={24} lg={15}>
                <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem' }}>
                  Choose Ticket Tiers
                </Title>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {tiers.map((tier) => {
                    const qty = quantities[tier.id] || 0;
                    const available = tier.availableQty ?? 0;
                    const soldOut = available === 0;
                    const sold = (tier.totalQty ?? 0) - available;

                    return (
                      <Card
                        key={tier.id}
                        style={{
                          borderRadius: '20px',
                          border: qty > 0 ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          opacity: soldOut ? 0.65 : 1,
                        }}
                        styles={{ body: { padding: '1.5rem' } }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                          <div>
                            <Space style={{ marginBottom: '4px' }} wrap>
                              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{tier.name}</h3>
                              {soldOut ? (
                                <Tag color="red" style={{ borderRadius: 10 }}>Sold out</Tag>
                              ) : available < 10 ? (
                                <Tag color="volcano" style={{ borderRadius: 10 }}>Only {available} left</Tag>
                              ) : null}
                            </Space>
                            <Text type="secondary" style={{ fontSize: '0.85rem', display: 'block' }}>
                              {available} of {tier.totalQty} seats available
                              {sold > 0 ? ` · ${sold} booked` : ''}
                            </Text>
                          </div>

                          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{formatMoney(tier.price)}</span>
                            <Text type="secondary" style={{ display: 'block', fontSize: '0.78rem' }}>
                              per ticket
                            </Text>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '1rem',
                            marginTop: '1rem',
                            borderTop: '1px solid #f1f5f9',
                          }}
                        >
                          <Text style={{ fontWeight: 600 }}>
                            {soldOut ? 'No seats left in this tier' : 'Select quantity'}
                          </Text>
                          <InputNumber
                            min={0}
                            // Capped at live availability so the obvious mistake is
                            // caught here; the server still rejects overselling atomically.
                            max={Math.min(available, MAX_PER_TIER)}
                            value={qty}
                            disabled={soldOut}
                            onChange={(val) => setQuantity(tier.id, val)}
                            size="large"
                            style={{ width: '100px' }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              </Col>

              {/* Summary rail */}
              <Col xs={24} lg={9}>
                <Card
                  style={{ borderRadius: '24px', position: 'sticky', top: '100px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
                  styles={{ body: { padding: '1.75rem' } }}
                >
                  <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                    Booking Summary
                  </Title>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>{event.title}</div>
                    <Space direction="vertical" size={2} style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      <div><CalendarOutlined style={{ marginRight: 6 }} /> {formatDate(show.showDatetime)}</div>
                      <div><ClockCircleOutlined style={{ marginRight: 6 }} /> {formatTime(show.showDatetime)}</div>
                      <div><EnvironmentOutlined style={{ marginRight: 6 }} /> {[event.venueName, event.city].filter(Boolean).join(', ') || 'Venue TBA'}</div>
                    </Space>
                  </div>

                  <Divider style={{ margin: '1rem 0' }} />

                  {selectedItems.length === 0 ? (
                    <Text type="secondary">Select at least one ticket to continue.</Text>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {selectedItems.map((item) => (
                        <div key={item.ticketTypeId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ color: '#475569' }}>
                            {item.quantity} × {item.name}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatMoney(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </Space>
                  )}

                  <Divider style={{ margin: '1rem 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Text style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      Total ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})
                    </Text>
                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#6366f1' }}>
                      {formatMoney(previewTotal)}
                    </span>
                  </div>
                  <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '1.25rem' }}>
                    The server confirms the final amount when it holds your seats.
                  </Text>

                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={submitting}
                    disabled={totalTickets === 0}
                    onClick={handleHoldSeats}
                    style={{
                      height: '52px',
                      borderRadius: '16px',
                      background: totalTickets === 0 ? undefined : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      fontWeight: 800,
                      fontSize: '1.02rem',
                      marginBottom: '1rem',
                    }}
                  >
                    Hold my seats <ArrowRightOutlined />
                  </Button>

                  <div style={{ textAlign: 'center' }}>
                    <Space style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> Held for 10 minutes — confirm on the next screen
                    </Space>
                  </div>
                </Card>
              </Col>

            </Row>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
};

export default TicketSelectionPage;
