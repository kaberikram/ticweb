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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    try {
      // Small delay to let Stripe generate the receipt number
      await new Promise(r => setTimeout(r, 3000))

      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
        { expand: ['latest_charge'] }
      )

      let receiptNumber = paymentIntent.latest_charge?.receipt_number

      // If still not available, retry once more after a longer wait
      if (!receiptNumber) {
        await new Promise(r => setTimeout(r, 5000))
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge?.id || paymentIntent.latest_charge)
        receiptNumber = charge.receipt_number
      }

      receiptNumber = receiptNumber || paymentIntent.id

      const itemsSummary = session.metadata?.items_summary || 'See Stripe dashboard'
      const orderDate = new Date(session.created * 1000).toLocaleDateString('en-US')

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber: `#${receiptNumber}`,
          status: 'Order Received',
          trackingNumber: '',
          carrierLink: '',
          date: orderDate,
          items: itemsSummary
        })
      })
    } catch (err) {
      console.error('Error processing checkout.session.completed:', err)
    }
  }

  res.status(200).json({ received: true })
}
