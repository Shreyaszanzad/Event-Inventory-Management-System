import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Typography,
  Space,
  Popconfirm,
  Breadcrumb,
  Empty,
  message,
  Tabs
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { MOCK_BOOKINGS } from '../data/mockData';

const { Title, Text } = Typography;

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState('all');

  const handleCancelBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === bookingId
          ? { ...b, status: 'Cancelled', statusColor: 'red' }
          : b
      )
    );
    message.success(`Booking ${bookingId} has been cancelled. Refund initiated.`);
  };

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter((b) => b.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Header */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: 'My Bookings' }
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            My Event Bookings
          </Title>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            View and manage your upcoming event passes and ticket history
          </Text>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: `All Bookings (${bookings.length})` },
          { key: 'confirmed', label: '🎟️ Confirmed' },
          { key: 'completed', label: '✅ Completed' },
          { key: 'cancelled', label: '❌ Cancelled' }
        ]}
        style={{ marginBottom: '2rem' }}
      />

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {filteredBookings.map((b) => (
            <Card
              key={b.bookingId}
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
              bodyStyle={{ padding: '1.5rem' }}
            >
              <Row gutter={[24, 24]} align="middle">
                
                {/* Event Image */}
                <Col xs={24} sm={6} md={5}>
                  <img
                    src={b.image}
                    alt={b.eventTitle}
                    style={{
                      width: '100%',
                      height: '130px',
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                  />
                </Col>

                {/* Booking Info */}
                <Col xs={24} sm={18} md={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Tag color={b.statusColor} style={{ borderRadius: '10px', fontWeight: 700, padding: '2px 10px' }}>
                      {b.status}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Code: {b.bookingId}
                    </Text>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                    {b.eventTitle}
                  </h3>

                  <Space direction="vertical" size={2} style={{ fontSize: '0.85rem', color: '#475569' }}>
                    <div>
                      <CalendarOutlined style={{ color: '#6366f1', marginRight: '6px' }} />
                      <strong>Date & Time:</strong> {b.date} • {b.time}
                    </div>
                    <div>
                      <EnvironmentOutlined style={{ color: '#ec4899', marginRight: '6px' }} />
                      <strong>Venue:</strong> {b.venue}, {b.cityName}
                    </div>
                    <div>
                      <strong>Passes:</strong> {b.totalTickets} Ticket(s) ({b.selectedTiers.map(t => t.name).join(', ')})
                    </div>
                  </Space>
                </Col>

                {/* Price & Actions */}
                <Col xs={24} md={7} style={{ textAlign: 'right', borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Total Paid</Text>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{b.grandTotal}
                    </span>
                  </div>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      block
                      onClick={() => navigate(`/my-bookings/${b.bookingId}`, { state: { booking: b } })}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        fontWeight: 600
                      }}
                    >
                      View E-Ticket
                    </Button>

                    {b.status === 'Confirmed' && (
                      <Popconfirm
                        title="Cancel Booking?"
                        description="Are you sure you want to cancel this ticket booking?"
                        onConfirm={() => handleCancelBooking(b.bookingId)}
                        okText="Yes, Cancel"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<CloseCircleOutlined />}
                          block
                          style={{ fontWeight: 600 }}
                        >
                          Cancel Booking
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </Col>

              </Row>
            </Card>
          ))}
        </Space>
      ) : (
        <Card style={{ borderRadius: '20px', padding: '3rem 1rem', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No bookings found in this category."
          >
            <Button
              type="primary"
              onClick={() => navigate('/events')}
              style={{ marginTop: '1rem', borderRadius: '12px', background: '#6366f1' }}
            >
              Explore Live Events
            </Button>
          </Empty>
        </Card>
      )}

    </div>
  );
};

export default MyBookingsPage;
