import p5 from "p5";
import { State } from "../state.ts";
import { colors, dotUnit } from "../const.ts";
import { dim, saturate, useRendererContext } from "../utils.ts";
import { DrumDefinition, drumDefinition, mainDrum } from "../drum.ts";
import { midi } from "../midi.ts";
import { clip, easeInQuint, easeOutQuint } from "../easing.ts";
import timeline from "../assets/timeline.mid?mid";
import { characterMidi, characterTimeline } from "../tracks.ts";
import { Note } from "@tonejs/midi/dist/Note";

const chordTrack = midi.tracks.find((track) => track.name === "LABS")!;
const visualizerTimeline = timeline.tracks.find(
  (track) => track.name === "visualizer",
)!;
const scaleTimeline = timeline.tracks.find((track) => track.name === "scale")!;

let graphics: p5.Graphics;

const screenDotUnit = dotUnit;

const chordThreshold = 53;

const activateMidi = 61;

const noMeasureMidi = 72;
const segmentMidi = 73;
const noSegmentMidi = 74;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!graphics) {
    graphics = p.createGraphics(p.width / dotUnit, p.height / dotUnit);
  }

  const activateNote = visualizerTimeline.notes.find(
    (note) =>
      note.midi === activateMidi &&
      note.ticks <= state.currentTick &&
      note.ticks + note.durationTicks > state.currentTick,
  );
  if (!activateNote) {
    return;
  }

  graphics.clear();
  using _context = useRendererContext(graphics);
  graphics.noSmooth();

  const colorNote = characterTimeline.notes.find(
    (timelineNote) =>
      timelineNote.ticks <= state.currentTick &&
      state.currentTick < timelineNote.ticks + timelineNote.durationTicks &&
      timelineNote.midi >= characterMidi &&
      timelineNote.midi < characterMidi + colors.length,
  );
  const primaryColor: readonly [number, number, number] = colorNote
    ? colors[colorNote.midi - characterMidi]
    : ([255, 255, 255] as const);
  graphics.drawingContext.shadowBlur = 4;
  const dimmed = dim(primaryColor, 0.5);
  graphics.drawingContext.shadowColor = `rgba(${dimmed[0]}, ${dimmed[1]}, ${dimmed[2]}, 64)`;

  const size = graphics.height * 0.3;

  graphics.translate(graphics.width / 2, graphics.height * 0.4);
  drawScale(p, state, size);
  drawChord(p, state, size);
  drawClock(p, state, size, primaryColor, colorNote);
  drawDrum(p, state, size, activateNote);

  {
    using _context = useRendererContext(p);
    p.noSmooth();
    p.image(
      graphics,
      0,
      0,
      p.width,
      p.height,
      0,
      0,
      graphics.width,
      graphics.height,
    );
  }
});

const drawClock = (
  p: p5,
  state: State,
  size: number,
  primaryColor: readonly [number, number, number],
  colorNote: Note | undefined,
) => {
  const color = saturate(
    primaryColor,
    colorNote
      ? easeOutQuint(
          (state.currentMeasure -
            midi.header.ticksToMeasures(colorNote.ticks)) *
            4,
        ) * 0.5
      : 0,
  );

  graphics.noFill();
  graphics.stroke(...color, 255);
  graphics.strokeWeight(2);
  graphics.circle(0, 0, size * 2);

  graphics.line(
    0,
    0,
    ...getXY(
      visualizerTimeline.notes.some(
        (note) =>
          note.midi === noMeasureMidi &&
          note.ticks <= state.currentTick &&
          note.ticks + note.durationTicks > state.currentTick,
      )
        ? 0
        : state.currentMeasure % 1,
      size - 4,
    ),
  );

  const currentSegmentNote = visualizerTimeline.notes.find(
    (note) =>
      note.midi === segmentMidi &&
      note.ticks <= state.currentTick &&
      note.ticks + note.durationTicks > state.currentTick,
  );
  if (currentSegmentNote) {
    graphics.line(
      0,
      0,
      ...getXY(
        p.map(
          state.currentTick,
          currentSegmentNote.ticks,
          currentSegmentNote.ticks + currentSegmentNote.durationTicks,
          0,
          1,
        ),
        size * 0.5,
      ),
    );
  }
  if (
    visualizerTimeline.notes.some(
      (note) =>
        note.midi === noSegmentMidi &&
        note.ticks <= state.currentTick &&
        note.ticks + note.durationTicks > state.currentTick,
    )
  ) {
    graphics.line(0, 0, ...getXY(0, size * 0.5));
  }

  graphics.noStroke();
  graphics.fill(...color, 255);
  graphics.circle(0, 0, 4);
};

const drawDrum = (p: p5, state: State, size: number, activateNote: Note) => {
  for (const [track, definition] of drumDefinition) {
    const drumsInCurrentMeasure = track.notes.filter(
      (v) =>
        v.ticks >= activateNote.ticks &&
        v.ticks < activateNote.ticks + activateNote.durationTicks &&
        [0, -1].includes(
          Math.floor(midi.header.ticksToMeasures(v.ticks)) -
            Math.floor(state.currentMeasure),
        ),
    );
    const midiToName = Object.fromEntries(
      Object.entries(definition).map(([k, v]) => [v, k]),
    );
    const order = [
      "lowTom",
      "highTom",
      "snare",
      "hihat",
      "kick",
      "clap",
      "miniCymbal",
      "cymbal",
      "dial",
      "star",
    ];
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
      const existsInCurrentMeasure = Math.floor(
        midi.header.ticksToMeasures(drum.ticks),
      ) === Math.floor(state.currentMeasure);
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
          using _context = useRendererContext(graphics);
          graphics.fill(255);
          graphics.noStroke();
          graphics.circle(x, y, 8 * factor);
          break;
        }
        case "snare": {
          if (existsInNextMeasure) break;
          const factor =
            passedMeasures > 0
              ? 1.5 - easeOutQuint(passedMeasures * 4) / 2
              : 0.9;
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          using _context = useRendererContext(graphics);
          graphics.fill(255);
          graphics.strokeWeight(0);
          graphics.erase(255 * (1 - clip(postAnimation * 4)), 0);
          graphics.circle(x, y, 8 * factor);

          graphics.noErase();
          graphics.stroke(255, 255);
          graphics.noFill();
          graphics.strokeWeight(1.5 * (1 - clip(postAnimation * 4)));
          graphics.circle(x, y, 8 * factor);
          break;
        }
        case "hihat": {
          const factor =
            passedMeasures > 0 ? 1.5 - easeOutQuint(passedMeasures * 4) / 2 : 0;
          using _context = useRendererContext(graphics);
          const [ix, iy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size - 8 * factor,
          );
          const [ox, oy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + 8 * factor,
          );
          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(postAnimation * 4)));
          graphics.strokeWeight(1);
          graphics.line(ix, iy, ox, oy);
          break;
        }
        case "openHihat": {
          const factor =
            passedMeasures > 0 ? 1.5 - easeOutQuint(passedMeasures * 4) / 2 : 0;
          using _context = useRendererContext(graphics);
          const distance = (8 * factor) / Math.sqrt(2);
          const [ix, iy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size - distance,
          );
          const [ox, oy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + distance,
          );
          const [sx, sy] = getXY(
            midi.header.ticksToMeasures(drum.ticks) + 0.25,
            distance,
          );
          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(postAnimation * 4)));
          graphics.strokeWeight(1);
          graphics.line(ix + sx, iy + sy, ox - sx, oy - sy);
          graphics.line(ix - sx, iy - sy, ox + sx, oy + sy);

          break;
        }
        case "clap": {
          if (passedMeasures <= 0) break;
          const factor = 1.5 - easeOutQuint(passedMeasures * 4) / 2;
          using _context = useRendererContext(graphics);
          const [x, y] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + 12 * factor,
          );
          graphics.fill(255);
          graphics.noStroke();
          graphics.circle(x, y, 4 * (1 - easeOutQuint(postAnimation * 2)));
          break;
        }
        case "highTom": {
          if (!existsInCurrentMeasure) break;
          const factor =
            passedMeasures > 0 ? 1.5 - easeOutQuint(passedMeasures * 4) / 2 : 1;
          const angle = midi.header.ticksToMeasures(drum.ticks);
          const [x, y] = getXY(angle, size + 0.5);
          using _context = useRendererContext(graphics);
          graphics.fill(255);
          graphics.noStroke();
          graphics.arc(
            x,
            y,
            4 * factor,
            4 * factor,
            (angle + 0.45) * Math.PI * 2,
            (angle + 1.05) * Math.PI * 2,
          );
          break;
        }
        case "lowTom": {
          if (!existsInCurrentMeasure) break;
          const factor =
            passedMeasures > 0 ? 1.5 - easeOutQuint(passedMeasures * 4) / 2 : 1;
          const angle = midi.header.ticksToMeasures(drum.ticks);
          const [x, y] = getXY(angle, size - 0.5);
          using _context = useRendererContext(graphics);
          graphics.fill(255);
          graphics.noStroke();
          graphics.arc(
            x,
            y,
            4 * factor,
            4 * factor,
            (angle - 0.05) * Math.PI * 2,
            (angle + 0.55) * Math.PI * 2,
          );
          break;
        }
        case "dial": {
          using _context = useRendererContext(graphics);

          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(passedMeasures)));
          graphics.strokeWeight(2);
          for (const [i, o] of [
            [-16, -12],
            [12, 16],
          ]) {
            const [ix, iy] = getXY(
              midi.header.ticksToMeasures(drum.ticks),
              size + i,
            );
            const [ox, oy] = getXY(
              midi.header.ticksToMeasures(drum.ticks),
              size + o,
            );
            graphics.line(ix, iy, ox, oy);
          }
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          graphics.circle(x, y, p.lerp(16, 20, easeOutQuint(passedMeasures)));

          break;
        }
        case "star": {
          using _context = useRendererContext(graphics);
          const starSize = size * 2 - 20;
          const divs = 16;
          graphics.drawingContext.shadowColor = "transparent";
          graphics.strokeWeight(2);
          graphics.noFill();
          const shift = Math.floor(passedMeasures * 64) / 2;
          graphics.stroke(255, 255 * (1 - easeInQuint(passedMeasures / 2)));
          graphics.strokeCap(p.SQUARE);
          for (let i = 0; i < divs; i++) {
            graphics.arc(
              0,
              0,
              starSize,
              starSize,
              Math.PI * 2 * ((i + shift) / divs),
              Math.PI * 2 * ((i + shift + 0.5) / divs),
            );
          }
          graphics.stroke(255, 255 * (1 - clip(passedMeasures)));
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          graphics.circle(x, y, p.lerp(12, 20, easeOutQuint(passedMeasures)));
          break;
        }
        case "cymbal": {
          if (drum.ticks > state.currentTick) break;
          using _context = useRendererContext(graphics);
          graphics.drawingContext.shadowColor = "transparent";
          graphics.strokeWeight(2 * (1 - clip(passedMeasures)));
          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(passedMeasures * 2)));
          graphics.circle(
            0,
            0,
            p.lerp(size * 2, size * 2 + 32, easeOutQuint(passedMeasures)),
          );
          break;
        }
        case "miniCymbal": {
          if (drum.ticks > state.currentTick) break;
          using _context = useRendererContext(graphics);
          graphics.drawingContext.shadowColor = "transparent";
          graphics.strokeWeight(2 * (1 - clip(passedMeasures)));
          graphics.noFill();
          graphics.stroke(255, 255 * (1 - clip(passedMeasures * 2)));
          graphics.circle(
            0,
            0,
            p.lerp(size * 2, size * 2 - 32, easeOutQuint(passedMeasures)),
          );
        }
      }
    }
  }
};

const drawChord = (p: p5, state: State, size: number) => {
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
        using _context = useRendererContext(graphics);
        if (!isMainLine) {
          graphics.drawingContext.shadowColor = "transparent";
        }

        graphics.stroke(255, (isMainLine ? 255 : 160) * scale);
        graphics.strokeWeight(isMainLine ? 1.5 : 0.75);
        graphics.line(lx, ly, rx, ry);
      }
    }
  }
};

const drawScale = (p: p5, state: State, size: number) => {
  const scaleRadius = size * 0.5;
  const scaleNotes = scaleTimeline.notes
    .filter(
      (note) =>
        note.ticks <= state.currentTick &&
        state.currentTick < note.ticks + note.durationTicks,
    )
    .toSorted((a, b) => a.midi - b.midi);
  const pad = 0.005;
  const shift = (1 / 12) * 0.5 + 0.25;
  for (const [i, scaleNote] of scaleNotes.entries()) {
    const degree = (scaleNote.midi % 12) / 12;
    graphics.stroke(255, i === 0 ? 255 : 160);
    graphics.strokeWeight(2);
    graphics.strokeCap(p.SQUARE);
    graphics.noFill();
    graphics.arc(
      0,
      0,
      scaleRadius,
      scaleRadius,
      (degree + pad - shift) * Math.PI * 2,
      (degree + 1 / 12 - pad - shift) * Math.PI * 2,
    );
  }
};

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
const getXY = (measure: number, size: number): [number, number] => {
  return [
    Math.cos(measure * Math.PI * 2 - Math.PI * 0.5) * size,
    Math.sin(measure * Math.PI * 2 - Math.PI * 0.5) * size,
  ];
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graphics?.remove();
  });
}
