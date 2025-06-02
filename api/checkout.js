require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

// Initialize cors middleware
const corsHandler = cors();

// TODO: Replace the price IDs below with your actual Stripe Price IDs if you were using them.
// However, your current logic dynamically sets prices, so PRICE_LOOKUP might be unused.
// const PRICE_LOOKUP = { ... };

// Updated shipping rate IDs from Stripe Dashboard
const SHIPPING_RATE_IDS = [
  'shr_1RKj1hKauXLQMGFmynhllfQW',  // Malaysia
  'shr_1RKj3YKauXLQMGFmQRMEkf2y'   // Rest of world
];

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
      const { cart } = req.body;
      const line_items = cart.map(item => {
        let unitAmount;
        if (item.name && item.name.toLowerCase().includes('ratée')) {
          unitAmount = 29900; // RATÉE — La Rat Féminine price
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

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        phone_number_collection: {
          enabled: true,
        },
        mode: 'payment',
        shipping_address_collection: { allowed_countries: ['MY', 'SG', 'US'] },
        shipping_options: SHIPPING_RATE_IDS.map(id => ({ shipping_rate: id })),
        success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart.html`
      });

      res.status(200).json({ sessionId: session.id });
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