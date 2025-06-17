#!/usr/bin/env tsx
/**
 * Manual test script for weather API
 * Run with: tsx test/manual-test.ts
 */

import { buildParams, CommonArgs } from '../src/server.js';
import { request } from 'undici';

async function callApi(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  console.log(`Calling: ${endpoint}?${qs}`);
  
  try {
    const { body } = await request(`${endpoint}?${qs}`);
    return await body.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

async function getCurrentWeather(args: CommonArgs) {
  const params = await buildParams(args);
  return callApi("https://api.openweathermap.org/data/2.5/weather", params);
}

async function getForecast(args: CommonArgs) {
  const params = await buildParams(args);
  return callApi("https://api.openweathermap.org/data/2.5/forecast", params);
}

async function getAlerts(args: CommonArgs) {
  // For free accounts, we'll use the current weather endpoint and check for alerts in the response
  const params = await buildParams(args);
  return callApi("https://api.openweathermap.org/data/2.5/weather", params);
}

async function main() {
  if (!process.env.OPENWEATHERMAP_API_KEY) {
    console.error('OPENWEATHERMAP_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🌤️  Weather API Manual Test\n');

  try {
    // Test 1: Current weather by city
    console.log('1. Testing current weather for London...');
    const weather = await getCurrentWeather({
      city: 'London',
      units: 'metric'
    });
    console.log('✅ Current weather:', JSON.stringify(weather, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Forecast by coordinates
    console.log('2. Testing forecast for NYC coordinates...');
    const forecast = await getForecast({
      lat: 40.7128,
      lon: -74.0060,
      units: 'imperial'
    });
    console.log('✅ Forecast:', JSON.stringify(forecast, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Weather alerts
    console.log('3. Testing alerts for Miami...');
    const alerts = await getAlerts({
      city: 'Miami',
      units: 'metric'
    });
    console.log('✅ Alerts:', JSON.stringify(alerts, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('manual-test.ts')) {
  main();
}
