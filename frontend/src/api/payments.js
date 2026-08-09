import api from './client';

/**
 * Online payment against an invoice.
 *
 * The shape of the flow is the gateway's, not ours:
 *
 *   1. `createOrder` — the server registers the invoice's outstanding balance with the gateway
 *      and returns an order id, the publishable key, and the amount in paise.
 *   2. the customer pays in the gateway's checkout sheet, which hands back
 *      `{ orderId, paymentId, signature }`.
 *   3. `verifyPayment` — the server re-computes the signature and only then records the payment.
 *
 * Step 2 is the only part that differs between providers: Razorpay opens its own modal, while
 * the mock provider has `mockPay` stand in for it. Steps 1 and 3 are identical either way, so
 * demoing against the mock exercises the real verification path.
 */

export const createOrder = (invoiceId) => api.post('/api/payments/orders', { invoiceId });

export const verifyPayment = ({ orderId, paymentId, signature }) =>
  api.post('/api/payments/verify', { orderId, paymentId, signature });

/**
 * Mock-provider only: asks the backend to play the gateway and produce a valid
 * payment id + signature. Absent when the real provider is configured.
 */
export const mockPay = (orderId) => api.post('/api/payments/mock/pay', { orderId });

const RAZORPAY_SDK = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads Razorpay's checkout script once, resolving when `window.Razorpay` is usable. */
export const loadRazorpaySdk = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_SDK}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout.')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SDK;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your connection.'));
    document.body.appendChild(script);
  });

/**
 * Opens Razorpay's hosted checkout modal and resolves with the values it hands back.
 *
 * Razorpay renders cards, UPI (including its own QR), netbanking and wallets inside the modal —
 * there is nothing for us to build or paste, and no redirect away from the app.
 */
export const openRazorpayCheckout = (order, { name, contact } = {}) =>
  loadRazorpaySdk().then(
    (Razorpay) =>
      new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amountMinor,
          currency: order.currency,
          name: 'EventPass',
          description: `Invoice ${order.invoiceNumber}`,
          prefill: { name: name || undefined, contact: contact || undefined },
          handler: (response) =>
            resolve({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          modal: {
            ondismiss: () => reject(new Error('Payment window closed before the payment completed.')),
          },
        });
        checkout.on('payment.failed', (event) =>
          reject(new Error(event?.error?.description || 'The payment was declined.')),
        );
        checkout.open();
      }),
  );
