import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Progress,
  Avatar,
  Statistic,
  Select,
  Dropdown,
  Tooltip
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  SyncOutlined
} from '@ant-design/icons';
import { EVENTS, MOCK_BOOKINGS } from '../../data/mockData';

const { Title, Text } = Typography;

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  // Metrics Data
  const stats = [
    {
      title: 'Total Active Events',
      value: 142,
      suffix: '+12% this month',
      isUp: true,
      icon: <CalendarOutlined style={{ fontSize: '24px', color: '#6366f1' }} />,
      bg: '#f5f3ff',
      color: '#6366f1'
    },
    {
      title: 'Total Show Slots',
      value: 380,
      suffix: '+8% vs last week',
      isUp: true,
      icon: <ClockCircleOutlined style={{ fontSize: '24px', color: '#ec4899' }} />,
      bg: '#fff0f6',
      color: '#ec4899'
    },
    {
      title: 'Total Ticket Bookings',
      value: '4,890',
      suffix: '+24% growth',
      isUp: true,
      icon: <IdcardOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      bg: '#f6ffed',
      color: '#52c41a'
    },
    {
      title: 'Total Revenue Generated',
      value: '₹12,45,800',
      suffix: '+18.5% revenue',
      isUp: true,
      icon: <DollarOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
      bg: '#fff7e6',
      color: '#fa8c16'
    }
  ];

  // Recent Bookings Data for Table
  const recentBookingsData = [
    {
      key: '1',
      id: 'EVT-BK-2026-98421',
      customer: 'Rahul Sharma',
      email: 'rahul@example.com',
      event: 'Arijit Singh Symphony Night',
      date: '12 AUG 2026',
      tickets: 2,
      amount: '₹2,358',
      status: 'Confirmed',
      statusColor: 'green'
    },
    {
      key: '2',
      id: 'EVT-BK-2026-45120',
      customer: 'Priya Patel',
      email: 'priya@example.com',
      event: 'Zakir Khan - Papa Bolte Hain',
      date: '18 AUG 2026',
      tickets: 1,
      amount: '₹1,228',
      status: 'Confirmed',
      statusColor: 'green'
    },
    {
      key: '3',
      id: 'EVT-BK-2026-33901',
      customer: 'Vikram Malhotra',
      email: 'vikram@example.com',
      event: 'Grand Champions T20 Derby',
      date: '22 AUG 2026',
      tickets: 4,
      amount: '₹6,480',
      status: 'Pending',
      statusColor: 'orange'
    },
    {
      key: '4',
      id: 'EVT-BK-2026-88129',
      customer: 'Sneha Deshmukh',
      email: 'sneha@example.com',
      event: 'UI/UX & AI Product Design',
      date: '28 AUG 2026',
      tickets: 1,
      amount: '₹2,999',
      status: 'Confirmed',
      statusColor: 'green'
    },
    {
      key: '5',
      id: 'EVT-BK-2025-11048',
      customer: 'Anish Verma',
      email: 'anish@example.com',
      event: 'The Phantom Musical Drama',
      date: '10 MAY 2025',
      tickets: 2,
      amount: '₹2,950',
      status: 'Cancelled',
      statusColor: 'red'
    }
  ];

  // Recent Bookings Columns
  const bookingsColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <strong style={{ color: '#6366f1' }}>{text}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>{record.email}</Text>
        </div>
      )
    },
    {
      title: 'Event Title',
      dataIndex: 'event',
      key: 'event',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Tickets',
      dataIndex: 'tickets',
      key: 'tickets',
      render: (count) => <Tag color="blue">{count} Pass(es)</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt) => <strong style={{ color: '#0f172a' }}>{amt}</strong>
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
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/my-bookings/${record.id}`)}
        />
      )
    }
  ];

  // Recent Events Data for Table
  const recentEventsData = EVENTS.map((e, index) => ({
    key: e.id,
    id: e.id,
    title: e.title,
    category: e.categoryName,
    venue: e.venue,
    price: `₹${e.price}`,
    city: e.cityName,
    image: e.image,
    soldPercent: index === 0 ? 88 : index === 1 ? 95 : 64,
    status: index === 1 ? 'Selling Fast' : 'Active'
  }));

  // Recent Events Columns
  const eventsColumns = [
    {
      title: 'Event',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space size="middle">
          <img src={record.image} alt={text} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>{record.venue}, {record.city}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="purple" style={{ borderRadius: '10px' }}>{cat}</Tag>
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (p) => <strong>{p}</strong>
    },
    {
      title: 'Seats Occupancy',
      dataIndex: 'soldPercent',
      key: 'soldPercent',
      render: (percent) => (
        <div style={{ width: '120px' }}>
          <Progress percent={percent} size="small" strokeColor={percent > 90 ? '#f5222d' : '#6366f1'} />
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Selling Fast' ? 'volcano' : 'green'} style={{ borderRadius: '10px', fontWeight: 600 }}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Event Page">
            <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/events/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Edit Event">
            <Button type="text" icon={<EditOutlined />} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      
      {/* Overview Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            System Dashboard Overview
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Real-time telemetry, revenue analytics, and recent event bookings
          </Text>
        </div>

        <Space>
          <Select defaultValue="month" style={{ width: 140 }}>
            <Select.Option value="today">Today</Select.Option>
            <Select.Option value="week">This Week</Select.Option>
            <Select.Option value="month">This Month</Select.Option>
            <Select.Option value="year">This Year</Select.Option>
          </Select>
          <Button type="primary" icon={<SyncOutlined />} style={{ borderRadius: '10px', background: '#6366f1' }}>
            Refresh Data
          </Button>
        </Space>
      </div>

      {/* 4 Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '2rem' }}>
        {stats.map((stat, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              style={{
                borderRadius: '20px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0'
              }}
              bodyStyle={{ padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {stat.title}
                  </Text>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {stat.value}
                  </div>
                </div>

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: stat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center'
                  }}
                >
                  {stat.icon}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: stat.isUp ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {stat.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span>{stat.suffix}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts & Analytics Visual Section */}
      <Row gutter={[20, 20]} style={{ marginBottom: '2rem' }}>
        
        {/* Revenue Growth Progress */}
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', height: '100%' }}
            title={<span style={{ fontWeight: 800 }}>Revenue & Booking Trends (2026)</span>}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Monthly Target Progress</Text>
                <div style={{ margin: '8px 0 16px 0' }}>
                  <Progress percent={78} strokeColor={{ '0%': '#10b981', '100%': '#6366f1' }} status="active" />
                </div>
                <Text style={{ fontSize: '0.85rem', color: '#64748b' }}>₹12.45L achieved of ₹15L target</Text>
              </Col>
              
              <Col span={12}>
                <Text type="secondary">Seat Fulfillment Rate</Text>
                <div style={{ margin: '8px 0 16px 0' }}>
                  <Progress percent={92} strokeColor={{ '0%': '#f59e0b', '100%': '#ec4899' }} status="active" />
                </div>
                <Text style={{ fontSize: '0.85rem', color: '#64748b' }}>Average 92% occupancy across top venues</Text>
              </Col>
            </Row>

            {/* Visual Bar Graph Simulation */}
            <div style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Revenue Share</Text>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>🎵 Music Concerts</span>
                    <span>₹5.80 Lakhs (46%)</span>
                  </div>
                  <Progress percent={46} strokeColor="#722ed1" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>🎙️ Standup Comedy</span>
                    <span>₹3.20 Lakhs (26%)</span>
                  </div>
                  <Progress percent={26} strokeColor="#eb2f96" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>⚽ Sports & Matches</span>
                    <span>₹2.10 Lakhs (17%)</span>
                  </div>
                  <Progress percent={17} strokeColor="#52c41a" showInfo={false} />
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Quick Category Stats */}
        <Col xs={24} lg={8}>
          <Card
            style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', height: '100%' }}
            title={<span style={{ fontWeight: 800 }}>Top Cities by Sales</span>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px' }}>
                <Space>
                  <span style={{ fontSize: '1.4rem' }}>🏙️</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Mumbai</div>
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>1,840 tickets sold</Text>
                  </div>
                </Space>
                <Tag color="purple">₹4.8L</Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px' }}>
                <Space>
                  <span style={{ fontSize: '1.4rem' }}>🏛️</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Delhi-NCR</div>
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>1,420 tickets sold</Text>
                  </div>
                </Space>
                <Tag color="blue">₹3.6L</Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px' }}>
                <Space>
                  <span style={{ fontSize: '1.4rem' }}>🌳</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Bengaluru</div>
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>1,180 tickets sold</Text>
                  </div>
                </Space>
                <Tag color="green">₹2.9L</Tag>
              </div>
            </Space>
          </Card>
        </Col>

      </Row>

      {/* Recent Bookings Table */}
      <Card
        style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}
        title={<span style={{ fontWeight: 800 }}>Recent Customer Bookings</span>}
        extra={<Button type="link" onClick={() => navigate('/my-bookings')}>View All Bookings</Button>}
      >
        <Table
          columns={bookingsColumns}
          dataSource={recentBookingsData}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Recent Events Table */}
      <Card
        style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
        title={<span style={{ fontWeight: 800 }}>Active Event Inventory</span>}
        extra={<Button type="link" onClick={() => navigate('/events')}>Manage All Events</Button>}
      >
        <Table
          columns={eventsColumns}
          dataSource={recentEventsData}
          pagination={{ pageSize: 4 }}
          size="middle"
        />
      </Card>

    </div>
  );
};

export default AdminDashboardPage;
