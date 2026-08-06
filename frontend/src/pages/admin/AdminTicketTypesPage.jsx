import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  message,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  TagOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { TICKET_TIERS } from '../../data/mockData';

const { Title, Text } = Typography;

const AdminTicketTypesPage = () => {
  const navigate = useNavigate();

  const [ticketTiersList, setTicketTiersList] = useState(TICKET_TIERS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingTier, setCurrentEditingTier] = useState(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Filtered Tiers
  const filteredTiers = ticketTiersList.filter((tier) =>
    !searchQuery ||
    tier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tier.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Add Ticket Tier
  const handleAddTierSubmit = (values) => {
    const featuresArray = values.features
      ? values.features.split('\n').filter((f) => f.trim())
      : ['Standard Access'];

    const newTier = {
      id: `tier-${Date.now()}`,
      name: values.name,
      price: values.price,
      originalPrice: values.originalPrice || values.price + 300,
      availableSeats: values.availableSeats || 50,
      tag: values.tag || 'Standard',
      tagColor: values.tagColor || 'blue',
      features: featuresArray
    };

    setTicketTiersList([...ticketTiersList, newTier]);
    setIsAddModalOpen(false);
    addForm.resetFields();
    message.success('New Ticket Tier created successfully!');
  };

  // Handle Edit Tier Open
  const handleOpenEditModal = (record) => {
    setCurrentEditingTier(record);
    editForm.setFieldsValue({
      name: record.name,
      price: record.price,
      originalPrice: record.originalPrice,
      availableSeats: record.availableSeats,
      tag: record.tag,
      features: record.features.join('\n')
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Tier Submit
  const handleEditTierSubmit = (values) => {
    const featuresArray = values.features
      ? values.features.split('\n').filter((f) => f.trim())
      : currentEditingTier.features;

    setTicketTiersList((prev) =>
      prev.map((t) =>
        t.id === currentEditingTier.id
          ? {
              ...t,
              name: values.name,
              price: values.price,
              originalPrice: values.originalPrice,
              availableSeats: values.availableSeats,
              tag: values.tag,
              features: featuresArray
            }
          : t
      )
    );
    setIsEditModalOpen(false);
    message.success(`Ticket tier "${values.name}" updated successfully!`);
  };

  // Handle Delete Tier
  const handleDeleteTier = (tierId) => {
    setTicketTiersList((prev) => prev.filter((t) => t.id !== tierId));
    message.success('Ticket tier removed successfully.');
  };

  // Table Columns
  const columns = [
    {
      title: 'Tier ID & Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>ID: {record.id}</Text>
        </div>
      )
    },
    {
      title: 'Badge Tag',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag, record) => (
        <Tag color={record.tagColor || 'purple'} style={{ borderRadius: '10px', fontWeight: 600 }}>
          {tag}
        </Tag>
      )
    },
    {
      title: 'Price & Offer',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <div>
          <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>₹{price}</strong>
          {record.originalPrice && (
            <Text delete style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '6px' }}>
              ₹{record.originalPrice}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Available Allocation',
      dataIndex: 'availableSeats',
      key: 'availableSeats',
      render: (seats) => <Tag color="green">{seats} Seats</Tag>
    },
    {
      title: 'Included Pass Features',
      dataIndex: 'features',
      key: 'features',
      render: (features) => (
        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', color: '#475569' }}>
          {features.slice(0, 2).map((f, i) => (
            <li key={i}>{f}</li>
          ))}
          {features.length > 2 && <li style={{ fontStyle: 'italic', color: '#6366f1' }}>+{features.length - 2} more perks</li>}
        </ul>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Ticket Tier">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#6366f1' }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete Ticket Tier?"
            description="Are you sure you want to remove this ticket tier?"
            onConfirm={() => handleDeleteTier(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Ticket Tier">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      
      {/* Title Bar & Add Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Ticket Types & Tiers
          </Title>
          <Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Configure Silver, Gold VIP, and Platinum pass pricing and inclusions
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          Add Ticket Tier
        </Button>
      </div>

      {/* Filter Control Bar */}
      <Card
        style={{ borderRadius: '20px', marginBottom: '1.5rem', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
        bodyStyle={{ padding: '1rem' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={16} md={12}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search by ticket tier name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '10px' }}
            />
          </Col>

          <Col xs={24} sm={8} md={12} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setSearchQuery('')}
              style={{ color: '#64748b', fontWeight: 600 }}
            >
              Reset Search
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Ticket Tiers Table */}
      <Card
        style={{ borderRadius: '20px', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredTiers}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Add Ticket Tier Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Create New Ticket Tier</h3>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={580}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddTierSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            name="name"
            label="Tier Name"
            rules={[{ required: true, message: 'Please enter tier name' }]}
          >
            <Input placeholder="e.g. Platinum VIP Front Row Pass" size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Selling Price (₹)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" placeholder="1999" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="originalPrice" label="Original MRP (₹)">
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" placeholder="2499" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="availableSeats" label="Seat Allocation">
                <InputNumber min={1} style={{ width: '100%', borderRadius: '10px' }} size="large" placeholder="50" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="tag" label="Tag Badge">
                <Input placeholder="e.g. Most Popular" size="large" style={{ borderRadius: '10px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="features" label="Included Perks (1 per line)">
            <Input.TextArea
              rows={4}
              placeholder="Standing Access in Main Arena&#10;1 Free Welcome Drink&#10;Express Entry Gate"
              style={{ borderRadius: '10px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700
              }}
            >
              Save Ticket Tier
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Ticket Tier Modal */}
      <Modal
        title={<h3 style={{ margin: 0, fontWeight: 800 }}>Edit Ticket Tier</h3>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={580}
        centered
        style={{ borderRadius: '24px' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditTierSubmit}
          style={{ marginTop: '1rem' }}
        >
          <Form.Item
            name="name"
            label="Tier Name"
            rules={[{ required: true, message: 'Please enter tier name' }]}
          >
            <Input size="large" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="Selling Price (₹)">
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="originalPrice" label="Original MRP (₹)">
                <InputNumber min={0} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="availableSeats" label="Seat Allocation">
                <InputNumber min={1} style={{ width: '100%', borderRadius: '10px' }} size="large" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="tag" label="Tag Badge">
                <Input size="large" style={{ borderRadius: '10px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="features" label="Included Perks (1 per line)">
            <Input.TextArea rows={4} style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '1.5rem' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                fontWeight: 700
              }}
            >
              Update Ticket Tier
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default AdminTicketTypesPage;
