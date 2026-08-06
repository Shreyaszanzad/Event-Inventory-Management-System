import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Steps,
  InputNumber,
  Divider,
  Breadcrumb,
  message
} from 'antd';
import {
  CheckOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  CreditCardOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import { EVENTS, TICKET_TIERS } from '../data/mockData';

const { Title, Text } = Typography;

const TicketSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const event = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
  const selectedShow = location.state?.show || event.shows[0];

  // Quantity map for each tier
  const [quantities, setQuantities] = useState({
    'tier-silver': 1,
    'tier-gold': 0,
    'tier-platinum': 0
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (tierId, val) => {
    setQuantities((prev) => ({
      ...prev,
      [tierId]: val || 0
    }));
  };

  // Calculations
  const subtotal = TICKET_TIERS.reduce(
    (acc, tier) => acc + tier.price * (quantities[tier.id] || 0),
    0
  );

  const totalTickets = Object.values(quantities).reduce((acc, q) => acc + q, 0);

  const convenienceFee = subtotal > 0 ? 50 : 0;
  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + convenienceFee + gst;

  const handlePayAndConfirm = () => {
    if (totalTickets === 0) {
      message.error('Please select at least 1 ticket to proceed.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const bookingData = {
        bookingId: `EVT-BK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        eventTitle: event.title,
        venue: event.venue,
        cityName: event.cityName,
        showDate: selectedShow.date,
        showTime: selectedShow.time,
        totalTickets: totalTickets,
        grandTotal: grandTotal,
        selectedTiers: TICKET_TIERS.filter((t) => quantities[t.id] > 0).map((t) => ({
          name: t.name,
          count: quantities[t.id],
          price: t.price
        })),
        image: event.image
      };

      navigate('/booking/success', { state: { booking: bookingData } });
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/events')}>Events</a> },
          { title: <a onClick={() => navigate(`/booking/${event.id}/shows`)}>Select Show</a> },
          { title: 'Select Tickets' }
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      {/* Progress Steps Header */}
      <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Steps
          current={1}
          items={[
            { title: 'Select Show Slot', description: 'Chosen: ' + selectedShow.time },
            { title: 'Select Tickets', description: 'Pick tier & quantity' },
            { title: 'Booking Confirmed', description: 'Get QR E-Ticket' }
          ]}
        />
      </Card>

      <Row gutter={[32, 32]}>
        
        {/* Ticket Tier Cards (Left 15 Cols) */}
        <Col xs={24} lg={15}>
          <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
            Choose Ticket Tiers
          </Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {TICKET_TIERS.map((tier) => {
              const qty = quantities[tier.id] || 0;
              return (
                <Card
                  key={tier.id}
                  style={{
                    borderRadius: '20px',
                    border: qty > 0 ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    background: qty > 0 ? '#f5f3ff' : '#ffffff',
                    boxShadow: qty > 0 ? '0 8px 24px rgba(99, 102, 241, 0.12)' : '0 4px 12px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  bodyStyle={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <Space style={{ marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>
                          {tier.name}
                        </h3>
                        <Tag color={tier.tagColor} style={{ borderRadius: '10px' }}>
                          {tier.tag}
                        </Tag>
                      </Space>
                      <Text type="secondary" style={{ fontSize: '0.85rem', display: 'block' }}>
                        {tier.availableSeats} seats remaining
                      </Text>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{tier.price}
                      </span>
                      <Text delete style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '6px' }}>
                        ₹{tier.originalPrice}
                      </Text>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', lineHeight: '2' }}>
                    {tier.features.map((feat, idx) => (
                      <li key={idx} style={{ color: '#475569', fontSize: '0.9rem' }}>
                        <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <Text style={{ fontWeight: 600, color: '#334155' }}>Select Quantity:</Text>
                    <InputNumber
                      min={0}
                      max={10}
                      value={qty}
                      onChange={(val) => handleQuantityChange(tier.id, val)}
                      size="large"
                      style={{ borderRadius: '10px', width: '100px' }}
                    />
                  </div>
                </Card>
              );
            })}
          </Space>
        </Col>

        {/* Booking Summary Sidebar (Right 9 Cols) */}
        <Col xs={24} lg={9}>
          <Card
            style={{
              borderRadius: '24px',
              position: 'sticky',
              top: '100px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0'
            }}
            bodyStyle={{ padding: '1.75rem' }}
          >
            <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
              Booking Summary
            </Title>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginBottom: '4px' }}>
                {event.title}
              </div>
              <Space direction="vertical" size={2} style={{ fontSize: '0.85rem', color: '#64748b' }}>
                <div><CalendarOutlined style={{ marginRight: '6px' }} /> {selectedShow.date}</div>
                <div><ClockCircleOutlined style={{ marginRight: '6px' }} /> {selectedShow.time}</div>
                <div><EnvironmentOutlined style={{ marginRight: '6px' }} /> {selectedShow.venue || event.venue}</div>
              </Space>
            </div>

            <Divider style={{ margin: '1rem 0' }} />

            {/* Price Breakdown */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: '1.5rem' }} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Tickets Subtotal ({totalTickets} items)</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Convenience Fee</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{convenienceFee}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>GST (18%)</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{gst}</span>
              </div>
            </Space>

            <Divider style={{ margin: '1rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Text style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Total Amount:</Text>
              <span style={{ fontWeight: 800, fontSize: '1.6rem', color: '#6366f1' }}>
                ₹{grandTotal}
              </span>
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={isProcessing}
              disabled={totalTickets === 0}
              onClick={handlePayAndConfirm}
              style={{
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 800,
                fontSize: '1.05rem',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                marginBottom: '1rem'
              }}
            >
              Confirm & Pay ₹{grandTotal} <CreditCardOutlined />
            </Button>

            <div style={{ textAlign: 'center' }}>
              <Space style={{ color: '#64748b', fontSize: '0.8rem' }}>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 100% Encrypted & Safe Payment
              </Space>
            </div>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default TicketSelectionPage;
