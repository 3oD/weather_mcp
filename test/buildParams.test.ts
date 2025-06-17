import test from 'node:test';
import assert from 'node:assert/strict';
import { buildParams } from '../src/server.ts';

// BuildParams should reject when called with missing lon

test('buildParams fails with missing lon', async () => {
  await assert.rejects(
    buildParams({ lat: 12.34 } as any),
    { message: /Provide city or both lat and lon/ }
  );
});

test('buildParams fails with missing lat', async () => {
  await assert.rejects(
    buildParams({ lon: 56.78 } as any),
    { message: /Provide city or both lat and lon/ }
  );
});
