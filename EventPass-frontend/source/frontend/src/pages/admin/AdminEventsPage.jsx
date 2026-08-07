import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { listAllEvents, createEvent, updateEvent, deleteEvent } from '../../api/events';
import { clearCatalogueCache } from '../../api/enrich';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../../components/AsyncBoundary';
import {
  CATEGORY_OPTIONS,
  EVENT_TYPE_OPTIONS,
  categoryMeta,
  deriveCityOptions,
} from '../../constants/categories';
import { formatDateTime, toApiDateTime, posterOf } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * Admin event CRUD against `/api/admin/events` (integration plan §3.6, YG-9).
 *
 * The list here is `GET /api/admin/events`, which unlike the public feed also
 * returns INVENTORY-type events.
 *
 * The form sends exactly what `EventRequestDto` accepts — title, description,
 * type, category, venueName, city, posterUrl, startTime. `type` is **required**;
 * the mock form's price / tag / originalPrice fields have no column and are gone
 * (§6). Price belongs to ticket tiers, which are per-show.
 */
const AdminEventsPage = () => {
  const navigate = useNavigate();

  const { data, loading, error, reload } = useApiData(listAllEvents, []);
  const events = useMemo(() => data || [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [editing, setEditing] = useState(null); // null = closed, {} = create, {…} = edit
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form] = Form.useForm();

  const cityOptions = useMemo(() => deriveCityOptions(events), [events]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return events.filter((evt) => {
      const matchesSearch =
        !query ||
        evt.title?.toLowerCase().includes(query) ||
        evt.venueName?.toLowerCase().includes(query) ||
        evt.city?.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || evt.city === selectedCity;
      const matchesType = selectedType === 'all' || evt.type === selectedType;
      return matchesSearch && matchesCategory && matchesCity && matchesType;
    });
  }, [events, searchQuery, selectedCategory, selectedCity, selectedType]);

  const openCreate = () => {
    setActionError(null);
    form.resetFields();
    form.setFieldsValue({ type: 'TICKETED' });
    setEditing({});
  };

  const openEdit = (record) => {
    setActionError(null);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      type: record.type,
      category: record.category,
      venueName: record.venueName,
      city: record.city,
      posterUrl: record.posterUrl,
      startTime: record.startTime ? dayjs(record.startTime) : null,
    });
    setEditing(record);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setActionError(null);

    const payload = {
      title: values.title,
      description: values.description || null,
      type: values.type,
      category: values.category || null,
      venueName: values.venueName || null,
      city: values.city || null,
      posterUrl: values.posterUrl || null,
      startTime: toApiDateTime(values.startTime),
    };

    try {
      if (editing?.id) {
        await updateEvent(editing.id, payload);
        message.success(`Event "${values.title}" updated.`);
      } else {
        await createEvent(payload);
        message.success(`Event "${values.title}" created.`);
      }
      // Bookings cache titles/venues; drop it so edits show up straight away.
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
      await deleteEvent(record.id);
      clearCatalogueCache();
      message.success('Event deleted.');
      reload();
    } catch (err) {
      // A 400 here usually means shows or bookings still reference the event.
      setActionError(err);
    }
  };

  const columns = [
    {
      title: 'Event',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space size="middle" align="center">
          <img
            src={posterOf(record)}
            alt={text}
            style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '0.8rem' }}>ID: {record.id}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'TICKETED' ? 'green' : 'gold'} style={{ borderRadius: 10, fontWeight: 600 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const meta = categoryMeta(category);
        return (
          <Tag color="purple" style={{ borderRadius: 10, fontWeight: 600 }}>
            {meta.icon} {meta.label}
          </Tag>
        );
      },
    },
    {
      title: 'Venue & City',
      dataIndex: 'venueName',
      key: 'venueName',
      render: (venueName, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{venueName || '—'}</div>
          {record.city && (
            <Tag color="blue" style={{ borderRadius: 8, fontSize: '0.75rem', marginTop: 2 }}>
              {record.city}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Starts',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime) => (
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          <CalendarOutlined style={{ marginRight: 6, color: '#6366f1' }} />
          {formatDateTime(startTime)}
        </div>
      ),
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
          <Tooltip title="Manage show slots">
            <Button
              type="text"
              icon={<CalendarOutlined style={{ color: '#0ea5e9' }} />}
              onClick={() => navigate(`/admin/shows?eventId=${record.id}`)}
            />
          </Tooltip>

          {record.type === 'TICKETED' && (
            <Tooltip title="Preview public page">
              <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/events/${record.id}`)} />
            </Tooltip>
          )}

          <Tooltip title="Edit event">
            <Button type="text" icon={<EditOutlined style={{ color: '#6366f1' }} />} onClick={() => openEdit(record)} />
          </Tooltip>

          <Popconfirm
            title="Delete this event?"
            description="Shows and ticket tiers under it may block the delete."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete event">
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
            Event Management
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Create and manage ticketed events and inventory events
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
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            Add event
          </Button>
        </Space>
      </div>

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }} styles={{ body: { padding: '1rem' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10} md={7}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search title, venue or city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={12} sm={7} md={5}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: '100%' }}
              options={[{ value: 'all', label: 'All types' }, { value: 'TICKETED', label: 'Ticketed' }, { value: 'INVENTORY', label: 'Inventory' }]}
            />
          </Col>

          <Col xs={12} sm={7} md={5}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]}
            />
          </Col>

          <Col xs={12} sm={7} md={4}>
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              style={{ width: '100%' }}
              options={[{ value: 'all', label: 'All cities' }, ...cityOptions]}
              notFoundContent="No cities yet"
            />
          </Col>

          <Col xs={12} md={3} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCity('all');
                setSelectedType('all');
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
          isEmpty={events.length === 0}
          loadingTip="Loading events…"
          emptyDescription="No events yet. Create the first one to get started."
          emptyAction={
            <Button type="primary" onClick={openCreate} style={{ marginTop: '1rem', borderRadius: 12, background: '#6366f1' }}>
              Add event
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredEvents}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 8, showTotal: (total) => `${total} events` }}
          />
        </AsyncBoundary>
      </Card>

      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>{editing?.id ? 'Edit event' : 'Create event'}</h3>}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        footer={null}
        width={640}
        centered
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: '1rem' }} requiredMark={false}>
          <Form.Item name="title" label="Event title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g. Comedy Night Live" size="large" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                // Required by the backend validator — a missing type is a 400.
                rules={[{ required: true, message: 'Type is required (TICKETED or INVENTORY)' }]}
                tooltip="INVENTORY events are admin-only and never appear in the public feed."
              >
                <Select size="large" options={EVENT_TYPE_OPTIONS} placeholder="Select type" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select size="large" allowClear options={CATEGORY_OPTIONS} placeholder="Select category" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="venueName" label="Venue name">
                <Input placeholder="e.g. Grand Convention Hall" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item name="city" label="City" tooltip="Free text — the public filter list is built from whatever you enter here.">
                <Input placeholder="e.g. Nagpur" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="startTime" label="Starts at">
            <DatePicker showTime format="DD MMM YYYY HH:mm" style={{ width: '100%', borderRadius: 10 }} size="large" />
          </Form.Item>

          <Form.Item name="posterUrl" label="Poster image URL">
            <Input placeholder="https://…" size="large" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What is this event about?" style={{ borderRadius: 10 }} />
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
              {editing?.id ? 'Save changes' : 'Create event'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminEventsPage;
