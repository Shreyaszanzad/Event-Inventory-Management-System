import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  DatePicker,
  Button,
  Pagination,
  Skeleton,
  Empty,
  Typography,
  Space,
  Tag,
  Breadcrumb,
  Divider
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
  StarFilled,
  ArrowRightOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { EVENTS, CITIES, CATEGORIES } from '../data/mockData';

const { Title, Text } = Typography;

const EventsListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 6;

  // Simulate loading delay for skeleton effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCity, selectedDate, sortBy, currentPage]);

  // Filter & Sort Logic
  const filteredEvents = EVENTS.filter((evt) => {
    // Search Filter
    const matchesSearch =
      !searchQuery ||
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    // Category Filter
    const matchesCategory =
      selectedCategory === 'all' || evt.category === selectedCategory;

    // City Filter
    const matchesCity =
      selectedCity === 'all' || evt.city === selectedCity;

    // Date Filter
    const matchesDate =
      !selectedDate ||
      evt.date === selectedDate.format('YYYY-MM-DD');

    return matchesSearch && matchesCategory && matchesCity && matchesDate;
  });

  // Sorting Logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'date-soonest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'popularity') return b.rating - a.rating;
    return 0;
  });

  // Pagination Slice
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedDate(null);
    setSortBy('popularity');
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      
      {/* Header Breadcrumb & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/')}>Home</a> },
            { title: 'Events' }
          ]}
          style={{ marginBottom: '1rem' }}
        />
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
          Discover Live Events ({sortedEvents.length})
        </Title>
        <Text type="secondary" style={{ fontSize: '0.95rem' }}>
          Explore music concerts, standup comedy, sports derby, and workshops in your city
        </Text>
      </div>

      {/* Control Bar: Search, Filters & Sorting */}
      <Card
        style={{
          borderRadius: '20px',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}
        bodyStyle={{ padding: '1.25rem' }}
      >
        <Row gutter={[16, 16]} align="middle">
          
          {/* Search Box */}
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search event name or venue..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          {/* Category Filter */}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
              placeholder="Category"
              options={[
                { value: 'all', label: 'All Categories' },
                ...CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
              ]}
            />
          </Col>

          {/* City Filter */}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={selectedCity}
              onChange={(val) => {
                setSelectedCity(val);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
              placeholder="City"
              options={[
                { value: 'all', label: 'All Cities' },
                ...CITIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))
              ]}
            />
          </Col>

          {/* Date Filter */}
          <Col xs={12} sm={6} md={4}>
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setCurrentPage(1);
              }}
              placeholder="Select Date"
              style={{ width: '100%', borderRadius: '10px' }}
            />
          </Col>

          {/* Sorting */}
          <Col xs={12} sm={6} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              options={[
                { value: 'popularity', label: '⭐ Top Rated' },
                { value: 'price-asc', label: '💰 Price: Low to High' },
                { value: 'price-desc', label: '💎 Price: High to Low' },
                { value: 'date-soonest', label: '📅 Date: Soonest' }
              ]}
            />
          </Col>

          {/* Reset Filters */}
          <Col xs={24} md={2} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset
            </Button>
          </Col>

        </Row>
      </Card>

      {/* Events Grid / Skeleton / Empty State */}
      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card style={{ borderRadius: '16px' }}>
                <Skeleton.Image style={{ width: '100%', height: '180px', borderRadius: '12px' }} active />
                <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: '1rem' }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : paginatedEvents.length > 0 ? (
        <>
          <Row gutter={[24, 24]}>
            {paginatedEvents.map((evt) => (
              <Col xs={24} sm={12} lg={8} key={evt.id}>
                <Card
                  className="event-card"
                  hoverable
                  onClick={() => navigate(`/events/${evt.id}`)}
                  cover={
                    <div className="event-card-img-container">
                      <img alt={evt.title} src={evt.image} className="event-card-img" />
                      <span className="event-badge" style={{ backgroundColor: evt.tagColor }}>
                        {evt.tag}
                      </span>
                      <span className="event-rating-badge">
                        <StarFilled /> {evt.rating} ({evt.reviewsCount})
                      </span>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6366f1', fontWeight: 700 }}>
                        {evt.categoryName}
                      </Text>
                      <Tag color="purple" style={{ borderRadius: '12px' }}>
                        {evt.cityName}
                      </Tag>
                    </div>

                    <Title level={5} style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', lineHeight: '1.3' }}>
                      {evt.title}
                    </Title>

                    <Space style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      <CalendarOutlined /> {evt.dateFormatted} • {evt.time}
                    </Space>
                    
                    <Space style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      <EnvironmentOutlined /> {evt.venue}
                    </Space>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Starts from</Text>
                        <Space align="baseline">
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            ₹{evt.price}
                          </span>
                          {evt.originalPrice && (
                            <Text delete style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              ₹{evt.originalPrice}
                            </Text>
                          )}
                        </Space>
                      </div>

                      <Button
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${evt.id}`);
                        }}
                        style={{
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          fontWeight: 600
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={sortedEvents.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} events`}
            />
          </div>
        </>
      ) : (
        /* Empty State */
        <Card style={{ borderRadius: '20px', padding: '3rem 1rem', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Text style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  No events found matching your criteria
                </Text>
                <Text type="secondary">
                  Try adjusting your search keywords, city, or category filters.
                </Text>
              </Space>
            }
          >
            <Button
              type="primary"
              onClick={handleResetFilters}
              style={{ marginTop: '1rem', borderRadius: '12px', background: '#6366f1' }}
            >
              Clear All Filters
            </Button>
          </Empty>
        </Card>
      )}

    </div>
  );
};

export default EventsListingPage;
