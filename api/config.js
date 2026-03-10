import cors from 'cors';

const corsHandler = cors();

export default async function handler(req, res) {
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return res.status(200).json({ stripePublishableKey });
}
