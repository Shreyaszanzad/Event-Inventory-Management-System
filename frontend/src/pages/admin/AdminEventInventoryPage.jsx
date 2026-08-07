import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Select,
  InputNumber,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Popconfirm,
  Alert,
  Empty,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  RollbackOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { listAllEvents } from '../../api/events';
import {
  listInventory,
  listEventInventory,
  allocateInventory,
  updateAllocation,
  releaseAllocation,
} from '../../api/inventory';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../../components/AsyncBoundary';
import { ALLOCATION_STATUS_COLOR, inventoryCategoryMeta } from '../../constants/categories';
import { formatMoney, formatDateTime } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * Allocate physical stock to an inventory event.
 *
 * Only INVENTORY-type events appear in the picker: the backend refuses to allocate kit to a
 * TICKETED event, so offering one here would only produce a 400. Ticketed events sell seats
 * through shows and tiers; inventory events consume stock.
 *
 * The selected event lives in the query string so the page survives a refresh and can be
 * linked to directly from the events table.
 */
const AdminEventInventoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const fetchEvents = useCallback(() => listAllEvents(), []);
  const { data: eventsData, loading: eventsLoading, error: eventsError, reload: reloadEvents } =
    useApiData(fetchEvents, []);

  const inventoryEvents = useMemo(
    () => (eventsData || []).filter((e) => e.type === 'INVENTORY'),
    [eventsData],
  );

  const selectedEventId = eventIdParam ? Number(eventIdParam) : null;
  const selectedEvent = inventoryEvents.find((e) => e.id === selectedEventId) || null;

  // Default to the first inventory event so the page is useful on first load.
  useEffect(() => {
    if (!selectedEventId && inventoryEvents.length > 0) {
      setSearchParams({ eventId: String(inventoryEvents[0].id) }, { replace: true });
    }
  }, [selectedEventId, inventoryEvents, setSearchParams]);

  const fetchAllocations = useCallback(
    () => (selectedEventId ? listEventInventory(selectedEventId) : Promise.resolve([])),
    [selectedEventId],
  );
  const { data: allocData, loading, error, reload } = useApiData(fetchAllocations, [selectedEventId], {
    enabled: Boolean(selectedEventId),
  });
  const allocations = useMemo(() => allocData || [], [allocData]);

  const fetchCatalogue = useCallback(() => listInventory({ status: 'ACTIVE' }), []);
  const { data: catalogueData, reload: reloadCatalogue } = useApiData(fetchCatalogue, []);
  const catalogue = useMemo(() => catalogueData || [], [catalogueData]);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form] = Form.useForm();
  const [resizeForm] = Form.useForm();

  /** Items already holding stock on this event can't be allocated twice. */
  const allocatableItems = useMemo(() => {
    const live = new Set(
      allocations.filter((a) => a.status === 'ALLOCATED').map((a) => a.inventoryItemId),
    );
    return catalogue.filter((i) => !live.has(i.id) && i.availableQty > 0);
  }, [catalogue, allocations]);

  const liveAllocations = allocations.filter((a) => a.status === 'ALLOCATED');
  const totalValue = liveAllocations.reduce((sum, a) => sum + Number(a.lineValue || 0), 0);
  const totalUnits = liveAllocations.reduce((sum, a) => sum + (a.allocatedQty || 0), 0);

  const refreshBoth = () => {
    reload();
    reloadCatalogue(); // availability changed
  };

  const handleAllocate = async (values) => {
    setSaving(true);
    setActionError(null);
    try {
      await allocateInventory(selectedEventId, {
        inventoryItemId: values.inventoryItemId,
        quantity: values.quantity,
        notes: values.notes || null,
      });
      message.success('Inventory allocated.');
      setAllocateOpen(false);
      form.resetFields();
      refreshBoth();
    } catch (err) {
      // Most likely: not enough stock left, or the item is retired.
      setActionError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResize = async (values) => {
    setSaving(true);
    setActionError(null);
    try {
      await updateAllocation(resizing.id, values.quantity);
      message.success('Allocation updated.');
      setResizing(null);
      refreshBoth();
    } catch (err) {
      setActionError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (record, returned) => {
    setActionError(null);
    try {
      await releaseAllocation(record.id, returned);
      message.success(returned ? 'Kit marked returned — stock is back in the pool.' : 'Allocation cancelled.');
      refreshBoth();
    } catch (err) {
      setActionError(err);
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => {
        const meta = inventoryCategoryMeta(record.itemCategory);
        return (
          <Space size="middle" align="center">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.2rem',
                background: `${meta.color}1a`,
              }}
            >
              {meta.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{text || `Item #${record.inventoryItemId}`}</div>
              <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                {meta.label}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'allocatedQty',
      key: 'allocatedQty',
      align: 'right',
      render: (qty) => <span style={{ fontWeight: 800 }}>{qty}</span>,
    },
    {
      title: 'Unit price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (price) => formatMoney(price),
    },
    {
      title: 'Line value',
      dataIndex: 'lineValue',
      key: 'lineValue',
      align: 'right',
      render: (value) => <span style={{ fontWeight: 700, color: '#4f46e5' }}>{formatMoney(value)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag color={ALLOCATION_STATUS_COLOR[status] || 'default'} style={{ borderRadius: 10, fontWeight: 600 }}>
            {status}
          </Tag>
          {record.releasedAt && (
            <div>
              <Text type="secondary" style={{ fontSize: '0.72rem' }}>
                {formatDateTime(record.releasedAt)}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => (
        <Text type="secondary" style={{ fontSize: '0.82rem' }}>
          {notes || '—'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        record.status !== 'ALLOCATED' ? (
          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
            Closed
          </Text>
        ) : (
          <Space size="small">
            <Tooltip title="Change quantity">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: '#6366f1' }} />}
                onClick={() => {
                  setActionError(null);
                  resizeForm.setFieldsValue({ quantity: record.allocatedQty });
                  setResizing(record);
                }}
              />
            </Tooltip>

            <Popconfirm
              title="Mark this kit returned?"
              description="The full quantity goes straight back into available stock."
              onConfirm={() => handleRelease(record, true)}
              okText="Mark returned"
              cancelText="Cancel"
            >
              <Tooltip title="Kit came back">
                <Button type="text" icon={<RollbackOutlined style={{ color: '#16a34a' }} />} />
              </Tooltip>
            </Popconfirm>

            <Popconfirm
              title="Cancel this allocation?"
              description="Use this when the kit never left the store. Stock returns to the pool."
              onConfirm={() => handleRelease(record, false)}
              okText="Cancel allocation"
              cancelText="Keep"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Never went out">
                <Button type="text" danger icon={<CloseCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            Event Inventory
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Assign physical stock to an inventory event
          </Text>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              reloadEvents();
              refreshBoth();
            }}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            disabled={!selectedEventId || allocatableItems.length === 0}
            onClick={() => {
              setActionError(null);
              form.resetFields();
              form.setFieldsValue({ quantity: 1 });
              setAllocateOpen(true);
            }}
            style={{
              borderRadius: '12px',
              background: !selectedEventId || allocatableItems.length === 0
                ? undefined
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            Allocate item
          </Button>
        </Space>
      </div>

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      <AsyncBoundary
        loading={eventsLoading}
        error={eventsError}
        onRetry={reloadEvents}
        loadingTip="Loading events…"
      >
        {inventoryEvents.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="No inventory events yet"
            description="Inventory is allocated to events of type INVENTORY. Create one to start assigning kit — ticketed events sell seats instead."
            action={
              <Button type="primary" onClick={() => navigate('/admin/events')}>
                Go to events
              </Button>
            }
            style={{ borderRadius: 12 }}
          />
        ) : (
          <>
            {/* Event picker + running totals */}
            <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }} styles={{ body: { padding: '1rem' } }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={10}>
                  <Text type="secondary" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Inventory event
                  </Text>
                  <Select
                    value={selectedEventId ?? undefined}
                    onChange={(id) => setSearchParams({ eventId: String(id) })}
                    style={{ width: '100%', marginTop: 4 }}
                    size="large"
                    options={inventoryEvents.map((e) => ({
                      value: e.id,
                      label: `${e.title}${e.city ? ` — ${e.city}` : ''}`,
                    }))}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <Text type="secondary" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Line items
                  </Text>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{liveAllocations.length}</div>
                </Col>
                <Col xs={12} md={4}>
                  <Text type="secondary" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Units out
                  </Text>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalUnits}</div>
                </Col>
                <Col xs={24} md={6}>
                  <Text type="secondary" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Kit value on this event
                  </Text>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>
                    {formatMoney(totalValue)}
                  </div>
                </Col>
              </Row>

              {selectedEvent?.venueName && (
                <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                  {selectedEvent.venueName}
                  {selectedEvent.city ? `, ${selectedEvent.city}` : ''}
                </Text>
              )}
            </Card>

            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={reload}
              loadingTip="Loading allocations…"
            >
              <Card style={{ borderRadius: '20px' }} styles={{ body: { padding: 0 } }}>
                {allocations.length === 0 ? (
                  <div style={{ padding: '3rem 1rem' }}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Nothing allocated to this event yet."
                    />
                  </div>
                ) : (
                  <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={allocations}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                  />
                )}
              </Card>
            </AsyncBoundary>
          </>
        )}
      </AsyncBoundary>

      {/* Allocate */}
      <Modal
        open={allocateOpen}
        title={
          <Space>
            <InboxOutlined style={{ color: '#6366f1' }} />
            Allocate to {selectedEvent?.title || 'event'}
          </Space>
        }
        onCancel={() => setAllocateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAllocate} style={{ marginTop: '1rem' }}>
          <Form.Item
            name="inventoryItemId"
            label="Item"
            rules={[{ required: true, message: 'Pick an item to allocate' }]}
            extra="Only active items with stock left, and not already on this event, are listed."
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Choose an item"
              options={allocatableItems.map((i) => ({
                value: i.id,
                label: `${inventoryCategoryMeta(i.category).icon} ${i.name} — ${i.availableQty} free`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'How many units?' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} maxLength={500} placeholder="Where is it going, who signed for it…" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving} block size="large" style={{ borderRadius: 12 }}>
            Allocate
          </Button>
        </Form>
      </Modal>

      {/* Resize */}
      <Modal
        open={resizing !== null}
        title={`Change quantity — ${resizing?.itemName || ''}`}
        onCancel={() => setResizing(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={resizeForm} layout="vertical" onFinish={handleResize} style={{ marginTop: '1rem' }}>
          <Form.Item
            name="quantity"
            label="New quantity"
            rules={[{ required: true, message: 'Enter a quantity' }]}
            extra="Only the difference moves — raising it takes more from the pool, lowering it gives some back."
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving} block size="large" style={{ borderRadius: 12 }}>
            Save
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminEventInventoryPage;
