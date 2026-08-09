import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Steps, Alert, Radio, Divider } from 'antd';
import {
  CreditCardOutlined,
  MobileOutlined,
  BankOutlined,
  LockOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { createOrder, verifyPayment, mockPay, openRazorpayCheckout } from '../api/payments';
import { formatMoney } from '../utils/format';
import { ApiError } from '../api/client';

const { Title, Text } = Typography;

/**
 * Drives the three-step online payment against an invoice.
 *
 *   create order → pay in the checkout sheet → verify the signature server-side
 *
 * Only the middle step differs by provider. With `razorpay` we hand off to Razorpay's own modal,
 * which renders cards, UPI (with its own QR), netbanking and wallets — nothing for us to build,
 * and no redirect away from the app. With `mock` the sheet below stands in for it, and the
 * backend plays the gateway's part in producing a signature.
 *
 * Either way step 3 is the same call, so a demo on the mock provider still proves the signature
 * verification works.
 */
const PAY_METHODS = [
  { value: 'upi', label: 'UPI', icon: <MobileOutlined />, hint: 'GPay, PhonePe, Paytm' },
  { value: 'card', label: 'Card', icon: <CreditCardOutlined />, hint: 'Credit or debit' },
  { value: 'netbanking', label: 'Netbanking', icon: <BankOutlined />, hint: 'All major banks' },
];

const CheckoutModal = ({ open, invoice, onClose, onPaid }) => {
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const amountDue = invoice?.balanceAmount;

  const reset = () => {
    setStep(0);
    setOrder(null);
    setBusy(false);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  /** Step 1 — register the outstanding balance with the gateway. */
  const startOrder = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createOrder(invoice.id);
      setOrder(created);
      setStep(1);

      // A real gateway takes over here: hand off immediately rather than showing our own sheet.
      if (created.provider !== 'mock') {
        await payWithRazorpay(created);
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  /** Step 2 (real) — Razorpay's modal, then step 3. */
  const payWithRazorpay = async (created) => {
    setBusy(true);
    setError(null);
    try {
      const callback = await openRazorpayCheckout(created);
      await settle(callback);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(err.message));
    } finally {
      setBusy(false);
    }
  };

  /** Step 2 (mock) — the backend plays the gateway, then step 3. */
  const payWithMock = async () => {
    setBusy(true);
    setError(null);
    try {
      const callback = await mockPay(order.orderId);
      await settle(callback);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  /** Step 3 — the server re-computes the signature before recording anything. */
  const settle = async (callback) => {
    const updated = await verifyPayment(callback);
    setStep(2);
    onPaid?.(updated);
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      destroyOnHidden
      maskClosable={!busy}
      title={
        <Space>
          <LockOutlined style={{ color: '#6366f1' }} />
          Pay invoice {invoice?.invoiceNumber}
        </Space>
      }
    >
      <Steps
        size="small"
        current={step}
        style={{ margin: '1rem 0 1.5rem' }}
        items={[{ title: 'Order' }, { title: 'Pay' }, { title: 'Confirmed' }]}
      />

      {error && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          message={error.message}
          style={{ borderRadius: 12, marginBottom: '1rem' }}
        />
      )}

      {/* ---------- Step 1 ---------- */}
      {step === 0 && (
        <div>
          <div style={{ textAlign: 'center', padding: '0.5rem 0 1.25rem' }}>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              Amount due
            </Text>
            <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800 }}>
              {formatMoney(amountDue)}
            </Title>
          </div>
          <Button
            type="primary"
            size="large"
            block
            loading={busy}
            onClick={startOrder}
            style={{ borderRadius: 12, fontWeight: 700 }}
          >
            Continue to payment
          </Button>
          <Text
            type="secondary"
            style={{ fontSize: '0.75rem', display: 'block', textAlign: 'center', marginTop: 12 }}
          >
            Your seats stay confirmed while you pay.
          </Text>
        </div>
      )}

      {/* ---------- Step 2 — mock sheet standing in for the gateway ---------- */}
      {step === 1 && order?.provider === 'mock' && (
        <div>
          <Alert
            type="info"
            showIcon
            message="Test mode"
            description="No real gateway is configured, so this sheet stands in for it. The signature it returns is still verified by the server."
            style={{ borderRadius: 12, marginBottom: '1rem' }}
          />

          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
            Order <code>{order.orderId}</code>
          </Text>

          <Divider style={{ margin: '0.75rem 0' }} />

          <Radio.Group
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {PAY_METHODS.map((m) => (
                <Radio key={m.value} value={m.value} style={{ width: '100%' }}>
                  <Space>
                    {m.icon}
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                      {m.hint}
                    </Text>
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>

          <Divider style={{ margin: '1rem 0 0.75rem' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Text strong>Total</Text>
            <Text strong style={{ fontSize: '1.1rem' }}>
              {formatMoney(amountDue)}
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={busy}
            onClick={payWithMock}
            style={{ borderRadius: 12, fontWeight: 700 }}
          >
            Pay {formatMoney(amountDue)}
          </Button>
        </div>
      )}

      {/* ---------- Step 2 — real gateway has taken over ---------- */}
      {step === 1 && order && order.provider !== 'mock' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <Text type="secondary">
            {busy
              ? 'Waiting for the payment window…'
              : 'The payment window closed. You can try again.'}
          </Text>
          {!busy && (
            <Button
              type="primary"
              block
              size="large"
              onClick={() => payWithRazorpay(order)}
              style={{ borderRadius: 12, marginTop: '1rem', fontWeight: 700 }}
            >
              Reopen payment window
            </Button>
          )}
        </div>
      )}

      {/* ---------- Step 3 ---------- */}
      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <CheckCircleFilled style={{ fontSize: 56, color: '#16a34a' }} />
          <Title level={4} style={{ marginTop: '1rem', fontWeight: 800 }}>
            Payment confirmed
          </Title>
          <Text type="secondary" style={{ fontSize: '0.88rem' }}>
            Invoice {invoice?.invoiceNumber} is now settled.
          </Text>
          <Button
            type="primary"
            size="large"
            block
            onClick={close}
            style={{ borderRadius: 12, marginTop: '1.5rem', fontWeight: 700 }}
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default CheckoutModal;
