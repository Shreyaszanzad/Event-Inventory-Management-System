import React, { useState, useMemo, useEffect } from 'react';
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
  Typography,
  Breadcrumb,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { listPublicEvents } from '../api/events';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary, { EmptyState } from '../components/AsyncBoundary';
import EventCard from '../components/EventCard';
import { CATEGORY_OPTIONS, deriveCityOptions, categoryLabel } from '../constants/categories';
import { parseDate } from '../utils/format';

const { Title, Text } = Typography;

const PAGE_SIZE = 6;

/**
 * Events listing, backed by `GET /api/events` (integration plan §3.2).
 *
 * Filtering and sorting happen client-side because the API returns the whole
 * public feed in one call and exposes no query parameters. Cities come from the
 * events themselves — `city` is a free-text column, so a hardcoded list would go
 * stale the moment an admin types a new one (§4).
 *
 * The mock `price` / `rating` sorts are gone: neither field exists on an event.
 */
const EventsListingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data, loading, error, reload } = useApiData(listPublicEvents, []);
  const events = useMemo(() => data || [], [data]);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortBy, setSortBy] = useState('date-soonest');
  const [currentPage, setCurrentPage] = useState(1);

  // Links into this page carry filters in the URL (`/events?category=COMEDY`).
  // Reading them only in `useState` would silently ignore a link clicked while
  // already on this route, since React Router re-renders rather than remounts.
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedCity(searchParams.get('city') || 'all');
    setCurrentPage(1);
  }, [searchParams]);

  const cityOptions = useMemo(() => deriveCityOptions(events), [events]);

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = events.filter((evt) => {
      const matchesSearch =
        !query ||
        evt.title?.toLowerCase().includes(query) ||
        evt.venueName?.toLowerCase().includes(query) ||
        evt.city?.toLowerCase().includes(query) ||
        categoryLabel(evt.category).toLowerCase().includes(query);

      const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || evt.city === selectedCity;

      const matchesDate =
        !selectedDate || parseDate(evt.startTime)?.isSame(selectedDate, 'day');

      return matchesSearch && matchesCategory && matchesCity && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      // Events with no start time sink to the bottom rather than jumping to the top.
      const aTime = parseDate(a.startTime)?.valueOf() ?? Number.POSITIVE_INFINITY;
      const bTime = parseDate(b.startTime)?.valueOf() ?? Number.POSITIVE_INFINITY;
      return sortBy === 'date-latest' ? bTime - aTime : aTime - bTime;
    });
  }, [events, searchQuery, selectedCategory, selectedCity, selectedDate, sortBy]);

  const paginatedEvents = visibleEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedDate(null);
    setSortBy('date-soonest');
    setCurrentPage(1);
  };

  /** Any filter change should drop you back to page 1. */
  const withPageReset = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <Breadcrumb
          items={[{ title: <a onClick={() => navigate('/')}>Home</a> }, { title: 'Events' }]}
          style={{ marginBottom: '1rem' }}
        />
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
          Discover Live Events{!loading && !error ? ` (${visibleEvents.length})` : ''}
        </Title>
        <Text type="secondary" style={{ fontSize: '0.95rem' }}>
          Movies, standup comedy, amusement and live events currently on sale
        </Text>
      </div>

      <Card
        style={{ borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
        styles={{ body: { padding: '1.25rem' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search event, venue or city…"
              value={searchQuery}
              onChange={(e) => withPageReset(setSearchQuery)(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              value={selectedCategory}
              onChange={withPageReset(setSelectedCategory)}
              style={{ width: '100%' }}
              options={[{ value: 'all', label: 'All Categories' }, ...CATEGORY_OPTIONS]}
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              value={selectedCity}
              onChange={withPageReset(setSelectedCity)}
              style={{ width: '100%' }}
              placeholder="City"
              options={[{ value: 'all', label: 'All Cities' }, ...cityOptions]}
              notFoundContent="No cities yet"
            />
          </Col>

          <Col xs={12} sm={6} md={4}>
            <DatePicker
              value={selectedDate}
              onChange={withPageReset(setSelectedDate)}
              placeholder="Event date"
              style={{ width: '100%', borderRadius: '10px' }}
            />
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              options={[
                { value: 'date-soonest', label: '📅 Soonest first' },
                { value: 'date-latest', label: '🕓 Latest first' },
                { value: 'title-asc', label: '🔤 A → Z' },
              ]}
            />
          </Col>

          <Col xs={24} md={1} style={{ textAlign: 'right' }}>
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

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={events.length === 0}
        loadingTip="Loading events…"
        emptyDescription="No events have been published yet."
      >
        {paginatedEvents.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {paginatedEvents.map((event) => (
                <Col xs={24} sm={12} lg={8} key={event.id}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={visibleEvents.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} events`}
              />
            </div>
          </>
        ) : (
          <EmptyState
            description="No events match your filters. Try widening the search, city or date."
            action={
              <Button
                type="primary"
                onClick={handleResetFilters}
                style={{ marginTop: '1rem', borderRadius: '12px', background: '#6366f1' }}
              >
                Clear all filters
              </Button>
            }
          />
        )}
      </AsyncBoundary>

    </div>
  );
};

export default EventsListingPage;
