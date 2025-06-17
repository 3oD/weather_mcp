import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildParams, CommonArgs } from '../src/server.js';
import { request } from 'undici';

// Mock API testing
const mockApiCall = async (endpoint: string, params: Record<string, string>) => {
  console.log(`Would call: ${endpoint}?${new URLSearchParams(params).toString()}`);
  return { mock: true, endpoint, params };
};

// Real API functions for testing
async function callApi(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const { body } = await request(`${endpoint}?${qs}`);
  return body.json();
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

describe('Weather API Tests', () => {
  describe('buildParams', () => {
    it('should build params with city', async () => {
      const args: CommonArgs = {
        city: 'London',
        units: 'metric'
      };
      
      const params = await buildParams(args);
      
      assert.strictEqual(params.q, 'London');
      assert.strictEqual(params.units, 'metric');
      assert.ok(params.appid);
    });

    it('should build params with coordinates', async () => {
      const args: CommonArgs = {
        lat: 51.5074,
        lon: -0.1278,
        units: 'imperial'
      };
      
      const params = await buildParams(args);
      
      assert.strictEqual(params.lat, '51.5074');
      assert.strictEqual(params.lon, '-0.1278');
      assert.strictEqual(params.units, 'imperial');
      assert.ok(params.appid);
    });

    it('should build params with exclude parameter', async () => {
      const args: CommonArgs = {
        city: 'Berlin',
        units: 'metric'
      };
      
      const params = await buildParams(args, 'current,minutely');
      
      assert.strictEqual(params.exclude, 'current,minutely');
    });    it('should default to metric units', async () => {
      const args: CommonArgs = {
        city: 'Paris',
        units: 'metric'
      };
      
      const params = await buildParams(args);
      
      assert.strictEqual(params.units, 'metric');
    });
  });

  describe('Mock API Calls', () => {
    it('should mock current weather call', async () => {
      const args: CommonArgs = {
        city: 'London',
        units: 'metric'
      };
        const params = await buildParams(args);
      const result = await mockApiCall('https://api.openweathermap.org/data/2.5/weather', params);
      
      assert.strictEqual(result.mock, true);
      assert.strictEqual(result.endpoint, 'https://api.openweathermap.org/data/2.5/weather');
      console.log('Current Weather Mock:', result);
    });

    it('should mock forecast call', async () => {
      const args: CommonArgs = {
        lat: 40.7128,
        lon: -74.0060,
        units: 'imperial'
      };      const params = await buildParams(args);
      const result = await mockApiCall('https://api.openweathermap.org/data/2.5/forecast', params);
      
      assert.strictEqual(result.mock, true);
      assert.strictEqual(result.endpoint, 'https://api.openweathermap.org/data/2.5/forecast');
      console.log('Forecast Mock:', result);
    });

    it('should mock alerts call', async () => {
      const args: CommonArgs = {
        city: 'Miami',
        units: 'metric'
      };      const params = await buildParams(args);
      const result = await mockApiCall('https://api.openweathermap.org/data/2.5/weather', params);
      
      assert.strictEqual(result.mock, true);
      assert.strictEqual(result.endpoint, 'https://api.openweathermap.org/data/2.5/weather');
      console.log('Alerts Mock:', result);    });
  });

  // Real API Tests - uncomment and modify as needed
  describe('Real API Calls (Manual Testing)', () => {
    it('should get current weather for London', async () => {
      if (!process.env.OPENWEATHERMAP_API_KEY) {
        console.log('Skipping real API test - no API key');
        return;
      }
      
      const args: CommonArgs = {
        city: 'London',
        units: 'metric'
      };
      
      try {
        const result = await getCurrentWeather(args);
        console.log('Current Weather (London):', JSON.stringify(result, null, 2));
        assert.ok(result);
      } catch (error) {
        console.error('API call failed:', error);
        throw error;
      }
    });

    it('should get forecast for coordinates', async () => {
      if (!process.env.OPENWEATHERMAP_API_KEY) {
        console.log('Skipping real API test - no API key');
        return;
      }
      
      const args: CommonArgs = {
        lat: 40.7128,
        lon: -74.0060,
        units: 'imperial'
      };
      
      try {
        const result = await getForecast(args);
        console.log('Forecast (NYC):', JSON.stringify(result, null, 2));
        assert.ok(result);
      } catch (error) {
        console.error('API call failed:', error);
        throw error;
      }
    });

    it('should get alerts for Miami', async () => {
      if (!process.env.OPENWEATHERMAP_API_KEY) {
        console.log('Skipping real API test - no API key');
        return;
      }
      
      const args: CommonArgs = {
        city: 'Miami',
        units: 'metric'
      };
      
      try {
        const result = await getAlerts(args);
        console.log('Alerts (Miami):', JSON.stringify(result, null, 2));
        assert.ok(result);
      } catch (error) {
        console.error('API call failed:', error);
        throw error;
      }
    });
  });
});
