import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, Progress, Statistic, Alert, Tooltip } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  DollarOutlined,
  ReloadOutlined,
  PlusOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { listAllEvents } from '../../api/events';
import { listShowsForEvent, listTicketTypes } from '../../api/shows';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary from '../../components/AsyncBoundary';
import { categoryMeta } from '../../constants/categories';
import { formatDateTime, formatMoney, formatMoneyShort } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * Admin overview, computed from the live catalogue (integration plan YG-9).
 *
 * Every number here is derived from data the API actually exposes: events, shows,
 * and ticket tiers. Seats sold is `Σ (totalQty − availableQty)` and gross value is
 * `Σ (sold × price)` per tier.
 *
 * ⚠️ **Known gap:** there is no admin endpoint that lists bookings —
 * `/api/bookings/me` is scoped to the calling user — so a true "recent bookings"
 * table and a booking count cannot be built yet. The mock dashboard faked both.
 * Rather than invent numbers, this shows what the catalogue can prove and says so.
 * A `GET /api/admin/bookings` would close it.
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const fetchOverview = useCallback(async () => {
    const events = await listAllEvents();

    const perEvent = await Promise.all(
      events.map(async (event) => {
        const shows = await listShowsForEvent(event.id).catch(() => []);
        const showsWithTiers = await Promise.all(
          shows.map(async (show) => {
            const tiers = await listTicketTypes(show.id).catch(() => []);
            return { ...show, eventTitle: event.title, tiers };
          }),
        );
        return { event, shows: showsWithTiers };
      }),
    );

    return { events, byEvent: perEvent };
  }, []);

  const { data, loading, error, reload } = useApiData(fetchOverview, []);

  const stats = useMemo(() => {
    if (!data) return null;

    const allShows = data.byEvent.flatMap((entry) => entry.shows);
    const allTiers = allShows.flatMap((show) => show.tiers);

    const totalSeats = allTiers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
    const availableSeats = allTiers.reduce((sum, t) => sum + (t.availableQty || 0), 0);
    const soldSeats = totalSeats - availableSeats;
    const grossValue = allTiers.reduce(
      (sum, t) => sum + ((t.totalQty || 0) - (t.availableQty || 0)) * Number(t.price || 0),
      0,
    );

    return {
      ticketedEvents: data.events.filter((e) => e.type === 'TICKETED').length,
      inventoryEvents: data.events.filter((e) => e.type === 'INVENTORY').length,
      totalEvents: data.events.length,
      totalShows: allShows.length,
      showsWithoutTiers: allShows.filter((s) => s.tiers.length === 0).length,
      totalTiers: allTiers.length,
      totalSeats,
      availableSeats,
      soldSeats,
      grossValue,
      occupancy: totalSeats ? Math.round((soldSeats / totalSeats) * 100) : 0,
      shows: allShows,
    };
  }, [data]);

  const statCards = stats
    ? [
        {
          title: 'Events',
          value: stats.totalEvents,
          hint: `${stats.ticketedEvents} ticketed · ${stats.inventoryEvents} inventory`,
          icon: <CalendarOutlined style={{ fontSize: 24, color: '#6366f1' }} />,
          bg: '#f5f3ff',
        },
        {
          title: 'Show slots',
          value: stats.totalShows,
          hint:
            stats.showsWithoutTiers > 0
              ? `${stats.showsWithoutTiers} with no ticket tiers yet`
              : 'All slots have ticket tiers',
          icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#ec4899' }} />,
          bg: '#fff0f6',
        },
        {
          title: 'Seats booked',
          value: `${stats.soldSeats} / ${stats.totalSeats}`,
          hint: `${stats.availableSeats} still available`,
          icon: <IdcardOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
          bg: '#f6ffed',
        },
        {
          title: 'Gross ticket value',
          value: formatMoneyShort(stats.grossValue),
          hint: 'Booked seats × tier price',
          icon: <DollarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
          bg: '#fff7e6',
        },
      ]
    : [];

  const showColumns = [
    {
      title: 'Event',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '0.78rem' }}>Show #{record.id}</Text>
        </div>
      ),
    },
    {
      title: 'When',
      dataIndex: 'showDatetime',
      key: 'showDatetime',
      render: (value) => <span style={{ fontSize: '0.85rem' }}>{formatDateTime(value)}</span>,
    },
    {
      title: 'Tiers',
      key: 'tiers',
      render: (_, record) =>
        record.tiers.length === 0 ? (
          <Tag color="orange" style={{ borderRadius: 10 }}>None — not bookable</Tag>
        ) : (
          <Text style={{ fontSize: '0.85rem' }}>{record.tiers.length}</Text>
        ),
    },
    {
      title: 'Occupancy',
      key: 'occupancy',
      render: (_, record) => {
        const total = record.tiers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
        const available = record.tiers.reduce((sum, t) => sum + (t.availableQty || 0), 0);
        if (!total) return <Text type="secondary">—</Text>;
        const percent = Math.round(((total - available) / total) * 100);
        return (
          <div style={{ width: 130 }}>
            <Progress percent={percent} size="small" strokeColor={percent > 85 ? '#f5222d' : '#6366f1'} />
            <Text type="secondary" style={{ fontSize: '0.72rem' }}>{available} of {total} left</Text>
          </div>
        );
      },
    },
    {
      title: 'Revenue',
      key: 'revenue',
      render: (_, record) => {
        const revenue = record.tiers.reduce(
          (sum, t) => sum + ((t.totalQty || 0) - (t.availableQty || 0)) * Number(t.price || 0),
          0,
        );
        return <strong>{formatMoney(revenue)}</strong>;
      },
    },
  ];

  return (
    <div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Live catalogue and seat occupancy
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={reload} style={{ borderRadius: 12, fontWeight: 600 }}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/events')}
            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', fontWeight: 700 }}
          >
            Add event
          </Button>
        </Space>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={Boolean(data) && data.events.length === 0}
        loadingTip="Crunching the catalogue…"
        emptyDescription="Nothing to report yet — create your first event."
        emptyAction={
          <Button type="primary" onClick={() => navigate('/admin/events')} style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}>
            Add event
          </Button>
        }
      >
        {stats && (
          <>
            <Row gutter={[20, 20]} style={{ marginBottom: '1.5rem' }}>
              {statCards.map((stat) => (
                <Col xs={24} sm={12} xl={6} key={stat.title}>
                  <Card style={{ borderRadius: 20, height: '100%' }}>
                    <Space align="start" size="middle">
                      <div style={{ background: stat.bg, padding: 14, borderRadius: 14 }}>{stat.icon}</div>
                      <div>
                        <Statistic title={stat.title} value={stat.value} valueStyle={{ fontWeight: 800, fontSize: '1.5rem' }} />
                        <Text type="secondary" style={{ fontSize: '0.78rem' }}>{stat.hint}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {stats.showsWithoutTiers > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`${stats.showsWithoutTiers} show ${stats.showsWithoutTiers === 1 ? 'slot has' : 'slots have'} no ticket tiers`}
                description="A show with no tiers cannot be booked — it shows up but has nothing to sell."
                action={
                  <Button size="small" type="primary" icon={<TagOutlined />} onClick={() => navigate('/admin/ticket-types')}>
                    Add tiers
                  </Button>
                }
                style={{ borderRadius: 12, marginBottom: '1.5rem' }}
              />
            )}

            <Row gutter={[20, 20]}>
              <Col xs={24} xl={16}>
                <Card
                  style={{ borderRadius: 20 }}
                  styles={{ body: { padding: 0 } }}
                  title={<span style={{ fontWeight: 800 }}>Show slots &amp; occupancy</span>}
                  extra={<Button type="link" onClick={() => navigate('/admin/shows')}>Manage</Button>}
                >
                  <Table
                    columns={showColumns}
                    dataSource={stats.shows}
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 6, showTotal: (total) => `${total} show slots` }}
                  />
                </Card>
              </Col>

              <Col xs={24} xl={8}>
                <Card style={{ borderRadius: 20, marginBottom: '1.25rem' }} title={<span style={{ fontWeight: 800 }}>Overall occupancy</span>}>
                  <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                    <Progress
                      type="dashboard"
                      percent={stats.occupancy}
                      strokeColor={stats.occupancy > 85 ? '#f5222d' : '#6366f1'}
                      size={160}
                    />
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                        {stats.soldSeats} of {stats.totalSeats} seats booked across {stats.totalTiers} tiers
                      </Text>
                    </div>
                  </div>
                </Card>

                <Card style={{ borderRadius: 20, marginBottom: '1.25rem' }} title={<span style={{ fontWeight: 800 }}>Events by category</span>}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {Object.entries(
                      data.events.reduce((acc, e) => {
                        const key = e.category || 'UNCATEGORISED';
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {}),
                    ).map(([key, count]) => {
                      const meta = categoryMeta(key === 'UNCATEGORISED' ? null : key);
                      return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{meta.icon} {meta.label}</span>
                          <Tag color="purple" style={{ borderRadius: 10, marginInlineEnd: 0 }}>{count}</Tag>
                        </div>
                      );
                    })}
                  </Space>
                </Card>

                <Card style={{ borderRadius: 20 }}>
                  <Space align="start">
                    <InfoCircleOutlined style={{ color: '#6366f1', fontSize: 18, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Booking totals not shown</div>
                      <Text type="secondary" style={{ fontSize: '0.82rem' }}>
                        The API has no admin endpoint for listing bookings — <code>/api/bookings/me</code> only
                        returns the caller&apos;s own. The seat and revenue figures above are derived from ticket-tier
                        stock instead.{' '}
                        <Tooltip title="A GET /api/admin/bookings endpoint would let this panel show real booking rows.">
                          <span style={{ color: '#6366f1', cursor: 'help' }}>Why?</span>
                        </Tooltip>
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </AsyncBoundary>

    </div>
  );
};

export default AdminDashboardPage;
