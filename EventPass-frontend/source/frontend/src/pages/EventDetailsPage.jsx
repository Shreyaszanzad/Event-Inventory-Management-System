import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Space, Breadcrumb, Divider, Empty } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { getEvent } from '../api/events';
import { listShowsForEvent } from '../api/shows';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary from '../components/AsyncBoundary';
import { categoryMeta } from '../constants/categories';
import { formatDate, formatTime, formatDateTime, posterOf } from '../utils/format';

const { Title, Text, Paragraph } = Typography;

/**
 * Event detail, backed by `GET /api/events/{id}` plus `GET /api/events/{id}/shows`
 * (integration plan §3.2).
 *
 * The mock version invented an organizer block, a star rating, a venue address,
 * and a terms list. None of those have a backing column, so they are gone (§6) —
 * what remains is the description, the real venue/city, and the real show slots.
 */
const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchEvent = useCallback(() => getEvent(id), [id]);
  const fetchShows = useCallback(() => listShowsForEvent(id), [id]);

  const { data: event, loading, error, reload } = useApiData(fetchEvent, [id]);
  const { data: showsData, loading: showsLoading } = useApiData(fetchShows, [id]);
  const shows = showsData || [];

  return (
    <AsyncBoundary
      loading={loading}
      error={error}
      onRetry={reload}
      loadingTip="Loading event…"
      errorTitle="Could not load this event"
    >
      {event && (
        <div style={{ paddingBottom: '5rem' }}>

          {/* Banner */}
          <div
            style={{
              position: 'relative',
              minHeight: '400px',
              backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url(${posterOf(event)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '3rem 1.5rem',
            }}
          >
            <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
              <Breadcrumb
                items={[
                  { title: <a onClick={() => navigate('/')} style={{ color: '#cbd5e1' }}>Home</a> },
                  { title: <a onClick={() => navigate('/events')} style={{ color: '#cbd5e1' }}>Events</a> },
                  { title: <span style={{ color: '#ffffff' }}>{event.title}</span> },
                ]}
                style={{ marginBottom: '1.5rem' }}
              />

              <Space style={{ marginBottom: '10px' }}>
                <Tag
                  color={categoryMeta(event.category).color}
                  style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '12px', border: 'none' }}
                >
                  {categoryMeta(event.category).icon} {categoryMeta(event.category).label}
                </Tag>
                {event.status && (
                  <Tag color="blue" style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '12px' }}>
                    {event.status}
                  </Tag>
                )}
              </Space>

              <Title
                level={1}
                style={{ color: '#ffffff', margin: '0 0 1rem 0', fontWeight: 800, fontSize: '2.4rem', lineHeight: 1.2 }}
              >
                {event.title}
              </Title>

              <Space size="large" wrap style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#818cf8' }} /> {formatDateTime(event.startTime)}
                </Space>
                <Space>
                  <EnvironmentOutlined style={{ color: '#f472b6' }} />
                  {[event.venueName, event.city].filter(Boolean).join(', ') || 'Venue to be announced'}
                </Space>
              </Space>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxWidth: '1280px', margin: '2rem auto 0 auto', padding: '0 1.5rem' }}>
            <Row gutter={[32, 32]}>

              <Col xs={24} lg={16}>
                <Card style={{ borderRadius: '20px', marginBottom: '2rem' }}>
                  <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                    About The Event
                  </Title>
                  <Paragraph style={{ fontSize: '1rem', lineHeight: 1.8 }}>
                    {event.description || 'No description has been added for this event yet.'}
                  </Paragraph>
                </Card>

                <Card style={{ borderRadius: '20px', marginBottom: '2rem' }}>
                  <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                    Show Dates &amp; Times
                  </Title>

                  {showsLoading ? (
                    <Text type="secondary">Loading show slots…</Text>
                  ) : shows.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No show slots have been scheduled for this event yet."
                    />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {shows.map((show) => (
                        <Col xs={24} sm={12} key={show.id}>
                          <div
                            onClick={() => navigate(`/booking/${event.id}/shows`)}
                            style={{
                              padding: '1rem 1.25rem',
                              borderRadius: '16px',
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                <CalendarOutlined style={{ marginRight: '6px' }} /> {formatDate(show.showDatetime)}
                              </div>
                              <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                <ClockCircleOutlined style={{ marginRight: '6px' }} /> {formatTime(show.showDatetime)}
                              </Text>
                            </div>
                            <Tag color={show.status === 'ACTIVE' ? 'green' : 'default'} style={{ borderRadius: '10px' }}>
                              {show.status || 'ACTIVE'}
                            </Tag>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>

                <Card style={{ borderRadius: '20px' }}>
                  <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem' }}>
                    Venue
                  </Title>
                  <Space align="start" size="middle">
                    <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '14px', color: '#6366f1' }}>
                      <EnvironmentOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                        {event.venueName || 'Venue to be announced'}
                      </h4>
                      <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                        {event.city || 'City to be announced'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Booking rail */}
              <Col xs={24} lg={8}>
                <Card
                  style={{ borderRadius: '24px', position: 'sticky', top: '100px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
                  styles={{ body: { padding: '1.75rem' } }}
                >
                  <Text type="secondary" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Book your seats
                  </Text>

                  <div style={{ margin: '0.75rem 0 1.25rem' }}>
                    <Text style={{ fontSize: '0.9rem' }}>
                      {shows.length > 0
                        ? `${shows.length} show ${shows.length === 1 ? 'slot' : 'slots'} available. Pick one to see ticket tiers and live seat counts.`
                        : 'Ticket sales open once show slots are scheduled.'}
                    </Text>
                  </div>

                  <Divider style={{ margin: '1rem 0' }} />

                  <Button
                    type="primary"
                    size="large"
                    block
                    disabled={shows.length === 0}
                    onClick={() => navigate(`/booking/${event.id}/shows`)}
                    style={{
                      height: '52px',
                      borderRadius: '16px',
                      background: shows.length === 0 ? undefined : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {shows.length === 0 ? 'No shows scheduled' : 'Select a show'} <ArrowRightOutlined />
                  </Button>

                  <div style={{ textAlign: 'center' }}>
                    <Space style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> Seats held for 10 minutes while you check out
                    </Space>
                  </div>
                </Card>
              </Col>

            </Row>
          </div>
        </div>
      )}
    </AsyncBoundary>
  );
};

export default EventDetailsPage;
