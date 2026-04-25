import 'dotenv/config';
import Stripe from 'stripe';
import cors from 'cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const corsHandler = cors();

// Shipping rate IDs from env (max 5).
// Order: [0]=Malaysia, [1]=Southeast Asia, [2]=East Asia, [3]=Australia/NZ, [4]=US/Canada
const MAX_SHIPPING_OPTIONS = 5;
let shippingRateIds = process.env.SHIPPING_RATE_IDS
  ? process.env.SHIPPING_RATE_IDS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
if (shippingRateIds.length === 0) {
  shippingRateIds = [
    process.env.SHIPPING_RATE_MALAYSIA || 'shr_1RKj1hKauXLQMGFmynhllfQW',
    process.env.SHIPPING_RATE_ROW || 'shr_1RKj3YKauXLQMGFmQRMEkf2y'
  ];
}
const SHIPPING_RATE_IDS = shippingRateIds.slice(0, MAX_SHIPPING_OPTIONS);

// Country code -> index into SHIPPING_RATE_IDS
const COUNTRY_TO_RATE_INDEX = {
  MY: 0,
  SG: 1, ID: 1, TH: 1, PH: 1, VN: 1, BN: 1, KH: 1, LA: 1, MM: 1, TL: 1,
  JP: 2, KR: 2, TW: 2, HK: 2, CN: 2,
  AU: 3, NZ: 3,
  US: 4, CA: 4
};

function getShippingRateIdForCountry(countryCode) {
  const upper = (countryCode || '').toUpperCase();
  const index = COUNTRY_TO_RATE_INDEX[upper];
  if (index !== undefined && SHIPPING_RATE_IDS[index]) {
    return SHIPPING_RATE_IDS[index];
  }
  return SHIPPING_RATE_IDS[SHIPPING_RATE_IDS.length - 1] || SHIPPING_RATE_IDS[0];
}

export default async function handler(req, res) {
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { checkout_session_id, shipping_details } = req.body;
    if (!checkout_session_id || !shipping_details || !shipping_details.address) {
      return res.status(400).json({
        type: 'error',
        message: 'Missing checkout_session_id or shipping_details with address.'
      });
    }

    const country = shipping_details.address.country;
    const rateId = getShippingRateIdForCountry(country);

    await stripe.checkout.sessions.update(checkout_session_id, {
      shipping_options: [{ shipping_rate: rateId }],
      collected_information: { shipping_details }
    });

    return res.status(200).json({ type: 'object', value: { succeeded: true } });
  } catch (err) {
    console.error('Error updating shipping:', err);
    return res.status(500).json({
      type: 'error',
      message: err.message || 'Failed to update shipping options.'
    });
  }
}
