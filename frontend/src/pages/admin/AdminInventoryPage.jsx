import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Popconfirm,
  Progress,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InboxOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../api/inventory';
import { useApiData } from '../../hooks/useApiData';
import AsyncBoundary, { InlineError } from '../../components/AsyncBoundary';
import {
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
  inventoryCategoryMeta,
} from '../../constants/categories';
import { formatMoney } from '../../utils/format';

const { Title, Text } = Typography;

/**
 * The physical-stock catalogue — chairs, speakers, drapes — behind
 * `/api/admin/inventory`.
 *
 * Two things the form deliberately does not expose:
 *
 *  - `availableQty`, which is server-derived (total minus what is out on events).
 *    Sending it would let a client corrupt the stock count.
 *  - Deleting an item that has ever been allocated. The backend refuses, because the
 *    foreign keys are ON DELETE RESTRICT; retire it instead and the history survives.
 */
const AdminInventoryPage = () => {
  const navigate = useNavigate();

  const fetchItems = useCallback(() => listInventory(), []);
  const { data, loading, error, reload } = useApiData(fetchItems, []);
  const items = useMemo(() => data || [], [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [editing, setEditing] = useState(null); // null = closed, {} = create, {…} = edit
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form] = Form.useForm();

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const totals = useMemo(() => {
    const active = items.filter((i) => i.status === 'ACTIVE');
    return {
      items: items.length,
      units: items.reduce((sum, i) => sum + (i.totalQty || 0), 0),
      out: items.reduce((sum, i) => sum + (i.allocatedQty || 0), 0),
      value: active.reduce((sum, i) => sum + Number(i.unitPrice || 0) * (i.totalQty || 0), 0),
    };
  }, [items]);

  const openCreate = () => {
    setActionError(null);
    form.resetFields();
    form.setFieldsValue({ category: 'FURNITURE', status: 'ACTIVE', totalQty: 1 });
    setEditing({});
  };

  const openEdit = (record) => {
    setActionError(null);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      category: record.category,
      totalQty: record.totalQty,
      unitPrice: Number(record.unitPrice),
      status: record.status,
    });
    setEditing(record);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    setActionError(null);

    const payload = {
      name: values.name,
      description: values.description || null,
      category: values.category,
      totalQty: values.totalQty,
      unitPrice: values.unitPrice,
      status: values.status || 'ACTIVE',
    };

    try {
      if (editing?.id) {
        await updateInventoryItem(editing.id, payload);
        message.success(`"${values.name}" updated.`);
      } else {
        await createInventoryItem(payload);
        message.success(`"${values.name}" added to the catalogue.`);
      }
      setEditing(null);
      reload();
    } catch (err) {
      // Most likely: capacity set below what is already allocated.
      setActionError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    setActionError(null);
    try {
      await deleteInventoryItem(record.id);
      message.success('Item deleted.');
      reload();
    } catch (err) {
      // Allocated or previously-allocated items cannot be deleted — retire instead.
      setActionError(err);
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const meta = inventoryCategoryMeta(record.category);
        return (
          <Space size="middle" align="center">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.3rem',
                background: `${meta.color}1a`,
              }}
            >
              {meta.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{text}</div>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                {record.description || `ID: ${record.id}`}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const meta = inventoryCategoryMeta(category);
        return (
          <Tag color="purple" style={{ borderRadius: 10, fontWeight: 600 }}>
            {meta.icon} {meta.label}
          </Tag>
        );
      },
    },
    {
      title: 'Unit price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (price) => <span style={{ fontWeight: 700 }}>{formatMoney(price)}</span>,
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_, record) => {
        const outPct = record.totalQty ? Math.round((record.allocatedQty / record.totalQty) * 100) : 0;
        return (
          <div style={{ minWidth: 150 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {record.availableQty} of {record.totalQty} free
            </div>
            <Progress
              percent={outPct}
              size="small"
              showInfo={false}
              strokeColor={outPct >= 90 ? '#dc2626' : outPct >= 60 ? '#f59e0b' : '#6366f1'}
            />
            <Text type="secondary" style={{ fontSize: '0.75rem' }}>
              {record.allocatedQty} out on events
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) =>
        status === 'RETIRED' ? (
          <Tag icon={<StopOutlined />} color="default" style={{ borderRadius: 10, fontWeight: 600 }}>
            Retired
          </Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 10, fontWeight: 600 }}>
            Active
          </Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit item">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#6366f1' }} />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this item?"
            description="Anything ever allocated to an event cannot be deleted — retire it instead."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete item">
              <Button type="text" danger icon={<DeleteOutlined />} />
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
            Inventory
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Physical stock available to allocate to inventory events
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={reload} style={{ borderRadius: 12, fontWeight: 600 }}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreate}
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 700,
            }}
          >
            Add item
          </Button>
        </Space>
      </div>

      <InlineError error={actionError} onClose={() => setActionError(null)} />

      {/* Summary tiles */}
      <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Distinct items', value: totals.items, hint: 'in the catalogue' },
          { label: 'Total units', value: totals.units, hint: 'owned across all items' },
          { label: 'Units on events', value: totals.out, hint: 'currently allocated' },
          { label: 'Catalogue value', value: formatMoney(totals.value), hint: 'active stock, at unit price' },
        ].map((tile) => (
          <Col xs={12} md={6} key={tile.label}>
            <Card style={{ borderRadius: 18 }} styles={{ body: { padding: '1rem 1.25rem' } }}>
              <Text type="secondary" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                {tile.label}
              </Text>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3 }}>{tile.value}</div>
              <Text type="secondary" style={{ fontSize: '0.72rem' }}>
                {tile.hint}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card style={{ borderRadius: '20px', marginBottom: '1.5rem' }} styles={{ body: { padding: '1rem' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search item or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 12 }}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              options={[{ value: 'all', label: 'All categories' }, ...INVENTORY_CATEGORY_OPTIONS]}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'RETIRED', label: 'Retired' },
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
              >
                Reset
              </Button>
              <Button type="link" onClick={() => navigate('/admin/events')} style={{ paddingLeft: 0 }}>
                Allocate to an event →
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={items.length === 0}
        loadingTip="Loading inventory…"
        emptyDescription="No inventory items yet. Add the first one to start allocating kit to events."
        emptyAction={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginTop: '1rem' }}>
            Add item
          </Button>
        }
      >
        <Card style={{ borderRadius: '20px' }} styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredItems}
            pagination={{ pageSize: 8, showTotal: (t) => `${t} item${t === 1 ? '' : 's'}` }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </AsyncBoundary>

      <Modal
        open={editing !== null}
        title={
          <Space>
            <InboxOutlined style={{ color: '#6366f1' }} />
            {editing?.id ? 'Edit inventory item' : 'Add inventory item'}
          </Space>
        }
        onCancel={() => setEditing(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: '1rem' }}>
          <Form.Item
            name="name"
            label="Item name"
            rules={[{ required: true, message: 'Give the item a name' }]}
          >
            <Input placeholder="e.g. Banquet Chair" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Pick a category' }]}
              >
                <Select options={INVENTORY_CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select options={INVENTORY_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalQty"
                label="Total quantity owned"
                rules={[{ required: true, message: 'How many do we own?' }]}
                extra={
                  editing?.id
                    ? `${editing.allocatedQty} currently out — cannot go below that`
                    : 'All units start available'
                }
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitPrice"
                label="Unit price (₹)"
                rules={[{ required: true, message: 'Set a unit price' }]}
              >
                <InputNumber min={0} step={50} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Anything worth noting about this kit" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving} block size="large" style={{ borderRadius: 12 }}>
            {editing?.id ? 'Save changes' : 'Add item'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminInventoryPage;
