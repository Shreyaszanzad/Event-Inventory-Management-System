import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Upload,
  Typography,
  Popconfirm,
  message,
  Breadcrumb,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  ReloadOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { EVENTS, CITIES, CATEGORIES } from '../../data/mockData';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminEventsPage = () => {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState(EVENTS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingEvent, setCurrentEditingEvent] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Filtered Events
  const filteredEvents = eventsList.filter((evt) => {
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || evt.category === selectedCategory;

    const matchesCity =
      selectedCity === 'all' || evt.city === selectedCity;

    return matchesSearch && matchesCategory && matchesCity;
  });

  // Handle Add Event
  const handleAddEventSubmit = (values) => {
    const newEvent = {
      id: `evt-${100 + eventsList.length + 1}`,
      title: values.title,
      category: values.category,
      categoryName: CATEGORIES.find(c => c.id === values.category)?.name || 'General',
      city: values.city,
      cityName: CITIES.find(c => c.id === values.city)?.name || 'Mumbai',
      date: values.date ? values.date.format('YYYY-MM-DD') : '2026-09-15',
      dateFormatted: values.date ? values.date.format('DD MMM YYYY') : '15 SEP 2026',
      time: values.time ? values.time.format('hh:mm A') : '07:00 PM',
      venue: values.venue,
      venueAddress: values.venueAddress || values.venue,
      price: values.price,
      originalPrice: values.originalPrice || values.price + 300,
      rating: 4.8,
      reviewsCount: 1,
      image: values.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      tag: values.tag || 'New',
      tagColor: '#6366f1',
      description: values.description || 'Live entertainment event.',
      organizer: {
        name: 'EventPass Official Host',
        logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
        eventsCount: 10,
        verified: true
      },
      shows: [
        { id: 's1', date: values.date ? values.date.format('DD MMM YYYY') : '15 SEP 2026', time: '07:00 PM', status: 'Available', seatsLeft: 100 }
      ]
    };

    setEventsList([newEvent, ...eventsList]);
    setIsAddModalOpen(false);
    addForm.resetFields();
    message.success('New Event created successfully!');
  };

  // Handle Edit Event Open
  const handleOpenEditModal = (record) => {
    setCurrentEditingEvent(record);
    editForm.setFieldsValue({
      title: record.title,
      category: record.category,
      city: record.city,
      venue: record.venue,
      price: record.price,
      tag: record.tag,
      description: record.description
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Event Submit
  const handleEditEventSubmit = (values) => {
    setEventsList((prev) =>
      prev.map((e) =>
        e.id === currentEditingEvent.id
          ? {
              ...e,
              title: values.title,
              category: values.category,
              categoryName: CATEGORIES.find(c => c.id === values.category)?.name || e.categoryName,
              city: values.city,
              cityName: CITIES.find(c => c.id === values.city)?.name || e.cityName,
              venue: values.venue,
              price: values.price,
              tag: values.tag,
              description: values.description
            }
          : e
      )
    );
    setIsEditModalOpen(false);
    message.success(`Event "${values.title}" updated successfully!`);
  };

  // Handle Delete Event
  const handleDeleteEvent = (eventId) => {
    setEventsList((prev) => prev.filter((e) => e.id !== eventId));
    message.success('Event deleted successfully.');
  };

  // Table Columns Setup
  const columns = [
    {
      title: 'Banner & Event Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space size="middle" align="center">
          <img
            src={record.image}
            alt={text}
            style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '0.8rem' }}>ID: {record.id}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (cat) => <Tag color="purple" style={{ borderRadius: '10px', fontWeight: 600 }}>{cat}</Tag>
    },
    {
      title: 'Venue & City',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{venue}</div>
          <Tag color="blue" style={{ borderRadius: '8px', fontSize: '0.75rem', marginTop: '2px' }}>
            {record.cityName}
          </Tag>
        </div>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'dateFormatted',
      key: 'dateFormatted',
      render: (dateFormatted, record) => (
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          <div><CalendarOutlined style={{ marginRight: '6px', color: '#6366f1' }} />{dateFormatted}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{record.time}</div>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{price}</span>
    },
    {
      title: 'Status',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag, record) => (
        <Tag color={record.tagColor || 'green'} style={{ borderRadius: '10px', fontWeight: 600 }}>
          {tag || 'Active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Preview Event">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/events/${record.id}`)}
            />
          </Tooltip>

          <Tooltip title="Edit Event">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#6366f1' }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete Event?"
            description="Are you sure you want to remove this event from inventory?"
            onConfirm={() => handleDeleteEvent(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Event">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      
      {/* Title & Add Event Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Event Inventory Management
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Create, edit, filter, and manage live shows and inventory
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          Add New Event
        </Button>
      </div>

      {/* Control Bar: Search & Filters */}
      <Card
        style={{
          borderRadius: '20px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0'
        }}
        bodyStyle={{ padding: '1rem' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search event name or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={12} sm={7} md={6}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All Categories' },
                ...CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
              ]}
            />
          </Col>

          <Col xs={12} sm={7} md={6}>
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All Cities' },
                ...CITIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
              ]}
            />
          </Col>

          <Col xs={24} md={4} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCity('all');
              }}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Events Table */}
      <Card
        style={{
          borderRadius: '20px',
          boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
          border: '1px solid #e2e8f0'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredEvents}
          rowKey="id"
          pagination={{ pageSize: 6, showTotal: (total) => `Total ${total} events` }}
        />
      </Card>

      {/* Add New Event Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Create New Event</h3>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={650}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddEventSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            name="title"
            label="Event Title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input placeholder="e.g. Arijit Singh Symphony Concert" size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select size="large" style={{ borderRadius: '10px' }} placeholder="Select Category">
                  {CATEGORIES.map((c) => (
                    <Option key={c.id} value={c.id}>{c.icon} {c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please select city' }]}
              >
                <Select size="large" style={{ borderRadius: '10px' }} placeholder="Select City">
                  {CITIES.map((c) => (
                    <Option key={c.id} value={c.id}>{c.icon} {c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="venue"
                label="Venue Name"
                rules={[{ required: true, message: 'Please enter venue name' }]}
              >
                <Input placeholder="e.g. Jio World Garden, BKC" size="large" style={{ borderRadius: '10px' }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="price"
                label="Base Price (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" placeholder="1499" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Event Date">
                <DatePicker style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tag" label="Tag Badge">
                <Input placeholder="e.g. Selling Fast, Trending" size="large" style={{ borderRadius: '10px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="image" label="Banner Image URL">
            <Input placeholder="https://images.unsplash.com/photo-..." size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item name="description" label="Event Overview Description">
            <Input.TextArea rows={3} placeholder="Provide overview details..." style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700
              }}
            >
              Publish Event to Inventory
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Edit Event Details</h3>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={650}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditEventSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            name="title"
            label="Event Title"
            rules={[{ required: true, message: 'Please enter event title' }]}
          >
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select size="large" style={{ borderRadius: '10px' }}>
                  {CATEGORIES.map((c) => (
                    <Option key={c.id} value={c.id}>{c.icon} {c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="city" label="City">
                <Select size="large" style={{ borderRadius: '10px' }}>
                  {CITIES.map((c) => (
                    <Option key={c.id} value={c.id}>{c.icon} {c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="venue" label="Venue Name">
                <Input size="large" style={{ borderRadius: '10px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Base Price (₹)">
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tag" label="Tag Badge">
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item name="description" label="Event Description">
            <Input.TextArea rows={3} style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700
              }}
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminEventsPage;
