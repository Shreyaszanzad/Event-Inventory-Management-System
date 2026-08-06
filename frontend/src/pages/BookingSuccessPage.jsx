import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Result,
  Card,
  Button,
  QRCode,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  message
} from 'antd';
import {
  DownloadOutlined,
  HomeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  PrinterOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const BookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {
    bookingId: 'EVT-BK-2026-98421',
    eventTitle: 'Arijit Singh Symphony Night 2026',
    venue: 'Jio World Garden, BKC',
    cityName: 'Mumbai',
    showDate: '12 AUG 2026',
    showTime: '07:00 PM',
    totalTickets: 2,
    grandTotal: 2358,
    selectedTiers: [{ name: 'Silver Pass (General)', count: 2, price: 999 }],
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
  };

  const handleDownloadTicket = () => {
    message.success('E-Ticket downloaded successfully as PDF!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Success Result Header */}
      <Card style={{ borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '2rem' }}>
        <Result
          status="success"
          title={<span style={{ fontWeight: 800, fontSize: '1.8rem', color: '#0f172a' }}>Booking Confirmed!</span>}
          subTitle={
            <Text type="secondary" style={{ fontSize: '1rem' }}>
              Your tickets have been reserved. Confirmation sent to your registered mobile & WhatsApp.
            </Text>
          }
          extra={[
            <Tag color="purple" style={{ fontSize: '0.95rem', padding: '6px 16px', borderRadius: '12px', fontWeight: 700 }} key="id">
              Booking ID: {booking.bookingId}
            </Tag>
          ]}
        />
      </Card>

      {/* Printable / Viewable Digital E-Ticket Card */}
      <Card
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          border: '2px dashed #cbd5e1',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          background: '#ffffff',
          marginBottom: '2rem'
        }}
        bodyStyle={{ padding: '2rem' }}
      >
        <Row gutter={[24, 24]} align="middle">
          
          {/* Ticket Information */}
          <Col xs={24} md={16}>
            <Tag color="blue" style={{ borderRadius: '10px', marginBottom: '8px' }}>Verified Digital Pass</Tag>
            <Title level={3} style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: '#0f172a' }}>
              {booking.eventTitle}
            </Title>

            <Space direction="vertical" size="small" style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              <div><CalendarOutlined style={{ color: '#6366f1', marginRight: '8px' }} /> <strong>Date:</strong> {booking.showDate}</div>
              <div><ClockCircleOutlined style={{ color: '#ec4899', marginRight: '8px' }} /> <strong>Time:</strong> {booking.showTime}</div>
              <div><EnvironmentOutlined style={{ color: '#52c41a', marginRight: '8px' }} /> <strong>Venue:</strong> {booking.venue}, {booking.cityName}</div>
            </Space>

            <Divider style={{ margin: '1rem 0' }} />

            <div>
              <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Selected Passes:</Text>
              {booking.selectedTiers.map((t, idx) => (
                <div key={idx} style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginTop: '2px' }}>
                  {t.count}x {t.name} (₹{t.price * t.count})
                </div>
              ))}
            </div>
          </Col>

          {/* QR Code Container */}
          <Col xs={24} md={8} style={{ textAlign: 'center', borderLeft: '1px dashed #e2e8f0', paddingLeft: '1.5rem' }}>
            <div style={{ display: 'inline-block', background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <QRCode value={booking.bookingId} size={140} />
            </div>
            <Text type="secondary" style={{ display: 'block', fontSize: '0.75rem', marginTop: '8px' }}>
              Scan QR code at venue entrance
            </Text>
          </Col>

        </Row>
      </Card>

      {/* Action Buttons */}
      <Row gutter={[16, 16]} justify="center">
        <Col xs={24} sm={12}>
          <Button
            type="primary"
            size="large"
            block
            icon={<DownloadOutlined />}
            onClick={handleDownloadTicket}
            style={{
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700
            }}
          >
            Download Ticket (PDF)
          </Button>
        </Col>

        <Col xs={24} sm={12}>
          <Button
            size="large"
            block
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{
              height: '50px',
              borderRadius: '16px',
              fontWeight: 700
            }}
          >
            Back to Home
          </Button>
        </Col>
      </Row>

    </div>
  );
};

export default BookingSuccessPage;
