import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI, ticketsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ total, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/my-tickets` },
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} disabled={!stripe || processing}>
        {processing ? 'Processing...' : `Pay $${total?.toFixed(2)}`}
      </button>
      <p className="checkout-secure">🔒 Secured by Stripe · SSL Encrypted</p>
    </form>
  );
}

export default function CheckoutPage() {
  const { eventId, tierId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const { data: eventData } = useQuery({
    queryKey: ['event-checkout', eventId],
    queryFn: () => eventsAPI.getBySlug(eventId).then((r) => r.data).catch(() => null),
    enabled: false,
  });

  const initCheckout = async () => {
    if (!ageConfirmed) { toast.error('Please confirm you are 18+'); return; }
    setLoading(true);
    try {
      const { data } = await ticketsAPI.checkout({ eventId, tierId, quantity });
      setClientSecret(data.clientSecret);
      setCheckoutData(data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#CC0088',
        colorBackground: '#0F0F0F',
        colorText: '#ffffff',
        colorDanger: '#FF6600',
        fontFamily: "'Space Mono', monospace",
        borderRadius: '4px',
      },
    },
  } : null;

  if (!clientSecret) {
    return (
      <div className="checkout-page page-container">
        <div className="checkout-header">
          <h1>Complete Your Purchase</h1>
          <p className="text-dim">18+ event · Valid ID required at door</p>
        </div>

        <div className="checkout-age-gate card">
          <div className="age-gate-icon">🔞</div>
          <h2>Age Verification Required</h2>
          <p>RESONANCE events are strictly 18+. By proceeding, you confirm:</p>
          <ul>
            <li>You are 18 years of age or older</li>
            <li>You will bring valid government-issued photo ID to the event</li>
            <li>Entry may be refused without valid ID</li>
          </ul>
          <label className="age-checkbox">
            <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
            I confirm I am 18+ and will present valid ID at the door
          </label>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Quantity</label>
            <select className="input" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={initCheckout}
            disabled={loading || !ageConfirmed}
          >
            {loading ? 'Loading...' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page page-container">
      <div className="checkout-header">
        <h1>Complete Your Purchase</h1>
      </div>

      {checkoutData && (
        <div className="checkout-summary card">
          <div className="checkout-summary__row"><span>Subtotal</span><span>${checkoutData.subtotal?.toFixed(2)}</span></div>
          <div className="checkout-summary__row"><span>Platform fee (2.5%)</span><span>${checkoutData.platformFee?.toFixed(2)}</span></div>
          <div className="checkout-summary__row total"><span>Total</span><span>${checkoutData.total?.toFixed(2)}</span></div>
        </div>
      )}

      <div className="checkout-stripe card">
        <Elements stripe={stripePromise} options={stripeOptions}>
          <PaymentForm
            total={checkoutData?.total}
            onSuccess={() => { toast.success('Payment confirmed! Check your email for tickets.'); navigate('/my-tickets'); }}
          />
        </Elements>
      </div>
    </div>
  );
}
