import assert from 'node:assert/strict';
import test from 'node:test';
import { constructionArcDepth, constructionLayer, constructionLifts, constructionMotion, constructionTurn, constructionViewDistance, isDoubleTap, layerOffset, motionWindow } from '../lib/explode-motion.ts';

test('the construction view turns 15 degrees', () => {
  assert.ok(Math.abs(Math.abs(constructionTurn) * 180 / Math.PI - 15) < 1e-12);
});

test('the companion starts moving before it fades and before the upper opens', () => {
  assert.ok(motionWindow(.1, 0, .76) > 0);
  assert.equal(motionWindow(.1, .14, .75), 0);
  assert.equal(motionWindow(.1, .17, .97), 0);
});

test('an interrupted transition retains position and velocity and settles at the new target', () => {
  const halfway = constructionMotion(0, 0, 1, 300);
  assert.ok(halfway.position > 0 && halfway.position < 1 && halfway.speed > 0);
  const retargeted = constructionMotion(halfway.position, halfway.speed, 0, 0);
  assert.equal(retargeted.position, halfway.position);
  assert.equal(retargeted.speed, halfway.speed);
  assert.deepEqual(constructionMotion(halfway.position, halfway.speed, 0, 2100), { position: 0, speed: 0, settled: true });
});

test('laces, tongue and eye stays move as part of the upper', () => {
  const upper = constructionLayer('R_upper');
  assert.ok(upper);
  for (const part of ['R_laces', 'R_tongue', 'R_eye_stays', 'R_lace_keeper']) {
    assert.strictEqual(constructionLayer(part), upper);
  }
  assert.equal(constructionLayer('L_upper'), undefined);
  assert.ok(constructionLayer('R_sole').level < constructionLayer('R_insole').level);
  assert.strictEqual(constructionLayer('R_tread'), constructionLayer('R_sole'));
});

test('construction stacks matching panels on one axis in physical order', () => {
  const stack = ['sole', 'insole', 'toe_overlay', 'upper', 'collar'].map(name => constructionLayer('R_' + name).level);
  assert.equal(new Set(stack).size, stack.length);
  assert.deepEqual(stack, stack.toSorted((a, b) => a - b));
  for (const name of ['heel', 'side_trim', 'quarter']) {
    assert.equal(constructionLayer('R_' + name).level, constructionLayer('R_toe_overlay').level);
  }
  assert.equal(constructionLayer('R_lining').level, constructionLayer('R_collar').level);
});

test('measured layer heights leave a gap even when their original geometry overlaps', () => {
  const levels = [
    { min: 0, max: .031 },
    { min: .024, max: .029 },
    { min: .018, max: .098 },
    { min: .021, max: .147 },
    { min: .077, max: .152 },
  ];
  const clearance = .024;
  const lifts = constructionLifts(levels.map(level => [level]), [1], clearance);
  for (let level = 1; level < levels.length; level++) {
    const below = levels[level - 1].max + lifts[level - 1];
    const above = levels[level].min + lifts[level];
    assert.ok(Math.abs((above - below) - clearance) < 1e-12);
  }
});

test('an angled clearance plane can keep a pair closer along the common axis', () => {
  const levels = [[{ min: 0, max: .10 }, { min: -.03, max: .05 }], [{ min: .03, max: .12 }, { min: .04, max: .12 }]];
  const lifts = constructionLifts(levels, [1, .8], .01);
  assert.ok(Math.abs((levels[1][1].min + lifts[1] * .8) - levels[0][1].max - .01) < 1e-12);
  assert.ok(lifts[1] - lifts[0] < .05);
});

test('the construction curves inward and clears every lower layer at its new depth', () => {
  assert.ok(constructionArcDepth(2) > constructionArcDepth(1));
  assert.ok(constructionArcDepth(2) > constructionArcDepth(3));
  assert.equal(constructionArcDepth(0), constructionArcDepth(4));
  assert.equal(constructionArcDepth(3), 0);
  const original = [
    [{ min: -.08, max: .11 }, { min: -.1, max: -.05 }],
    [{ min: -.02, max: .02 }, { min: .01, max: .03 }],
    [{ min: -.04, max: .10 }, { min: -.08, max: .04 }],
  ];
  const ranges = original.map(([vertical, angled], level) => {
    const shift = constructionArcDepth(level) * .7;
    return [vertical, { min: angled.min + shift, max: angled.max + shift }];
  });
  const projections = [1, .7];
  const gap = .006;
  const lifts = constructionLifts(ranges, projections, gap);
  assert.ok(lifts[2] > lifts[1] && lifts[1] > lifts[0]);
  for (let above = 1; above < ranges.length; above++) {
    for (let below = 0; below < above; below++) {
      assert.ok(projections.some((projection, axis) => (
        (lifts[above] - lifts[below]) * projection + ranges[above][axis].min - ranges[below][axis].max >= gap - 1e-12
      )));
    }
  }
});

test('the separated layers retain distinct tilts, with the outer layers opening farther', () => {
  const tilts = ['sole', 'insole', 'toe_overlay', 'upper', 'collar'].map(name => constructionLayer('R_' + name).tilt);
  assert.equal(new Set(tilts.map(tilt => tilt.join(','))).size, tilts.length);
  assert.ok(Math.hypot(...tilts[0]) > Math.PI / 9);
  assert.ok(Math.hypot(...tilts.at(-1)) > Math.PI / 9);
  assert.ok(tilts.every(tilt => Math.hypot(...tilt) < Math.PI / 5));
  assert.equal(constructionLayer('R_laces').tilt, constructionLayer('R_upper').tilt);
});

test('the expanded orbit fits the same radius regardless of angle and accounts for portrait screens', () => {
  const radius = 1.05;
  const slope = Math.tan(16 * Math.PI / 180);
  const wide = constructionViewDistance(radius, slope, 1.7);
  const portrait = constructionViewDistance(radius, slope, .72);
  assert.ok(portrait > wide);
  for (const [distance, aspect] of [[wide, 1.7], [portrait, .72]]) {
    const angle = Math.atan(slope * Math.min(1, aspect));
    assert.ok(distance * Math.sin(angle) + 1e-12 >= radius);
  }
});

test('all layers meet at zero and fully separate at one, with a stagger', () => {
  for (const delay of [0, .08, .17]) {
    assert.equal(layerOffset(0, delay), 0);
    assert.equal(layerOffset(1, delay), 1);
  }
  assert.ok(layerOffset(.5, .17) < layerOffset(.5, .08));
  assert.equal(layerOffset(.1, .17), 0);
});

test('double tap requires spatial and temporal proximity', () => {
  const first = { time: 50, x: 120, y: 120 };
  assert.ok(isDoubleTap(first, { time: 250, x: 134, y: 120 }));
  assert.equal(isDoubleTap(first, { time: 500, x: 134, y: 120 }), false);
  assert.equal(isDoubleTap(first, { time: 250, x: 170, y: 120 }), false);
});
