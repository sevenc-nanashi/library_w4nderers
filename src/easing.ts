export const easeOutQuint = (t: number) => {
  const t1 = clip(t) - 1;
  return 1 + t1 * t1 * t1 * t1 * t1;
};
export const easeInQuint = (t: number) => {
  return Math.pow(clip(t), 5);
};
export const easeOutInQuint = (t: number) => {
  if (t < 0.5) {
    return easeOutQuint(t * 2) / 2;
  }
  return 0.5 + easeInQuint((t - 0.5) * 2) / 2;
};

export const clip = (t: number) => {
  return Math.max(0, Math.min(1, t));
};

export const unlerp = (a: number, b: number, x: number) => {
  return (x - a) / (b - a);
};
