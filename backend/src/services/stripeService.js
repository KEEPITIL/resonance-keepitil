const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5');

// ── Create or retrieve customer ───────────────────────────────────────────────
const getOrCreateCustomer = async (user) => {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName || user.email,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  await user.save({ validateBeforeSave: false });
  return customer.id;
};

// ── Create Payment Intent for ticket purchase ─────────────────────────────────
const createTicketPaymentIntent = async ({ amount, currency = 'usd', customerId, eventId, metadata = {} }) => {
  const platformFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    application_fee_amount: platformFeeAmount * 100,
    metadata: {
      eventId: eventId?.toString(),
      platformFee: platformFeeAmount.toString(),
      ...metadata,
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    platformFee: platformFeeAmount,
  };
};

// ── Create Connect Account for organizer/DJ payouts ───────────────────────────
const createConnectAccount = async (email) => {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
  });
  return account.id;
};

const createConnectOnboardingLink = async (accountId, returnUrl, refreshUrl) => {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
  return link.url;
};

// ── Refund a ticket ───────────────────────────────────────────────────────────
const refundTicket = async (paymentIntentId, reason = 'requested_by_customer') => {
  return stripe.refunds.create({ payment_intent: paymentIntentId, reason });
};

// ── Construct webhook event ───────────────────────────────────────────────────
const constructWebhookEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

// ── Get payment intent ────────────────────────────────────────────────────────
const getPaymentIntent = (id) => stripe.paymentIntents.retrieve(id);

module.exports = {
  stripe,
  getOrCreateCustomer,
  createTicketPaymentIntent,
  createConnectAccount,
  createConnectOnboardingLink,
  refundTicket,
  constructWebhookEvent,
  getPaymentIntent,
  PLATFORM_FEE_PERCENT,
};
