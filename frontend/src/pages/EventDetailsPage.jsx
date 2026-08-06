import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Avatar,
  Breadcrumb,
  Modal,
  Radio,
  InputNumber,
  Divider,
  message,
  Alert
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  StarFilled,
  ClockCircleOutlined,
  CheckCircleFilled,
  ShareAltOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { EVENTS } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const event = EVENTS.find((e) => e.id === id) || EVENTS[0];

  const [selectedShow, setSelectedShow] = useState(event.shows ? event.shows[0] : null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBookNow = () => {
    navigate(`/booking/${event.id}/shows`);
  };

  const handleConfirmBooking = () => {
    setIsBookingModalOpen(false);
    message.success(`Successfully selected ${ticketQuantity} ticket(s) for ${event.title}!`);
    navigate('/login');
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      
      {/* Top Banner Section */}
      <div
        style={{
          position: 'relative',
          minHeight: '400px',
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url(${event.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '3rem 1.5rem'
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <Breadcrumb
            items={[
              { title: <a onClick={() => navigate('/')} style={{ color: '#cbd5e1' }}>Home</a> },
              { title: <a onClick={() => navigate('/events')} style={{ color: '#cbd5e1' }}>Events</a> },
              { title: <span style={{ color: '#ffffff' }}>{event.title}</span> }
            ]}
            style={{ marginBottom: '1.5rem' }}
          />

          <Row gutter={[24, 24]} align="bottom">
            <Col xs={24} md={16}>
              <Space style={{ marginBottom: '10px' }}>
                <Tag color={event.tagColor} style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '12px', border: 'none' }}>
                  {event.tag}
                </Tag>
                <Tag color="purple" style={{ padding: '4px 12px', fontSize: '0.85rem', borderRadius: '12px' }}>
                  {event.categoryName}
                </Tag>
              </Space>

              <Title level={1} style={{ color: '#ffffff', margin: '0 0 1rem 0', fontWeight: 800, fontSize: '2.4rem', lineHeight: '1.2' }}>
                {event.title}
              </Title>

              <Space size="large" wrap style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
                <Space>
                  <StarFilled style={{ color: '#facc15' }} />
                  <strong style={{ color: '#fff' }}>{event.rating}</strong> ({event.reviewsCount} reviews)
                </Space>
                <Space>
                  <CalendarOutlined style={{ color: '#818cf8' }} /> {event.dateFormatted} • {event.time}
                </Space>
                <Space>
                  <EnvironmentOutlined style={{ color: '#f472b6' }} /> {event.venue}, {event.cityName}
                </Space>
              </Space>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<HeartOutlined />} shape="circle" size="large" />
                <Button icon={<ShareAltOutlined />} shape="circle" size="large" />
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ maxWidth: '1280px', margin: '2rem auto 0 auto', padding: '0 1.5rem' }}>
        <Row gutter={[32, 32]}>
          
          {/* Main Details (Left 16 Cols) */}
          <Col xs={24} lg={16}>
            
            {/* About Event */}
            <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                About The Event
              </Title>
              <Paragraph style={{ fontSize: '1rem', lineHeight: '1.8', color: '#334155' }}>
                {event.description}
              </Paragraph>
            </Card>

            {/* Available Show Slots */}
            {event.shows && event.shows.length > 0 && (
              <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                  Select Show Date & Time
                </Title>
                <Row gutter={[16, 16]}>
                  {event.shows.map((show) => {
                    const isSelected = selectedShow?.id === show.id;
                    return (
                      <Col xs={24} sm={12} key={show.id}>
                        <div
                          onClick={() => setSelectedShow(show)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '16px',
                            border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                            background: isSelected ? '#f5f3ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? '#4f46e5' : '#1e293b' }}>
                              <CalendarOutlined style={{ marginRight: '6px' }} /> {show.date}
                            </div>
                            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                              <ClockCircleOutlined style={{ marginRight: '6px' }} /> {show.time}
                            </Text>
                          </div>
                          <div>
                            <Tag color={show.status === 'Fast Filling' ? 'volcano' : 'green'} style={{ borderRadius: '10px' }}>
                              {show.status} ({show.seatsLeft} seats)
                            </Tag>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            )}

            {/* Venue Location Details */}
            <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Venue & Location
              </Title>
              <Space align="start" size="middle">
                <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '14px', color: '#6366f1' }}>
                  <EnvironmentOutlined style={{ fontSize: '24px' }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                    {event.venue}
                  </h4>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    {event.venueAddress}
                  </Text>
                </div>
              </Space>

              {/* Map Placeholder Container */}
              <div
                style={{
                  marginTop: '1.5rem',
                  height: '180px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontWeight: 600
                }}
              >
                📍 Interactive Venue Map Placeholder
              </div>
            </Card>

            {/* Organizer Info */}
            <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Organized By
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size="middle">
                  <Avatar size={54} src={event.organizer.logo} />
                  <div>
                    <Space>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        {event.organizer.name}
                      </h4>
                      {event.organizer.verified && (
                        <CheckCircleFilled style={{ color: '#6366f1', fontSize: '16px' }} />
                      )}
                    </Space>
                    <Text type="secondary" style={{ display: 'block', fontSize: '0.85rem' }}>
                      {event.organizer.eventsCount} events hosted on EventPass
                    </Text>
                  </div>
                </Space>
                <Button style={{ borderRadius: '12px' }}>Contact Host</Button>
              </div>
            </Card>

            {/* Terms & Guidelines */}
            <Card style={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Title level={4} style={{ fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Event Terms & Instructions
              </Title>
              <ul style={{ paddingLeft: '1.2rem', color: '#475569', lineHeight: '1.8' }}>
                {event.terms ? (
                  event.terms.map((term, i) => <li key={i}>{term}</li>)
                ) : (
                  <li>Standard venue guidelines apply. Carry a valid photo ID proof.</li>
                )}
              </ul>
            </Card>

          </Col>

          {/* Booking Side Card (Right 8 Cols) */}
          <Col xs={24} lg={8}>
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
              <Text type="secondary" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ticket Pricing
              </Text>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0.5rem 0 1.5rem 0' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{event.price}
                </span>
                <Text style={{ fontSize: '0.9rem', color: '#64748b' }}>onwards</Text>
                {event.originalPrice && (
                  <Text delete style={{ fontSize: '1rem', color: '#94a3b8', marginLeft: 'auto' }}>
                    ₹{event.originalPrice}
                  </Text>
                )}
              </div>

              <Divider style={{ margin: '1rem 0' }} />

              <div style={{ marginBottom: '1.5rem' }}>
                <Text style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Selected Show Time:
                </Text>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>
                    {selectedShow?.date || event.dateFormatted}
                  </div>
                  <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                    {selectedShow?.time || event.time}
                  </Text>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleBookNow}
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
                Book Tickets Now
              </Button>

              <div style={{ textAlign: 'center' }}>
                <Space style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 100% Genuine Pass Guarantee
                </Space>
              </div>
            </Card>
          </Col>

        </Row>
      </div>

      {/* Ticket Selection Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Select Tickets</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{event.title}</p>
          </div>
        }
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        footer={null}
        width={480}
        centered
        style={{ borderRadius: '24px' }}
      >
        <div style={{ padding: '1rem 0' }}>
          
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px' }}>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>Selected Schedule:</Text>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>
              {selectedShow?.date} at {selectedShow?.time}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>General Admission Pass</div>
              <Text type="secondary" style={{ fontSize: '0.85rem' }}>₹{event.price} per ticket</Text>
            </div>
            <InputNumber
              min={1}
              max={10}
              value={ticketQuantity}
              onChange={(val) => setTicketQuantity(val || 1)}
              style={{ borderRadius: '10px' }}
            />
          </div>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Text style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>Total Amount:</Text>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#6366f1' }}>
              ₹{event.price * ticketQuantity}
            </span>
          </div>

          <Button
            type="primary"
            block
            size="large"
            onClick={handleConfirmBooking}
            style={{
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700
            }}
          >
            Proceed to Login & Pay
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default EventDetailsPage;
