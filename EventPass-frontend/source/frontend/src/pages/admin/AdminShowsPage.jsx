import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Popconfirm,
  message,
  Row,
  Col,
  Progress,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TagOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { listAllEvents } from '../../api/events';
import { listShowsForEvent, listTicketTypes, createShow, updateShow, deleteShow } from '../../api/shows';
import { clearCatalogueCache } from '../../api/enrich';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../../components/AsyncBoundary';
import { formatDate, formatTime, toApiDateTime } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * Admin show-slot CRUD against `/api/admin/**` (integration plan §3.6, YG-9).
 *
 * There is no "list every show" endpoint — shows are read per event
 * (`GET /api/events/{id}/shows`) — so this page fans out: one call for the event
 * list, then one per event, then one per show for its tiers (to render seat
 * occupancy). At demo scale that is a handful of parallel requests. If the
 * catalogue grows, the fix is a bulk admin endpoint, not more fan-out; the event
 * filter below keeps it bounded in the meantime.
 *
 * `ShowRequest` carries a single field, `showDatetime`. The mock form's venue
 * override, capacity and status have no column on `Show` — capacity lives on the
 * ticket tiers, and status is server-managed.
 */
const AdminShowsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const eventIdParam = searchParams.get('eventId');
  const [selectedEventId, setSelectedEventId] = useState(eventIdParam ? Number(eventIdParam) : 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editing, setEditing] = useState(null); // null = closed, { eventId } = create, { …show } = edit
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form] = Form.useForm();

  const fetchShows = useCallback(async () => {
    const events = await listAllEvents();
    const scoped = selectedEventId === 'all' ? events : events.filter((e) => e.id === selectedEventId);

    const perEvent = await Promise.all(
      scoped.map(async (event) => {
        const shows = await listShowsForEvent(event.id).catch(() => []);
        const withTiers = await Promise.all(
          shows.map(async (show) => {
            const tiers = await listTicketTypes(show.id).catch(() => []);
            const totalQty = tiers.reduce((sum, t) => sum + (t.totalQty || 0), 0);
            const availableQty = tiers.reduce((sum, t) => sum + (t.availableQty || 0), 0);
            return {
              ...show,
              eventTitle: event.title,
              venueName: event.venueName,
              city: event.city,
              tierCount: tiers.length,
              totalQty,
              availableQty,
              soldQty: totalQty - availableQty,
            };
          }),
        );
        return withTiers;
      }),
    );

    return { events, shows: perEvent.flat() };
  }, [selectedEventId]);

  const { data, loading, error, reload } = useApiData(fetchShows, [selectedEventId]);
  const events = useMemo(() => data?.events || [], [data]);
  const shows = useMemo(() => data?.shows || [], [data]);

  // Keep the URL in step so the "manage shows" link from the events page is shareable.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedEventId === 'all') next.delete('eventId');
    else next.set('eventId', String(selectedEventId));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const filteredShows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return shows;
    return shows.filter(
      (s) =>
        s.eventTitle?.toLowerCase().includes(query) ||
        s.venueName?.toLowerCase().includes(query) ||
        String(s.id).includes(query),
    );
  }, [shows, searchQuery]);

  const eventOptions = events.map((e) => ({ value: e.id, label: e.title }));

  const openCreate = () => {
    setActionError(null);
    form.resetFields();
    form.setFieldsValue({
      eventId: selectedEventId === 'all' ? undefined : selectedEventId,
    });
    setEditing({});
  };

  const openEdit = (record) => {
    setActionError(null);
    form.setFieldsValue({
      eventId: record.eventId,
      showDatetime: record.showDatetime ? dayjs(record.showDatetime) : null,
    });
    setEditing(record);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setActionError(null);
    const payload = { showDatetime: toApiDateTime(values.showDatetime) };

    try {
      if (editing?.id) {
        await updateShow(editing.id, payload);
        message.success('Show slot updated.');
      } else {
        await createShow(values.eventId, payload);
        message.success('Show slot created. Add ticket tiers next so it can be booked.');
      }
      clearCatalogueCache();
      setEditing(null);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    setActionError(null);
    try {
      await deleteShow(record.id);
      clearCatalogueCache();
      message.success('Show slot deleted.');
      reload();
    } catch (err) {
      setActionError(err);
    }
  };

  const columns = [
    {
      title: 'Show',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <strong style={{ color: '#6366f1' }}>#{id}</strong>,
    },
    {
      title: 'Event',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 800 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
            {[record.venueName, record.city].filter(Boolean).join(', ') || 'Venue TBA'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Date & time',
      dataIndex: 'showDatetime',
      key: 'showDatetime',
      sorter: (a, b) => new Date(a.showDatetime) - new Date(b.showDatetime),
      render: (showDatetime) => (
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          <div><CalendarOutlined style={{ marginRight: 6, color: '#6366f1' }} />{formatDate(showDatetime)}</div>
          <div><ClockCircleOutlined style={{ marginRight: 6, color: '#fa8c16' }} />{formatTime(showDatetime)}</div>
        </div>
      ),
    },
    {
      title: 'Seats',
      dataIndex: 'availableQty',
      key: 'availableQty',
      render: (availableQty, record) => {
        if (record.tierCount === 0) {
          return (
            <Tag color="orange" style={{ borderRadius: 10 }}>
              No ticket tiers yet
            </Tag>
          );
        }
        const percentSold = record.totalQty ? Math.round((record.soldQty / record.totalQty) * 100) : 0;
        return (
          <div style={{ width: '140px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>{availableQty} left</span>
              <span>{percentSold}% sold</span>
            </div>
            <Progress
              percent={percentSold}
              size="small"
              strokeColor={percentSold > 85 ? '#f5222d' : '#6366f1'}
              showInfo={false}
            />
            <Text type="secondary" style={{ fontSize: '0.72rem' }}>
              {record.tierCount} tier{record.tierCount === 1 ? '' : 's'} · {record.totalQty} total
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'} style={{ borderRadius: 10, fontWeight: 600 }}>
          {status || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Manage ticket tiers">
            <Button
              type="text"
              icon={<TagOutlined style={{ color: '#0ea5e9' }} />}
              onClick={() => navigate(`/admin/ticket-types?showId=${record.id}`)}
            />
          </Tooltip>

          <Tooltip title="Edit show slot">
            <Button type="text" icon={<EditOutlined style={{ color: '#6366f1' }} />} onClick={() => openEdit(record)} />
          </Tooltip>

          <Popconfirm
            title="Delete this show slot?"
            description="Existing bookings for it may block the delete."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete show slot">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            Show Slots
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Schedule the dates and times an event runs
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={reload} style={{ borderRadius: 12, fontWeight: 600 }}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreate}
            disabled={events.length === 0}
            style={{
              borderRadius: '12px',
              background: events.length === 0 ? undefined : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            Add show slot
          </Button>
        </Space>
      </div>

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      {!loading && events.length === 0 && (
        <Alert
          type="info"
          showIcon
          message="Create an event first"
          description="Show slots hang off an event, so there is nothing to schedule yet."
          action={
            <Button type="primary" onClick={() => navigate('/admin/events')}>
              Go to events
            </Button>
          }
          style={{ borderRadius: 12, marginBottom: '1.5rem' }}
        />
      )}

      <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }} styles={{ body: { padding: '1rem' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={9}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search by event, venue or show id…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={24} sm={8} md={9}>
            <Select
              value={selectedEventId}
              onChange={setSelectedEventId}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: 'All events' }, ...eventOptions]}
            />
          </Col>

          <Col xs={24} sm={4} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchQuery('');
                setSelectedEventId('all');
              }}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: '20px' }} styles={{ body: { padding: 0 } }}>
        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={Boolean(data) && shows.length === 0 && events.length > 0}
          loadingTip="Loading show slots…"
          emptyDescription="No show slots scheduled for this selection yet."
          emptyAction={
            <Button type="primary" onClick={openCreate} style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}>
              Add show slot
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredShows}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 8, showTotal: (total) => `${total} show slots` }}
          />
        </AsyncBoundary>
      </Card>

      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>{editing?.id ? 'Edit show slot' : 'Schedule show slot'}</h3>}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        footer={null}
        width={560}
        centered
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: '1rem' }} requiredMark={false}>
          <Form.Item
            name="eventId"
            label="Event"
            rules={[{ required: true, message: 'Please choose the parent event' }]}
          >
            {/* The API has no "move a show to another event" route, so this locks on edit. */}
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              disabled={Boolean(editing?.id)}
              options={eventOptions}
              placeholder="Select event"
            />
          </Form.Item>

          <Form.Item
            name="showDatetime"
            label="Show date & time"
            rules={[{ required: true, message: 'Show date/time is required' }]}
          >
            <DatePicker showTime format="DD MMM YYYY HH:mm" style={{ width: '100%', borderRadius: 10 }} size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={saving}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700,
              }}
            >
              {editing?.id ? 'Save changes' : 'Create show slot'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminShowsPage;
