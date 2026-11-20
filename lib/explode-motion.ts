const damping = .0046;

export function constructionMotion(from: number, velocity: number, to: number, elapsed: number) {
  const time = Math.max(0, elapsed);
  const displacement = from - to;
  const slope = velocity + damping * displacement;
  const decay = Math.exp(-damping * time);
  const position = to + (displacement + slope * time) * decay;
  const speed = (velocity - damping * slope * time) * decay;
  const settled = Math.abs(to - position) < .0015 && Math.abs(speed) < .00001;
  return { position: settled ? to : Math.max(0, Math.min(1, position)), speed: settled ? 0 : speed, settled };
}

export function motionWindow(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export const constructionTurn = -Math.PI / 12;

const upper = { level: 3, delay: .12, tilt: [-.08, .06, .10] } as const;
const overlays = { level: 2, delay: .09, tilt: [-.12, -.18, -.08] } as const;
const collar = { level: 4, delay: .20, tilt: [-.36, -.25, .31] } as const;
const sole = { level: 0, delay: 0, tilt: [.24, .03, .43] } as const;

const layers = {
  upper, tongue: upper, laces: upper, eye_stays: upper, lace_keeper: upper,
  collar, lining: collar, heel_tab: collar,
  heel: overlays, quarter: overlays, side_trim: overlays, toe_overlay: overlays,
  insole: { level: 1, delay: .05, tilt: [.09, -.06, .30] },
  sole, tread: sole,
} satisfies Record<string, { level: number; delay: number; tilt: readonly [number, number, number] }>;

export function constructionLayer(name: string) {
  if (name.startsWith('L_')) return;
  const key = name.replace(/^R_/, '');
  return Object.hasOwn(layers, key) ? layers[key as keyof typeof layers] : undefined;
}

export function constructionArcDepth(level: number) {
  const radius = .26;
  const angleStep = .41;
  const midpoint = 2;
  return radius * (Math.cos((level - midpoint) * angleStep) - Math.cos((upper.level - midpoint) * angleStep));
}

export function constructionLifts(
  layers: readonly (readonly { min: number; max: number }[])[],
  axisProjections: readonly number[],
  gap: number,
) {
  const lifts: number[] = [];
  for (const [level, layer] of layers.entries()) {
    let lift = level ? lifts[level - 1] + gap : 0;
    for (let lower = 0; lower < level; lower++) {
      const minimum = Math.min(...axisProjections.map((projection, axis) => (
        (layers[lower][axis].max - layer[axis].min + gap) / projection
      )));
      lift = Math.max(lift, lifts[lower] + minimum);
    }
    lifts.push(lift);
  }
  const anchor = lifts[upper.level] ?? 0;
  return lifts.map(lift => lift - anchor);
}

export function layerOffset(progress: number, delay: number) {
  return motionWindow(progress, delay, 1);
}

export function constructionViewDistance(radius: number, verticalSlope: number, aspect: number) {
  const slope = verticalSlope * Math.min(1, aspect);
  return Math.max(1.85, radius * Math.hypot(1, slope) / slope);
}

export function isDoubleTap(
  previous: { time: number; x: number; y: number } | undefined,
  current: { time: number; x: number; y: number },
) {
  return !!previous && current.time >= previous.time && current.time - previous.time <= 330
    && Math.hypot(current.x - previous.x, current.y - previous.y) <= 28;
}
