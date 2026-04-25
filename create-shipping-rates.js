#!/usr/bin/env node

/**
 * Create 5 regional MYR shipping rates in Stripe via API.
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

// 5 shipping regions (amounts in sen, delivery in working/business days)
const regions = [
  {
    name: 'Malaysia',
    amount: 2000, // RM20
    currency: 'myr',
    countries: ['MY'],
    delivery: { min: 3, max: 5 },
  },
  {
    name: 'Southeast Asia',
    amount: 8000, // RM80
    currency: 'myr',
    countries: ['SG', 'ID', 'TH', 'PH', 'VN', 'BN', 'KH', 'LA', 'MM', 'TL'],
    delivery: { min: 5, max: 10 },
  },
  {
    name: 'East Asia',
    amount: 12000, // RM120
    currency: 'myr',
    countries: ['JP', 'KR', 'TW', 'HK', 'CN'],
    delivery: { min: 7, max: 14 },
  },
  {
    name: 'Australia / New Zealand',
    amount: 16000, // RM160
    currency: 'myr',
    countries: ['AU', 'NZ'],
    delivery: { min: 10, max: 21 },
  },
  {
    name: 'USA / Canada',
    amount: 25000, // RM250
    currency: 'myr',
    countries: ['US', 'CA'],
    delivery: { min: 10, max: 21 },
  },
];

async function createRates() {
  const LIVE_MODE = process.env.STRIPE_SECRET_KEY.startsWith('sk_live');
  if (LIVE_MODE) {
    console.warn('⚠️  WARNING: Using LIVE Stripe key. This will create real shipping rates.');
    console.warn('   Press Ctrl+C to cancel, or wait 5 seconds to continue…');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Creating 5 regional MYR shipping rates in Stripe…\n');
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
      console.log(`   Price: RM${(region.amount / 100).toFixed(2)}`);
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