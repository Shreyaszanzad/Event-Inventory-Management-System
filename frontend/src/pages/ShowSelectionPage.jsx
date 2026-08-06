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
  Steps,
  Breadcrumb,
  Badge
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  UserOutlined,
  TagOutlined
} from '@ant-design/icons';
import { EVENTS } from '../data/mockData';

const { Title, Text } = Typography;

const ShowSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const event = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
  const [selectedShowId, setSelectedShowId] = useState(event.shows ? event.shows[0].id : 's1');

  const selectedShow = event.shows?.find((s) => s.id === selectedShowId) || event.shows[0];

  const handleProceedToTickets = () => {
    navigate(`/booking/${event.id}/tickets`, {
      state: { show: selectedShow }
    });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/events')}>Events</a> },
          { title: <a onClick={() => navigate(`/events/${event.id}`)}>{event.title}</a> },
          { title: 'Select Show' }
        ]}
        style={{ marginBottom: '1.5rem' }}
      />

      {/* Progress Steps Header */}
      <Card style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Steps
          current={0}
          items={[
            { title: 'Select Show Slot', description: 'Choose date & time' },
            { title: 'Select Tickets', description: 'Pick tier & quantity' },
            { title: 'Booking Confirmed', description: 'Get QR E-Ticket' }
          ]}
        />
      </Card>

      {/* Event Header Banner */}
      <Card style={{ borderRadius: '20px', marginBottom: '2rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#ffffff' }} bodyStyle={{ padding: '2rem' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={4}>
            <img src={event.image} alt={event.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '14px' }} />
          </Col>
          <Col xs={24} md={20}>
            <Tag color="purple" style={{ borderRadius: '10px', marginBottom: '8px' }}>{event.categoryName}</Tag>
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>{event.title}</Title>
            <Space style={{ color: '#cbd5e1', marginTop: '6px', fontSize: '0.9rem' }}>
              <EnvironmentOutlined style={{ color: '#f472b6' }} /> {event.venue}, {event.cityName}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Show Selection Section */}
      <Title level={4} style={{ fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
        Available Show Timings
      </Title>

      <Row gutter={[20, 20]}>
        {event.shows.map((show) => {
          const isSelected = selectedShowId === show.id;
          return (
            <Col xs={24} sm={12} md={8} key={show.id}>
              <Card
                hoverable
                onClick={() => setSelectedShowId(show.id)}
                style={{
                  borderRadius: '20px',
                  border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  background: isSelected ? '#f5f3ff' : '#ffffff',
                  boxShadow: isSelected ? '0 8px 24px rgba(99, 102, 241, 0.15)' : '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <Tag color={show.status === 'Fast Filling' ? 'volcano' : 'green'} style={{ borderRadius: '10px', fontWeight: 600 }}>
                    {show.status}
                  </Tag>
                  {isSelected && <CheckCircleFilled style={{ color: '#6366f1', fontSize: '20px' }} />}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: '4px' }}>
                    <CalendarOutlined style={{ color: '#6366f1', marginRight: '8px' }} />
                    {show.date}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#475569' }}>
                    <ClockCircleOutlined style={{ color: '#ec4899', marginRight: '8px' }} />
                    {show.time}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Seats Left</Text>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{show.seatsLeft} Tickets</span>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Starts at</Text>
                    <span style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem' }}>₹{event.price}</span>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Action CTA Bar */}
      <div style={{ textAlign: 'right', marginTop: '3rem' }}>
        <Button
          type="primary"
          size="large"
          onClick={handleProceedToTickets}
          style={{
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            fontWeight: 800,
            fontSize: '1rem',
            padding: '0 36px',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)'
          }}
        >
          Select Tickets for {selectedShow.time} <ArrowRightOutlined />
        </Button>
      </div>

    </div>
  );
};

export default ShowSelectionPage;
