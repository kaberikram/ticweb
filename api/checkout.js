import 'dotenv/config';
import Stripe from 'stripe';
import cors from 'cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize cors middleware
const corsHandler = cors();

// TODO: Replace the price IDs below with your actual Stripe Price IDs if you were using them.
// However, your current logic dynamically sets prices, so PRICE_LOOKUP might be unused.
// const PRICE_LOOKUP = { ... };

// Shipping rate IDs from env. Stripe allows max 5 - we hard-cap.
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

// Individual rate IDs for mapping
const SHIPPING_RATE_MALAYSIA = process.env.SHIPPING_RATE_MALAYSIA || 'shr_1RKj1hKauXLQMGFmynhllfQW';
const SHIPPING_RATE_ROW = process.env.SHIPPING_RATE_ROW || 'shr_1RKj3YKauXLQMGFmQRMEkf2y';

// Allowed shipping countries from environment (comma-separated list)
let allowedCountries = process.env.SHIPPING_ALLOWED_COUNTRIES
  ? process.env.SHIPPING_ALLOWED_COUNTRIES.split(',').map(s => s.trim()).filter(Boolean)
  : [];

if (allowedCountries.length === 0) {
  allowedCountries = ['MY', 'SG', 'US'];
}
const SHIPPING_ALLOWED_COUNTRIES = allowedCountries;

export default async function handler(req, res) {
  // Apply CORS middleware
  // You might need to configure CORS more specifically depending on your needs
  // For Vercel, allowing all origins for this function might be initially okay,
  // or you can restrict it to your domain once deployed.
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  if (req.method === 'POST') {
    try {
      const { cart, embedded } = req.body;
      const line_items = cart.map(item => {
        let unitAmount;
        if (item.name && item.name.toLowerCase().includes('ratée')) {
          unitAmount = 29900; // RATÉE — La Rat Féminine price
        } else if (item.name && item.name.toLowerCase().includes('jacket')) {
          unitAmount = item.price || 50; // TIC Jacket (cents; cart sends price)
        } else if (item.name && item.name.includes('Ratward')) {
          unitAmount = 3000; // RatwardScissor-T price
        } else {
          unitAmount = 2000; // Default price for other T-shirts
        }
        
        let productName = item.name;
        if (item.fit && item.fit !== 'N/A' && item.size && item.size !== 'Standard') {
          const fitLabel = item.fit.charAt(0).toUpperCase() + item.fit.slice(1);
          productName = `${item.name} — ${fitLabel} / ${item.size}`;
        } else if (item.size && item.size !== 'Standard') {
          productName = `${item.name} — ${item.size}`;
        }

        return {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: productName
            }
          },
          quantity: item.quantity
        };
      });

      // Determine the origin for success and cancel URLs
      // Vercel sets process.env.VERCEL_URL (the deployment URL)
      // and process.env.NODE_ENV which could be 'production' or 'development'
      const origin = req.headers.origin || 'http://localhost:3000'; // Fallback for local dev if origin header isn't there

      const itemsSummary = cart.map(item => {
        let name = item.name;
        if (item.size && item.size !== 'Standard') name += ` — ${item.size}`;
        return `${name} x${item.quantity}`;
      }).join(', ');

      const isEmbedded = embedded === true;

      const sessionConfig = {
        payment_method_types: ['card'],
        line_items,
        phone_number_collection: { enabled: true },
        mode: 'payment',
        shipping_address_collection: { allowed_countries: SHIPPING_ALLOWED_COUNTRIES },
        metadata: { items_summary: itemsSummary.substring(0, 500) },
        payment_intent_data: { metadata: { items_summary: itemsSummary.substring(0, 500) } },
      };

      if (isEmbedded) {
        sessionConfig.ui_mode = 'embedded';
        sessionConfig.return_url = `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`;
        sessionConfig.permissions = { update_shipping_details: 'server_only' };
        sessionConfig.shipping_options = [
          {
            shipping_rate_data: {
              display_name: 'Standard shipping',
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'usd' }
            }
          }
        ];
      } else {
        sessionConfig.success_url = `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`;
        sessionConfig.cancel_url = `${origin}/`;
        sessionConfig.shipping_options = SHIPPING_RATE_IDS.map(id => ({ shipping_rate: id }));
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      if (isEmbedded) {
        res.status(200).json({ clientSecret: session.client_secret });
      } else {
        res.status(200).json({ sessionId: session.id, url: session.url });
      }
    } catch (err) {
      console.error('Error creating Stripe Checkout session:', err);
      // It's good practice to use a more generic error message for the client
      // and log the detailed error on the server.
      res.status(500).json({ error: { message: 'Failed to create checkout session.', details: err.message } });
    }
  } else {
    // Handle any other HTTP methods or return method not allowed
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
} 