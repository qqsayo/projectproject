const startYaw = 1.18;
const stops = [0, .18, .29, .56, .82, 1];
const poses = [
  [0, .12, 1, 0, 0],
  [.44, .25, 1.04, .10, -.06],
  [1.12, .36, 1.22, .09, -.09],
  [3.4, .08, 1.06, .03, .04],
  [5.44, .45, 1.16, .03, -.035],
  [2 * Math.PI, .12, .68, -.18, 0],
];

export function heroPose(value: number, reducedMotion = false) {
  const progress = reducedMotion ? 0 : Math.max(0, Math.min(1, value));
  const next = stops.findIndex(stop => stop >= progress);
  const index = Math.max(0, next - 1);
  const ratio = (progress - stops[index]) / (stops[index + 1] - stops[index]);
  const ease = ratio * ratio * (3 - 2 * ratio);
  const [yaw, pitch, zoom, y, roll] = poses[index].map((from, i) => from + (poses[index + 1][i] - from) * ease);
  const chapter = progress < .22 || progress > .92 ? 0 : progress < .43 ? 1 : progress < .67 ? 2 : 3;
  return { progress, yaw: startYaw + yaw, pitch, zoom, y, roll, chapter };
}


