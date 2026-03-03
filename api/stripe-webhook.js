import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL

export const config = {
  api: { bodyParser: false }
}

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function addOrderToSheet({ receiptNumber, status, trackingNumber, carrierLink, date, items }) {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiptNumber: `#${receiptNumber}`,
      status,
      trackingNumber: trackingNumber || '',
      carrierLink: carrierLink || '',
      date,
      items
    })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object
    const receiptNumber = charge.receipt_number

    if (!receiptNumber) {
      console.warn('charge.succeeded: receipt_number missing', charge.id)
      return res.status(200).json({ received: true })
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent)
      const itemsSummary = paymentIntent.metadata?.items_summary || 'See Stripe dashboard'
      const orderDate = new Date(charge.created * 1000).toLocaleDateString('en-US')

      await addOrderToSheet({
        receiptNumber,
        status: 'Order Received',
        trackingNumber: '',
        carrierLink: '',
        date: orderDate,
        items: itemsSummary
      })
    } catch (err) {
      console.error('Error processing charge.succeeded:', err)
    }
  }

  res.status(200).json({ received: true })
}
