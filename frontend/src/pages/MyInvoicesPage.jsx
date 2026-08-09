import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Typography, Space, Breadcrumb, Progress, Divider } from 'antd';
import { FileTextOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { listMyInvoices } from '../api/invoices';
import { useApiData } from '../hooks/useApiData';
import AsyncBoundary from '../components/AsyncBoundary';
import CheckoutModal from '../components/CheckoutModal';
import { formatMoney, formatDateTime, humaniseEnum } from '../utils/format';

const { Title, Text } = Typography;

const STATUS_COLOR = {
  UNPAID: 'red',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
};

/**
 * The customer's own invoices, from `GET /api/invoices/me`, and the entry point for paying one
 * online. Invoices are raised by an administrator against a confirmed booking; this page is
 * where the customer settles them.
 */
const MyInvoicesPage = () => {
  const navigate = useNavigate();

  const { data, loading, error, reload } = useApiData(useCallback(() => listMyInvoices(), []), []);
  const invoices = useMemo(() => data || [], [data]);

  const [paying, setPaying] = useState(null);

  const outstanding = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto 4rem', padding: '0 1.5rem' }}>
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: 'My Invoices' },
        ]}
        style={{ marginBottom: '1rem' }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            My Invoices
          </Title>
          <Text type="secondary">Bills raised against your confirmed bookings</Text>
        </div>
        <Space>
          {outstanding > 0 && (
            <Tag color="orange" style={{ borderRadius: 10, padding: '4px 12px', fontWeight: 700 }}>
              {formatMoney(outstanding)} outstanding
            </Tag>
          )}
          <Button icon={<ReloadOutlined />} onClick={reload} style={{ borderRadius: 12 }}>
            Refresh
          </Button>
        </Space>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={invoices.length === 0}
        loadingTip="Loading your invoices…"
        emptyDescription="You have no invoices yet. One is raised once an administrator bills a confirmed booking."
        emptyAction={
          <Button type="primary" onClick={() => navigate('/my-bookings')} style={{ marginTop: '1rem' }}>
            View my bookings
          </Button>
        }
      >
        <Row gutter={[20, 20]}>
          {invoices.map((invoice) => {
            const paidPct = Number(invoice.totalAmount)
              ? Math.round((Number(invoice.paidAmount) / Number(invoice.totalAmount)) * 100)
              : 0;
            const settled = invoice.status === 'PAID';

            return (
              <Col xs={24} lg={12} key={invoice.id}>
                <Card style={{ borderRadius: 20, height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Space align="start">
                      <div
                        style={{
                          background: '#eef2ff',
                          padding: 12,
                          borderRadius: 14,
                          color: '#4f46e5',
                          fontSize: 18,
                        }}
                      >
                        <FileTextOutlined />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{invoice.invoiceNumber}</div>
                        <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                          {formatDateTime(invoice.invoiceDate)}
                        </Text>
                      </div>
                    </Space>
                    <Tag color={STATUS_COLOR[invoice.status] || 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
                      {humaniseEnum(invoice.status)}
                    </Tag>
                  </div>

                  <Divider style={{ margin: '1rem 0' }} />

                  <Row gutter={[12, 12]}>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '0.72rem' }}>Total</Text>
                      <div style={{ fontWeight: 700 }}>{formatMoney(invoice.totalAmount)}</div>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '0.72rem' }}>Paid</Text>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>{formatMoney(invoice.paidAmount)}</div>
                    </Col>
                    <Col span={8}>
                      <Text type="secondary" style={{ fontSize: '0.72rem' }}>Balance</Text>
                      <div style={{ fontWeight: 700, color: settled ? '#16a34a' : '#dc2626' }}>
                        {formatMoney(invoice.balanceAmount)}
                      </div>
                    </Col>
                  </Row>

                  <Progress
                    percent={paidPct}
                    size="small"
                    strokeColor={settled ? '#16a34a' : '#6366f1'}
                    style={{ marginTop: 10 }}
                  />

                  {Number(invoice.discount) > 0 && (
                    <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                      Includes a {formatMoney(invoice.discount)} discount
                    </Text>
                  )}

                  {invoice.payments?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                        {invoice.payments.length} payment{invoice.payments.length === 1 ? '' : 's'} —{' '}
                        {invoice.payments.map((p) => humaniseEnum(p.mode)).join(', ')}
                      </Text>
                    </div>
                  )}

                  <Button
                    type={settled ? 'default' : 'primary'}
                    size="large"
                    block
                    disabled={settled}
                    icon={settled ? null : <LockOutlined />}
                    onClick={() => setPaying(invoice)}
                    style={{
                      borderRadius: 12,
                      marginTop: '1.25rem',
                      fontWeight: 700,
                      background: settled ? undefined : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    }}
                  >
                    {settled ? 'Settled' : `Pay ${formatMoney(invoice.balanceAmount)}`}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      </AsyncBoundary>

      <CheckoutModal
        open={paying !== null}
        invoice={paying}
        onClose={() => setPaying(null)}
        onPaid={reload}
      />
    </div>
  );
};

export default MyInvoicesPage;
