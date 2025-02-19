export const useRendererContext = (p: {
  push: () => void;
  pop: () => void;
}) => {
  p.push();
  return {
    [Symbol.dispose]() {
      p.pop();
    },
  };
};

export const saturate = (
  rgb: readonly [number, number, number],
  amount: number,
): [number, number, number] => {
  const [r, g, b] = rgb;
  const avg = Math.max(r, g, b);
  return [
    avg + amount * (r - avg),
    avg + amount * (g - avg),
    avg + amount * (b - avg),
  ];
};

export const dim = (rgb: readonly [number, number, number], factor: number) =>
  rgb.map((v) => v * factor) as [number, number, number];

export const toRgb = (
  rgb: readonly [number, number, number],
  alpha?: number,
) =>
  alpha === undefined
    ? `rgb(${rgb.join(", ")})`
    : `rgba(${rgb.join(", ")}, ${alpha})`;
