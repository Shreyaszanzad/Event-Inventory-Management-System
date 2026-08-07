import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
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
  ReloadOutlined,
} from '@ant-design/icons';
import { listAllEvents } from '../../api/events';
import {
  listShowsForEvent,
  listTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '../../api/shows';
import { clearCatalogueCache } from '../../api/enrich';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../../components/AsyncBoundary';
import { formatDateTime, formatMoney } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * Admin ticket-tier CRUD against `/api/admin/**` (integration plan §3.6, YG-9).
 *
 * Tiers belong to a show, so the page loads events → shows → tiers. Filtering by
 * event (and optionally a single show) keeps the fan-out small.
 *
 * `TicketTypeRequest` is `{ name, price, totalQty }`. **`availableQty` is never
 * sent** — the server owns it, decrementing it atomically as seats are held (§3.6).
 * It is shown read-only here so an admin can see live occupancy.
 *
 * The mock form's `originalPrice`, `tag`, `tagColor` and `features[]` have no
 * columns and are dropped (§6).
 */
const AdminTicketTypesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const showIdParam = searchParams.get('showId');
  const [selectedShowId, setSelectedShowId] = useState(showIdParam ? Number(showIdParam) : 'all');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form] = Form.useForm();

  const fetchTiers = useCallback(async () => {
    const events = await listAllEvents();

    const showsPerEvent = await Promise.all(
      events.map(async (event) => {
        const shows = await listShowsForEvent(event.id).catch(() => []);
        return shows.map((show) => ({ ...show, eventTitle: event.title }));
      }),
    );
    const allShows = showsPerEvent.flat();

    // Only fetch tiers for the shows currently in scope.
    const scopedShows = allShows.filter((show) => {
      if (selectedShowId !== 'all') return show.id === selectedShowId;
      if (selectedEventId !== 'all') return show.eventId === selectedEventId;
      return true;
    });

    const tiersPerShow = await Promise.all(
      scopedShows.map(async (show) => {
        const tiers = await listTicketTypes(show.id).catch(() => []);
        return tiers.map((tier) => ({
          ...tier,
          eventId: show.eventId,
          eventTitle: show.eventTitle,
          showDatetime: show.showDatetime,
        }));
      }),
    );

    return { events, shows: allShows, tiers: tiersPerShow.flat() };
  }, [selectedEventId, selectedShowId]);

  const { data, loading, error, reload } = useApiData(fetchTiers, [selectedEventId, selectedShowId]);
  const events = useMemo(() => data?.events || [], [data]);
  const shows = useMemo(() => data?.shows || [], [data]);
  const tiers = useMemo(() => data?.tiers || [], [data]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (selectedShowId === 'all') next.delete('showId');
    else next.set('showId', String(selectedShowId));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShowId]);

  const showOptions = useMemo(
    () =>
      shows
        .filter((s) => selectedEventId === 'all' || s.eventId === selectedEventId)
        .map((s) => ({ value: s.id, label: `#${s.id} — ${s.eventTitle} · ${formatDateTime(s.showDatetime)}` })),
    [shows, selectedEventId],
  );

  const filteredTiers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tiers;
    return tiers.filter(
      (t) => t.name?.toLowerCase().includes(query) || t.eventTitle?.toLowerCase().includes(query),
    );
  }, [tiers, searchQuery]);

  const openCreate = () => {
    setActionError(null);
    form.resetFields();
    form.setFieldsValue({ showId: selectedShowId === 'all' ? undefined : selectedShowId });
    setEditing({});
  };

  const openEdit = (record) => {
    setActionError(null);
    form.setFieldsValue({
      showId: record.showId,
      name: record.name,
      price: Number(record.price),
      totalQty: record.totalQty,
    });
    setEditing(record);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setActionError(null);
    // Exactly the three fields the DTO accepts.
    const payload = { name: values.name, price: values.price, totalQty: values.totalQty };

    try {
      if (editing?.id) {
        await updateTicketType(editing.id, payload);
        message.success(`Ticket tier "${values.name}" updated.`);
      } else {
        await createTicketType(values.showId, payload);
        message.success(`Ticket tier "${values.name}" created.`);
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
      await deleteTicketType(record.id);
      clearCatalogueCache();
      message.success('Ticket tier deleted.');
      reload();
    } catch (err) {
      setActionError(err);
    }
  };

  const columns = [
    {
      title: 'Tier',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{name}</div>
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>ID: {record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Event & show',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (eventTitle, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{eventTitle}</div>
          <Text type="secondary" style={{ fontSize: '0.78rem' }}>
            Show #{record.showId} · {formatDateTime(record.showDatetime)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => Number(a.price) - Number(b.price),
      render: (price) => <strong style={{ fontSize: '1.02rem' }}>{formatMoney(price)}</strong>,
    },
    {
      title: 'Allocation',
      dataIndex: 'availableQty',
      key: 'availableQty',
      render: (availableQty, record) => {
        const sold = (record.totalQty || 0) - (availableQty || 0);
        const percentSold = record.totalQty ? Math.round((sold / record.totalQty) * 100) : 0;
        return (
          <div style={{ width: '150px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>{availableQty} of {record.totalQty} left</span>
              <span>{percentSold}%</span>
            </div>
            <Progress
              percent={percentSold}
              size="small"
              strokeColor={percentSold > 85 ? '#f5222d' : '#6366f1'}
              showInfo={false}
            />
            {/* Server-managed — the create/update form never sends this. */}
            <Text type="secondary" style={{ fontSize: '0.72rem' }}>{sold} booked</Text>
          </div>
        );
      },
    },
    {
      title: 'Availability',
      key: 'availability',
      render: (_, record) =>
        record.availableQty === 0 ? (
          <Tag color="red" style={{ borderRadius: 10, fontWeight: 600 }}>Sold out</Tag>
        ) : record.availableQty < 10 ? (
          <Tag color="volcano" style={{ borderRadius: 10, fontWeight: 600 }}>Low stock</Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 10, fontWeight: 600 }}>On sale</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit tier">
            <Button type="text" icon={<EditOutlined style={{ color: '#6366f1' }} />} onClick={() => openEdit(record)} />
          </Tooltip>

          <Popconfirm
            title="Delete this ticket tier?"
            description="Existing bookings against it may block the delete."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete tier">
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
            Ticket Tiers
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Pricing and seat allocation, per show slot
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
            disabled={shows.length === 0}
            style={{
              borderRadius: '12px',
              background: shows.length === 0 ? undefined : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            Add ticket tier
          </Button>
        </Space>
      </div>

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      {!loading && shows.length === 0 && (
        <Alert
          type="info"
          showIcon
          message="Schedule a show slot first"
          description="Ticket tiers belong to a show, so there is nothing to price yet."
          action={
            <Button type="primary" onClick={() => navigate('/admin/shows')}>
              Go to show slots
            </Button>
          }
          style={{ borderRadius: 12, marginBottom: '1.5rem' }}
        />
      )}

      <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }} styles={{ body: { padding: '1rem' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search tier or event…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedEventId}
              onChange={(value) => {
                setSelectedEventId(value);
                setSelectedShowId('all'); // a show from the old event would filter everything out
              }}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: 'All events' }, ...events.map((e) => ({ value: e.id, label: e.title }))]}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedShowId}
              onChange={setSelectedShowId}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={[{ value: 'all', label: 'All show slots' }, ...showOptions]}
            />
          </Col>

          <Col xs={24} sm={12} md={4} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchQuery('');
                setSelectedEventId('all');
                setSelectedShowId('all');
              }}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: '20px' }} styles={{ body: { padding: 0 } }}>
        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={Boolean(data) && tiers.length === 0 && shows.length > 0}
          loadingTip="Loading ticket tiers…"
          emptyDescription="No ticket tiers for this selection yet. Without a tier, a show cannot be booked."
          emptyAction={
            <Button type="primary" onClick={openCreate} style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}>
              Add ticket tier
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredTiers}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 8, showTotal: (total) => `${total} ticket tiers` }}
          />
        </AsyncBoundary>
      </Card>

      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>{editing?.id ? 'Edit ticket tier' : 'Create ticket tier'}</h3>}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        footer={null}
        width={560}
        centered
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: '1rem' }} requiredMark={false}>
          <Form.Item name="showId" label="Show slot" rules={[{ required: true, message: 'Please choose the show slot' }]}>
            {/* No endpoint moves a tier between shows, so this locks once created. */}
            <Select
              size="large"
              showSearch
              optionFilterProp="label"
              disabled={Boolean(editing?.id)}
              options={shows.map((s) => ({
                value: s.id,
                label: `#${s.id} — ${s.eventTitle} · ${formatDateTime(s.showDatetime)}`,
              }))}
              placeholder="Select show slot"
            />
          </Form.Item>

          <Form.Item name="name" label="Tier name" rules={[{ required: true, message: 'Ticket type name is required' }]}>
            <Input placeholder="e.g. General, Gold, Platinum" size="large" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₹)"
                rules={[
                  { required: true, message: 'Price is required' },
                  { type: 'number', min: 0, message: 'Price cannot be negative' },
                ]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%', borderRadius: 10 }} size="large" placeholder="499.00" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="totalQty"
                label="Total seats"
                rules={[
                  { required: true, message: 'Total quantity is required' },
                  { type: 'number', min: 1, message: 'Total quantity must be at least 1' },
                ]}
                tooltip="Available seats are tracked by the server as bookings come in — you only set the total."
              >
                <InputNumber min={1} style={{ width: '100%', borderRadius: 10 }} size="large" placeholder="500" />
              </Form.Item>
            </Col>
          </Row>

          {editing?.id && (
            <Alert
              type="info"
              showIcon
              message={`${editing.availableQty} of ${editing.totalQty} seats currently available`}
              description="Availability is server-managed and is not part of this form."
              style={{ borderRadius: 12, marginBottom: '1rem' }}
            />
          )}

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
              {editing?.id ? 'Save changes' : 'Create ticket tier'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminTicketTypesPage;
