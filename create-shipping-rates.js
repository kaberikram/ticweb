#!/usr/bin/env node

/**
 * Create 7 regional shipping rates in Stripe via API.
 * Usage: node create-shipping-rates.js
 */

import 'dotenv/config';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY not found in environment.');
  console.error('Add it to .env or run with: STRIPE_SECRET_KEY=sk_... node create-shipping-rates.js');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 7 shipping regions (prices in cents, delivery in business days)
const regions = [
  {
    name: 'Malaysia',
    amount: 510, // $5.10
    currency: 'usd',
    countries: ['MY'],
    delivery: { min: 11, max: 17 },
  },
  {
    name: 'Singapore',
    amount: 1270, // $12.70
    currency: 'usd',
    countries: ['SG'],
    delivery: { min: 11, max: 15 },
  },
  {
    name: 'Southeast Asia',
    amount: 2290, // $22.90
    currency: 'usd',
    countries: ['TH', 'ID', 'PH', 'VN', 'KH', 'LA', 'MM', 'BN', 'TL'],
    delivery: { min: 12, max: 18 },
  },
  {
    name: 'East Asia',
    amount: 2800, // $28.00
    currency: 'usd',
    countries: ['CN', 'JP', 'KR', 'TW', 'HK', 'MO', 'MN'],
    delivery: { min: 12, max: 20 },
  },
  {
    name: 'Australia / New Zealand',
    amount: 3820, // $38.20
    currency: 'usd',
    countries: ['AU', 'NZ'],
    delivery: { min: 13, max: 22 },
  },
  {
    name: 'Europe / United Kingdom',
    amount: 5600, // $56.00
    currency: 'usd',
    countries: [
      'GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'LU',
      'DK', 'SE', 'FI', 'NO', 'IS', 'CH', 'AT', 'PT', 'GR',
      'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'RO', 'BG', 'EE',
      'LV', 'LT', 'MT', 'CY',
    ],
    delivery: { min: 13, max: 24 },
  },
  {
    name: 'USA / Canada',
    amount: 6620, // $66.20
    currency: 'usd',
    countries: ['US', 'CA'],
    delivery: { min: 13, max: 25 },
  },
];

async function createRates() {
  const LIVE_MODE = process.env.STRIPE_SECRET_KEY.startsWith('sk_live');
  if (LIVE_MODE) {
    console.warn('⚠️  WARNING: Using LIVE Stripe key. This will create real shipping rates.');
    console.warn('   Press Ctrl+C to cancel, or wait 5 seconds to continue…');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Creating 7 regional shipping rates in Stripe…\n');
  const rateIds = [];

  for (const region of regions) {
    try {
      const rate = await stripe.shippingRates.create({
        display_name: `${region.name} Shipping`,
        fixed_amount: {
          amount: region.amount,
          currency: region.currency,
        },
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: region.delivery.min,
          },
          maximum: {
            unit: 'business_day',
            value: region.delivery.max,
          },
        },
        type: 'fixed_amount',
        tax_behavior: 'unspecified', // adjust if you have tax settings
        metadata: {
          region: region.name,
          created_by: 'ticweb-script',
        },
      });

      console.log(`✅ ${region.name}:`);
      console.log(`   ID: ${rate.id}`);
      console.log(`   Price: $${(region.amount / 100).toFixed(2)}`);
      console.log(`   Countries: ${region.countries.length}`);
      rateIds.push(rate.id);
    } catch (error) {
      console.error(`❌ Failed to create ${region.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All shipping rates created!\n');

  console.log('📋 SHIPPING_RATE_IDS (copy into .env or Vercel):');
  console.log(`SHIPPING_RATE_IDS=${rateIds.join(',')}\n`);

  const allCountries = regions.flatMap(r => r.countries);
  console.log('🌍 SHIPPING_ALLOWED_COUNTRIES:');
  console.log(`SHIPPING_ALLOWED_COUNTRIES=${allCountries.join(',')}\n`);

  console.log('📝 Next steps:');
  console.log('1. Update your environment variables with the IDs above');
  console.log('2. Deploy (Vercel will auto‑deploy if you update env vars)');
  console.log('3. Test checkout with addresses from each region');
  console.log('4. Optional: disable old shipping rates in Stripe Dashboard');
}

createRates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});