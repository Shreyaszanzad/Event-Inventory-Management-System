import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Space, Steps, Breadcrumb } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { getEvent } from '../api/events';
import { listShowsForEvent, listTicketTypes } from '../api/shows';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary from '../components/AsyncBoundary';
import { categoryMeta } from '../constants/categories';
import { formatDate, formatTime, formatMoneyShort, posterOf } from '../utils/format';

const { Title, Text } = Typography;

/**
 * Step 1 of booking: pick a show slot (integration plan §3.2).
 *
 * Each card shows live seat availability, which means loading the tiers for every
 * show — the API has no bulk endpoint, so that is one `GET /api/shows/{id}/ticket-types`
 * per slot, fired in parallel. Events here have a handful of shows, so this is
 * cheap; if a slot ever grows to dozens, this is the call to batch server-side.
 */
const ShowSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [selectedShowId, setSelectedShowId] = useState(null);

  const fetchAll = useCallback(async () => {
    const [event, shows] = await Promise.all([getEvent(eventId), listShowsForEvent(eventId)]);

    const tiersByShow = await Promise.all(
      shows.map((show) =>
        listTicketTypes(show.id)
          .then((tiers) => ({ showId: show.id, tiers }))
          // One unreadable slot shouldn't blank the page — it just shows no seat count.
          .catch(() => ({ showId: show.id, tiers: [] })),
      ),
    );

    const tierMap = new Map(tiersByShow.map((entry) => [entry.showId, entry.tiers]));

    return {
      event,
      shows: shows.map((show) => {
        const tiers = tierMap.get(show.id) || [];
        const seatsLeft = tiers.reduce((sum, t) => sum + (t.availableQty || 0), 0);
        const prices = tiers.map((t) => Number(t.price)).filter(Number.isFinite);
        return {
          ...show,
          tierCount: tiers.length,
          seatsLeft,
          fromPrice: prices.length ? Math.min(...prices) : null,
          soldOut: tiers.length > 0 && seatsLeft === 0,
        };
      }),
    };
  }, [eventId]);

  const { data, loading, error, reload } = useApiData(fetchAll, [eventId]);
  const event = data?.event;
  // Memoised so the preselect effect below doesn't re-run on every render.
  const shows = useMemo(() => data?.shows || [], [data]);

  // Preselect the first slot that still has seats.
  useEffect(() => {
    if (!shows.length || selectedShowId !== null) return;
    setSelectedShowId((shows.find((s) => !s.soldOut) || shows[0]).id);
  }, [shows, selectedShowId]);

  const selectedShow = shows.find((s) => s.id === selectedShowId);

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={Boolean(data) && shows.length === 0}
        loadingTip="Loading show slots…"
        emptyDescription="No show slots have been scheduled for this event yet."
        emptyAction={
          <Button
            type="primary"
            onClick={() => navigate('/events')}
            style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}
          >
            Browse other events
          </Button>
        }
      >
        {event && (
          <>
            <Breadcrumb
              items={[
                { title: <a onClick={() => navigate('/')}>Home</a> },
                { title: <a onClick={() => navigate('/events')}>Events</a> },
                { title: <a onClick={() => navigate(`/events/${event.id}`)}>{event.title}</a> },
                { title: 'Select Show' },
              ]}
              style={{ marginBottom: '1.5rem' }}
            />

            <Card style={{ borderRadius: '20px', marginBottom: '2rem' }}>
              <Steps
                current={0}
                items={[
                  { title: 'Select Show', description: 'Choose date & time' },
                  { title: 'Select Tickets', description: 'Pick tier & quantity' },
                  { title: 'Confirm', description: 'Secure your seats' },
                ]}
              />
            </Card>

            <Card
              style={{ borderRadius: '20px', marginBottom: '2rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
              styles={{ body: { padding: '2rem' } }}
            >
              <Row align="middle" gutter={[24, 24]}>
                <Col xs={24} md={4}>
                  <img
                    src={posterOf(event)}
                    alt={event.title}
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '14px' }}
                  />
                </Col>
                <Col xs={24} md={20}>
                  <Tag color="purple" style={{ borderRadius: '10px', marginBottom: '8px' }}>
                    {categoryMeta(event.category).icon} {categoryMeta(event.category).label}
                  </Tag>
                  <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>
                    {event.title}
                  </Title>
                  <Space style={{ color: '#cbd5e1', marginTop: '6px', fontSize: '0.9rem' }}>
                    <EnvironmentOutlined style={{ color: '#f472b6' }} />
                    {[event.venueName, event.city].filter(Boolean).join(', ') || 'Venue TBA'}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem' }}>
              Available Show Timings
            </Title>

            <Row gutter={[20, 20]}>
              {shows.map((show) => {
                const isSelected = selectedShowId === show.id;
                return (
                  <Col xs={24} sm={12} md={8} key={show.id}>
                    <Card
                      hoverable={!show.soldOut}
                      onClick={() => !show.soldOut && setSelectedShowId(show.id)}
                      style={{
                        borderRadius: '20px',
                        border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        boxShadow: isSelected ? '0 8px 24px rgba(99, 102, 241, 0.15)' : undefined,
                        opacity: show.soldOut ? 0.6 : 1,
                        cursor: show.soldOut ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <Tag
                          color={show.soldOut ? 'red' : show.seatsLeft < 20 ? 'volcano' : 'green'}
                          style={{ borderRadius: '10px', fontWeight: 600 }}
                        >
                          {show.soldOut ? 'Sold out' : show.seatsLeft < 20 ? 'Fast filling' : 'Available'}
                        </Tag>
                        {isSelected && <CheckCircleFilled style={{ color: '#6366f1', fontSize: '20px' }} />}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '4px' }}>
                          <CalendarOutlined style={{ color: '#6366f1', marginRight: '8px' }} />
                          {formatDate(show.showDatetime)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#475569' }}>
                          <ClockCircleOutlined style={{ color: '#ec4899', marginRight: '8px' }} />
                          {formatTime(show.showDatetime)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <div>
                          <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Seats left</Text>
                          <span style={{ fontWeight: 700 }}>
                            {show.tierCount === 0 ? 'No tiers yet' : `${show.seatsLeft} seats`}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Starts at</Text>
                          <span style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.05rem' }}>
                            {show.fromPrice === null ? '—' : formatMoneyShort(show.fromPrice)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div style={{ textAlign: 'right', marginTop: '3rem' }}>
              <Button
                type="primary"
                size="large"
                disabled={!selectedShow || selectedShow.soldOut || selectedShow.tierCount === 0}
                onClick={() => navigate(`/booking/${event.id}/tickets`, { state: { showId: selectedShow.id } })}
                style={{
                  height: '52px',
                  borderRadius: '16px',
                  background:
                    !selectedShow || selectedShow.soldOut || selectedShow.tierCount === 0
                      ? undefined
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  padding: '0 36px',
                }}
              >
                {selectedShow?.tierCount === 0
                  ? 'No ticket tiers for this slot'
                  : `Select tickets for ${selectedShow ? formatTime(selectedShow.showDatetime) : ''}`}{' '}
                <ArrowRightOutlined />
              </Button>
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
};

export default ShowSelectionPage;
