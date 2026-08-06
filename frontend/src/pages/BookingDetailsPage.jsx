import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  QRCode,
  Typography,
  Space,
  Divider,
  Breadcrumb,
  message
} from 'antd';
import {
  DownloadOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { MOCK_BOOKINGS } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const booking =
    location.state?.booking ||
    MOCK_BOOKINGS.find((b) => b.bookingId === bookingId) ||
    MOCK_BOOKINGS[0];

  const handleDownloadTicket = () => {
    message.success(`E-Ticket for ${booking.bookingId} downloaded successfully as PDF!`);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Header */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/my-bookings')}>My Bookings</a> },
          { title: booking.bookingId }
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/my-bookings')}
          style={{ fontWeight: 600, color: '#64748b' }}
        >
          Back to My Bookings
        </Button>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadTicket}
          style={{
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            fontWeight: 600
          }}
        >
          Download PDF Ticket
        </Button>
      </div>

      {/* Main Digital Pass Ticket Card */}
      <Card
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          background: '#ffffff'
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Banner Image */}
        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
          <img
            src={booking.image}
            alt={booking.eventTitle}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.8) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '1.5rem'
            }}
          >
            <div>
              <Tag color={booking.statusColor} style={{ borderRadius: '10px', fontWeight: 700, padding: '4px 12px' }}>
                {booking.status}
              </Tag>
              <h2 style={{ color: '#ffffff', margin: '6px 0 0 0', fontWeight: 800, fontSize: '1.8rem' }}>
                {booking.eventTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Ticket Details & QR Code Split */}
        <div style={{ padding: '2rem' }}>
          <Row gutter={[32, 32]}>
            
            {/* Left Column: Event & Ticket Details */}
            <Col xs={24} md={15}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Event & Show Information
              </Title>

              <Space direction="vertical" size="middle" style={{ width: '100%', color: '#334155', fontSize: '0.95rem' }}>
                <div>
                  <CalendarOutlined style={{ color: '#6366f1', marginRight: '8px' }} />
                  <strong>Date & Time:</strong> {booking.date} • {booking.time}
                </div>
                <div>
                  <EnvironmentOutlined style={{ color: '#ec4899', marginRight: '8px' }} />
                  <strong>Venue Location:</strong> {booking.venue}, {booking.cityName}
                </div>
                <div>
                  <CreditCardOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <strong>Payment Mode:</strong> {booking.paymentMethod}
                </div>
                <div>
                  <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
                  <strong>Booking Date:</strong> {booking.bookingDate}
                </div>
              </Space>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Ticket Tier Breakdown
              </Title>

              <Space direction="vertical" style={{ width: '100%' }}>
                {booking.selectedTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{tier.name}</div>
                      <Text type="secondary" style={{ fontSize: '0.8rem' }}>Quantity: {tier.count}</Text>
                    </div>
                    <span style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem' }}>
                      ₹{tier.price * tier.count}
                    </span>
                  </div>
                ))}
              </Space>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px dashed #e2e8f0' }}>
                <Text style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Total Amount Paid:</Text>
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a' }}>
                  ₹{booking.grandTotal}
                </span>
              </div>
            </Col>

            {/* Right Column: Digital QR Code Pass */}
            <Col xs={24} md={9} style={{ textAlign: 'center', borderLeft: '1px dashed #e2e8f0', paddingLeft: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                <div style={{ fontWeight: 800, color: '#6366f1', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Entry Pass QR Code
                </div>
                <QRCode value={booking.bookingId} size={180} />
                <Text style={{ display: 'block', fontWeight: 800, marginTop: '12px', color: '#0f172a', fontSize: '1.05rem' }}>
                  {booking.bookingId}
                </Text>
                <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  Show this QR code at venue entry gate
                </Text>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Space style={{ color: '#52c41a', fontWeight: 600, fontSize: '0.85rem' }}>
                  <SafetyCertificateOutlined style={{ fontSize: '18px' }} /> Verified Venue Access Pass
                </Space>
              </div>
            </Col>

          </Row>
        </div>
      </Card>

    </div>
  );
};

export default BookingDetailsPage;
