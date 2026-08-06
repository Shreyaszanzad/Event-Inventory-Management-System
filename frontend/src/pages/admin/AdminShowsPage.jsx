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
  Typography,
  Popconfirm,
  message,
  Row,
  Col,
  Progress,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { EVENTS } from '../../data/mockData';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminShowsPage = () => {
  const navigate = useNavigate();

  // Initial shows flattened from EVENTS mock dataset
  const initialShows = EVENTS.flatMap((e) =>
    (e.shows || []).map((s, idx) => ({
      key: `${e.id}-${s.id || idx}`,
      showId: `SHOW-${e.id.toUpperCase()}-0${idx + 1}`,
      eventId: e.id,
      eventTitle: e.title,
      categoryName: e.categoryName,
      venue: s.venue || e.venue,
      date: s.date,
      time: s.time,
      totalCapacity: s.seatsLeft + 80,
      seatsLeft: s.seatsLeft,
      status: s.status || 'Available',
      statusColor: s.status === 'Fast Filling' ? 'volcano' : 'green'
    }))
  );

  const [showsList, setShowsList] = useState(initialShows);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingShow, setCurrentEditingShow] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Filtered Shows
  const filteredShows = showsList.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.showId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Handle Add Show
  const handleAddShowSubmit = (values) => {
    const targetEvent = EVENTS.find((e) => e.id === values.eventId) || EVENTS[0];
    const newShow = {
      key: `show-${Date.now()}`,
      showId: `SHOW-NEW-${Math.floor(100 + Math.random() * 900)}`,
      eventId: targetEvent.id,
      eventTitle: targetEvent.title,
      categoryName: targetEvent.categoryName,
      venue: values.venue || targetEvent.venue,
      date: values.date ? values.date.format('DD MMM YYYY') : '25 SEP 2026',
      time: values.time ? values.time.format('hh:mm A') : '07:00 PM',
      totalCapacity: values.totalCapacity || 150,
      seatsLeft: values.totalCapacity || 150,
      status: 'Available',
      statusColor: 'green'
    };

    setShowsList([newShow, ...showsList]);
    setIsAddModalOpen(false);
    addForm.resetFields();
    message.success('New Show Slot created successfully!');
  };

  // Handle Edit Show Open
  const handleOpenEditModal = (record) => {
    setCurrentEditingShow(record);
    editForm.setFieldsValue({
      venue: record.venue,
      totalCapacity: record.totalCapacity,
      seatsLeft: record.seatsLeft,
      status: record.status
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Show Submit
  const handleEditShowSubmit = (values) => {
    setShowsList((prev) =>
      prev.map((s) =>
        s.key === currentEditingShow.key
          ? {
              ...s,
              venue: values.venue,
              totalCapacity: values.totalCapacity,
              seatsLeft: values.seatsLeft,
              status: values.status,
              statusColor: values.status === 'Fast Filling' ? 'volcano' : values.status === 'Sold Out' ? 'red' : 'green'
            }
          : s
      )
    );
    setIsEditModalOpen(false);
    message.success(`Show slot ${currentEditingShow.showId} updated successfully!`);
  };

  // Handle Delete Show
  const handleDeleteShow = (showKey) => {
    setShowsList((prev) => prev.filter((s) => s.key !== showKey));
    message.success('Show slot removed successfully.');
  };

  // Table Columns
  const columns = [
    {
      title: 'Show ID',
      dataIndex: 'showId',
      key: 'showId',
      render: (text) => <strong style={{ color: '#6366f1' }}>{text}</strong>
    },
    {
      title: 'Event Title & Category',
      dataIndex: 'eventTitle',
      key: 'eventTitle',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{text}</div>
          <Tag color="purple" style={{ borderRadius: '8px', fontSize: '0.75rem', marginTop: '2px' }}>
            {record.categoryName}
          </Tag>
        </div>
      )
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue) => (
        <span style={{ fontSize: '0.85rem', color: '#334155' }}>
          <EnvironmentOutlined style={{ color: '#ec4899', marginRight: '6px' }} />
          {venue}
        </span>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      render: (date, record) => (
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          <div><CalendarOutlined style={{ marginRight: '6px', color: '#6366f1' }} />{date}</div>
          <div><ClockCircleOutlined style={{ marginRight: '6px', color: '#fa8c16' }} />{record.time}</div>
        </div>
      )
    },
    {
      title: 'Seats & Occupancy',
      dataIndex: 'seatsLeft',
      key: 'seatsLeft',
      render: (seatsLeft, record) => {
        const sold = record.totalCapacity - seatsLeft;
        const percent = Math.round((sold / record.totalCapacity) * 100);
        return (
          <div style={{ width: '130px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>{seatsLeft} left</span>
              <span>{percent}% sold</span>
            </div>
            <Progress percent={percent} size="small" strokeColor={percent > 85 ? '#f5222d' : '#6366f1'} showInfo={false} />
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.statusColor} style={{ borderRadius: '10px', fontWeight: 600 }}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Show Slot">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#6366f1' }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete Show Slot?"
            description="Are you sure you want to remove this show slot?"
            onConfirm={() => handleDeleteShow(record.key)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Show Slot">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      
      {/* Title Bar & Add Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Show Slots Management
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Schedule show dates, time slots, and seat capacity allocations
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
          Add New Show Slot
        </Button>
      </div>

      {/* Filter Control Bar */}
      <Card
        style={{ borderRadius: '20px', marginBottom: '1.5rem', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
        bodyStyle={{ padding: '1rem' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search by event title, show ID, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={12} sm={8} md={6}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Available', label: '🟢 Available' },
                { value: 'Fast Filling', label: '🟠 Fast Filling' },
                { value: 'Sold Out', label: '🔴 Sold Out' }
              ]}
            />
          </Col>

          <Col xs={12} sm={4} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
              }}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Shows Table */}
      <Card
        style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredShows}
          pagination={{ pageSize: 6, showTotal: (total) => `Total ${total} show slots` }}
        />
      </Card>

      {/* Add Show Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Schedule New Show Slot</h3>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={580}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddShowSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            name="eventId"
            label="Select Parent Event"
            rules={[{ required: true, message: 'Please select an event' }]}
          >
            <Select size="large" style={{ borderRadius: '10px' }} placeholder="Select Event">
              {EVENTS.map((e) => (
                <Option key={e.id} value={e.id}>{e.title}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="venue" label="Venue Name (Optional override)">
            <Input placeholder="Leave blank to use default event venue" size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Show Date" rules={[{ required: true, message: 'Select date' }]}>
                <DatePicker style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time" label="Show Time" rules={[{ required: true, message: 'Select time' }]}>
                <TimePicker use12Hours format="h:mm a" style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="totalCapacity"
            label="Total Seat Capacity"
            rules={[{ required: true, message: 'Enter seat capacity' }]}
          >
            <InputNumber min={10} max={10000} style={{ width: '100%', borderRadius: '10px' }} size="large" placeholder="150" />
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
              Add Show Slot
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Show Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Edit Show Slot</h3>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={580}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditShowSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item name="venue" label="Venue Name">
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalCapacity" label="Total Capacity">
                <InputNumber min={1} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="seatsLeft" label="Seats Left">
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="Availability Status">
            <Select size="large" style={{ borderRadius: '10px' }}>
              <Option value="Available">Available</Option>
              <Option value="Fast Filling">Fast Filling</Option>
              <Option value="Sold Out">Sold Out</Option>
            </Select>
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
              Save Show Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminShowsPage;
