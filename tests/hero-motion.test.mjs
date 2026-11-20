import assert from 'node:assert/strict';
import test from 'node:test';
import { heroPose } from '../lib/hero-motion.ts';

test('the scroll sequence makes a continuous full turn and is deterministic in reverse', () => {
  const start = heroPose(0);
  const middle = heroPose(.56);
  assert.ok(middle.yaw - start.yaw > Math.PI);
  assert.ok(Math.abs(heroPose(1).yaw - start.yaw - 2 * Math.PI) < 1e-9);
  assert.deepEqual(heroPose(.56), middle);
  assert.ok(heroPose(.29).zoom > start.zoom);
  assert.ok(heroPose(1).zoom < start.zoom);
});

test('the hero clamps progress and holds its initial pose in reduced motion', () => {
  assert.deepEqual(heroPose(-1), heroPose(0));
  assert.deepEqual(heroPose(2), heroPose(1));
  assert.deepEqual(heroPose(.7, true), heroPose(0));
});
