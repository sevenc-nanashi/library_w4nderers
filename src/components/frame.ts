import type p5 from "p5";

export const drawFrame = (
  p: p5 | p5.Graphics,
  progress: number,
  x: number,
  y: number,
  size: number,
  weight: number,
) => {
  p.beginShape();
  const vertices: [number, number][] = [];
  const backVertices: [number, number][] = [];
  const absProgress = Math.abs(progress);
  (() => {
    if (progress > 0) {
      vertices.push([x, y]);
      backVertices.push([x, y - weight]);
      if (absProgress <= 1 / 8) {
        vertices.push([x + p.lerp(0, size / 2, absProgress / (1 / 8)), y]);
        backVertices.push([
          x + p.lerp(0, size / 2 + weight, absProgress / (1 / 8)),
          y - weight,
        ]);
        return;
      }
      vertices.push([x + size / 2, y]);
      backVertices.push([x + size / 2 + weight, y - weight]);
      if (absProgress <= 3 / 8) {
        vertices.push([
          x + size / 2,
          y + p.lerp(0, size, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x + size / 2 + weight,
          y +
            p.lerp(-weight, size + weight * 2, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        return;
      }

      vertices.push([x + size / 2, y + size]);
      backVertices.push([x + size / 2 + weight, y + size + weight]);

      if (absProgress <= 5 / 8) {
        vertices.push([
          x + p.lerp(size / 2, -size / 2, (absProgress - 3 / 8) / (2 / 8)),
          y + size,
        ]);
        backVertices.push([
          x +
            p.lerp(
              size / 2 + weight,
              -size / 2 - weight,
              (absProgress - 3 / 8) / (2 / 8),
            ),
          y + size + weight,
        ]);
        return;
      }
      vertices.push([x - size / 2, y + size]);
      backVertices.push([x - size / 2 - weight, y + size + weight]);

      if (absProgress <= 7 / 8) {
        vertices.push([
          x - size / 2,
          y + p.lerp(size, 0, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x - size / 2 - weight,
          y + p.lerp(size + weight, -weight, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        return;
      }

      vertices.push([x - size / 2, y]);
      backVertices.push([x - size / 2 - weight, y - weight]);

      vertices.push([
        x + p.lerp(-size / 2, 0, (absProgress - 7 / 8) / (1 / 8)),
        y,
      ]);
      backVertices.push([
        x + p.lerp(-size / 2 - weight, 0, (absProgress - 7 / 8) / (1 / 8)),
        y - weight,
      ]);
    } else {
      vertices.push([x, y]);
      backVertices.push([x, y - weight]);
      if (absProgress >= 7 / 8) {
        vertices.push([
          x - p.lerp(size / 2, 0, (absProgress - 7 / 8) / (1 / 8)),
          y,
        ]);
        backVertices.push([
          x - p.lerp(size / 2 + weight, 0, (absProgress - 7 / 8) / (1 / 8)),
          y - weight,
        ]);
        return;
      }
      vertices.push([x - size / 2, y]);
      backVertices.push([x - size / 2 - weight, y - weight]);
      if (absProgress >= 5 / 8) {
        vertices.push([
          x - size / 2,
          y + p.lerp(size, 0, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x - size / 2 - weight,
          y + p.lerp(size + weight, -weight, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        return;
      }
      vertices.push([x - size / 2, y + size]);
      backVertices.push([x - size / 2 - weight, y + size + weight]);
      if (absProgress >= 3 / 8) {
        vertices.push([
          x + p.lerp(size / 2, -size / 2, (absProgress - 3 / 8) / (2 / 8)),
          y + size,
        ]);
        backVertices.push([
          x +
            p.lerp(
              size / 2 + weight,
              -size / 2 - weight,
              (absProgress - 3 / 8) / (2 / 8),
            ),
          y + size + weight,
        ]);
        return;
      }
      vertices.push([x + size / 2, y + size]);
      backVertices.push([x + size / 2 + weight, y + size + weight]);
      if (absProgress >= 1 / 8) {
        vertices.push([
          x + size / 2,
          y + p.lerp(0, size, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x + size / 2 + weight,
          y + p.lerp(-weight, size + weight, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        return;
      }
      vertices.push([x + size / 2, y]);
      backVertices.push([x + size / 2 + weight, y - weight]);
      vertices.push([x + p.lerp(0, size / 2, absProgress / (1 / 8)), y]);
      backVertices.push([
        x + p.lerp(0, size / 2 + weight, absProgress / (1 / 8)),
        y - weight,
      ]);
    }
  })();
  for (const [vx, vy] of vertices) {
    p.vertex(vx, vy);
  }
  for (const [vx, vy] of backVertices.toReversed()) {
    p.vertex(vx, vy);
  }

  p.endShape(p.CLOSE);
};
