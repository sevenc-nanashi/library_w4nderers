import p5 from "p5";
import { State } from "../state.ts";
import { drumVisualizer } from "../components/drumVisualizer.ts";
import { dotUnit } from "../const.ts";
import { useGraphicsContext } from "../utils.ts";
import { DrumDefinition, drumDefinition, mainDrum } from "../drum.ts";
import { midi } from "../midi.ts";
import { clip, easeOutQuint } from "../easing.ts";

const chordTrack = midi.tracks.find((track) => track.name === "LABS")!;

let graphics: p5.Graphics;

const screenDotUnit = dotUnit;

const chordThreshold = 53;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!graphics) {
    graphics = p.createGraphics(p.width, p.height);
    graphics.scale(1 / screenDotUnit);
  }
  graphics.clear();
  using _context = useGraphicsContext(graphics);
  graphics.noSmooth();

  const getXY = (measure: number, size: number): [number, number] => {
    return [
      Math.cos(measure * Math.PI * 2 - Math.PI * 0.5) * size,
      Math.sin(measure * Math.PI * 2 - Math.PI * 0.5) * size,
    ];
  };

  graphics.translate(graphics.width / 2, graphics.height * 0.4);
  const size = graphics.height * 0.3;
  graphics.noFill();
  graphics.stroke(255);
  graphics.strokeWeight(dotUnit * 2);
  graphics.circle(0, 0, size * 2);

  graphics.line(0, 0, ...getXY(state.currentMeasure, size));
  for (const [track, definition] of drumDefinition) {
    const drumsInCurrentMeasure = track.notes.filter((v) =>
      [0, -1].includes(
        Math.floor(midi.header.ticksToMeasures(v.ticks)) -
          Math.floor(state.currentMeasure),
      ),
    );
    const midiToName = Object.fromEntries(
      Object.entries(definition).map(([k, v]) => [v, k]),
    );
    const order = ["kick", "snare", "hihat", "clap"];
    for (const drum of drumsInCurrentMeasure.toSorted(
      (a, b) =>
        order.indexOf(midiToName[a.midi]) - order.indexOf(midiToName[b.midi]),
    )) {
      const name = midiToName[drum.midi];
      if (!name) continue;
      const passedMeasures =
        state.currentMeasure - midi.header.ticksToMeasures(drum.ticks);
      const postAnimation = clip(
        state.currentMeasure -
          Math.floor(midi.header.ticksToMeasures(drum.ticks) + 1),
      );
      const existsInNextMeasure = drumsInCurrentMeasure.some(
        (v) =>
          midi.header.ticksToMeasures(v.ticks) ===
            midi.header.ticksToMeasures(drum.ticks) + 1 && v.midi === drum.midi,
      );
      const existsInPrevMeasure = drumsInCurrentMeasure.some(
        (v) =>
          midi.header.ticksToMeasures(v.ticks) ===
            midi.header.ticksToMeasures(drum.ticks) - 1 && v.midi === drum.midi,
      );
      switch (name) {
        case "kick": {
          if (existsInNextMeasure) break;
          const factor =
            (passedMeasures > 0
              ? 1.5 - easeOutQuint(passedMeasures * 4) / 2
              : 0.8) *
            (1 - clip(postAnimation * 4));
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          using _context = useGraphicsContext(graphics);
          graphics.fill(255);
          graphics.stroke(255);
          graphics.strokeWeight(dotUnit);
          graphics.circle(x, y, dotUnit * 8 * factor);
          break;
        }
        case "snare": {
          if (existsInNextMeasure) break;
          const factor =
            passedMeasures > 0
              ? 1.5 - easeOutQuint(passedMeasures * 4) / 2
              : 0.9;
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          using _context = useGraphicsContext(graphics);
          graphics.fill(255);
          graphics.strokeWeight(0);
          graphics.erase(255, 0);
          graphics.circle(
            x,
            y,
            dotUnit * 8 * factor * (1 - clip(postAnimation * 4)),
          );

          graphics.noErase();
          graphics.stroke(255, 255);
          graphics.noFill();
          graphics.strokeWeight(dotUnit * 1.5 * (1 - clip(postAnimation * 4)));
          graphics.circle(x, y, dotUnit * 8 * factor);
          break;
        }
        case "hihat": {
          const factor =
            passedMeasures > 0 ? 1.5 - easeOutQuint(passedMeasures * 4) / 2 : 0;
          using _context = useGraphicsContext(graphics);
          const [ix, iy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size - dotUnit * 8 * factor,
          );
          const [ox, oy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + dotUnit * 8 * factor,
          );
          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(postAnimation * 4)));
          graphics.strokeWeight(dotUnit);
          graphics.line(ix, iy, ox, oy);
          break;
        }
        case "clap": {
          if (passedMeasures <= 0) break;
          const factor = 1.5 - easeOutQuint(passedMeasures * 4) / 2;
          using _context = useGraphicsContext(graphics);
          const [x, y] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + dotUnit * 12 * factor,
          );
          graphics.fill(255);
          graphics.noStroke();
          graphics.circle(
            x,
            y,
            dotUnit * 4 * (1 - easeOutQuint(postAnimation * 2)),
          );
          break;
        }
        case "dial": {
          using _context = useGraphicsContext(graphics);
          for (const [i, o] of [
            [-16, -12],
            [12, 16],
          ]) {
            const [ix, iy] = getXY(
              midi.header.ticksToMeasures(drum.ticks),
              size + dotUnit * i,
            );
            const [ox, oy] = getXY(
              midi.header.ticksToMeasures(drum.ticks),
              size + dotUnit * o,
            );
            graphics.noFill();
            graphics.stroke(255, 255 * (1 - clip(passedMeasures)));
            graphics.strokeWeight(dotUnit * 2);
            graphics.line(ix, iy, ox, oy);
          }

          break;
        }
        case "star": {
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          using _context = useGraphicsContext(graphics);
          graphics.stroke(255, 255 * (1 - clip(passedMeasures)));
          graphics.noFill();
          graphics.strokeWeight(dotUnit * 2);
          graphics.circle(x, y, dotUnit * 16);
          break;
        }
      }
    }
  }

  const currentChordNotes = chordTrack.notes
    .filter(
      (v) =>
        v.midi > chordThreshold &&
        v.ticks <= state.currentTick &&
        v.ticks + v.durationTicks > state.currentTick,
    )
    .toSorted((a, b) => a.midi - b.midi);
  if (currentChordNotes.length > 0) {
    const degree = currentChordNotes
      .map((note) => (note.midi % 12) / 12)
      .filter((v, i, a) => a.indexOf(v) === i);
    const prevNote = chordTrack.notes.findLast(
      (v) => v.ticks + v.durationTicks === currentChordNotes[0].ticks,
    );
    const prevChordNotes = prevNote
      ? chordTrack.notes
          .filter(
            (v) =>
              v.midi > chordThreshold &&
              v.ticks <= prevNote.ticks &&
              v.ticks + v.durationTicks > prevNote.ticks,
          )
          .toSorted((a, b) => a.midi - b.midi)
      : currentChordNotes;
    const prevDegree = prevChordNotes
      .map((note) => (note.midi % 12) / 12)
      .filter((v, i, a) => a.indexOf(v) === i);

    const progress = graphics.map(
      state.currentTick,
      currentChordNotes[0].ticks,
      currentChordNotes[0].ticks +
        Math.min(currentChordNotes[0].durationTicks, midi.header.ppq * 4),
      0,
      1,
    );
    for (let l = 0; l < degree.length; l++) {
      for (let r = l + 1; r < degree.length; r++) {
        const lDegree = lerpWithLoop(
          prevDegree[l],
          degree[l],
          easeOutQuint(progress),
        );
        const rDegree = lerpWithLoop(
          prevDegree[r],
          degree[r],
          easeOutQuint(progress),
        );
        const scale = prevNote ? 1 : easeOutQuint(progress * 2);
        const [lx, ly] = getXY(lDegree, size * scale);
        const [rx, ry] = getXY(rDegree, size * scale);
        const isMainLine = r - l === 1;
        graphics.stroke(255, (isMainLine ? 255 : 160) * scale);
        graphics.strokeWeight(isMainLine ? dotUnit * 1.5 : dotUnit * 0.75);
        graphics.line(lx, ly, rx, ry);
      }
    }
  }

  {
    using _context = useGraphicsContext(p);
    p.noSmooth();
    p.image(
      graphics,
      0,
      0,
      p.width,
      p.height,
      0,
      0,
      graphics.width / screenDotUnit,
      graphics.height / screenDotUnit,
    );
  }
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpWithLoop = (a: number, b: number, t: number) => {
  if (Math.abs(a - b) < 0.5) {
    return lerp(a, b, t);
  }
  if (a < b) {
    return lerp(a, b - 1, t) + 1;
  }
  return lerp(a, b + 1, t) - 1;
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graphics?.remove();
  });
}
