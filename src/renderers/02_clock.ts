import p5 from "p5";
import { State } from "../state.ts";
import { drumVisualizer } from "../components/drumVisualizer.ts";
import { dotUnit } from "../const.ts";
import { useGraphicsContext } from "../utils.ts";
import { DrumDefinition, drumDefinition, mainDrum } from "../drum.ts";
import { midi } from "../midi.ts";
import { easeOutQuint } from "../easing.ts";

const chordTrack = midi.tracks.find((track) => track.name === "LABS")!;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  using _context = useGraphicsContext(p);
  p.noSmooth();

  const getXY = (measure: number, size: number): [number, number] => {
    return [
      Math.cos(measure * Math.PI * 2 - Math.PI * 0.5) * size,
      Math.sin(measure * Math.PI * 2 - Math.PI * 0.5) * size,
    ];
  };

  p.translate(p.width / 2, p.height / 2);
  const size = p.height * 0.45;
  p.noFill();
  p.stroke(255);
  p.strokeWeight(4);
  p.circle(0, 0, size * 2);

  p.line(0, 0, ...getXY(state.currentMeasure, size));
  for (const [track, definition] of drumDefinition) {
    const drumsInCurrentMeasure = track.notes.filter(
      (v) =>
        Math.floor(midi.header.ticksToMeasures(v.ticks)) ===
        Math.floor(state.currentMeasure),
    );
    const midiToName = Object.fromEntries(
      Object.entries(definition).map(([k, v]) => [v, k]),
    );
    for (const drum of drumsInCurrentMeasure) {
      const name = midiToName[drum.midi] as keyof DrumDefinition;
      if (!name) continue;
      switch (name) {
        case "kick": {
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          p.fill(255);
          p.stroke(255);
          p.strokeWeight(dotUnit);
          p.circle(x, y, dotUnit * 4);
          break;
        }
        case "snare": {
          const [x, y] = getXY(midi.header.ticksToMeasures(drum.ticks), size);
          p.fill(255);
          p.erase(255);
          p.circle(x, y, dotUnit * 4);

          p.noErase();
          p.noFill();
          p.stroke(255);
          p.strokeWeight(dotUnit);
          p.circle(x, y, dotUnit * 4);
          break;
        }
        case "hihat": {
          const [ix, iy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size - dotUnit * 4,
          );
          const [ox, oy] = getXY(
            midi.header.ticksToMeasures(drum.ticks),
            size + dotUnit * 4,
          );
          p.stroke(255);
          p.strokeWeight(dotUnit);
          p.line(ix, iy, ox, oy);
          break;
        }
      }
    }
  }

  const currentChordNotes = chordTrack.notes
    .filter(
      (v) =>
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
    if (prevNote) {
      const prevChordNotes = chordTrack.notes
        .filter(
          (v) =>
            v.ticks <= prevNote.ticks &&
            v.ticks + v.durationTicks > prevNote.ticks,
        )
        .toSorted((a, b) => a.midi - b.midi);
      const prevDegree = prevChordNotes
        .map((note) => (note.midi % 12) / 12)
        .filter((v, i, a) => a.indexOf(v) === i);

      const progress = p.map(
        state.currentTick,
        currentChordNotes[0].ticks,
        currentChordNotes[0].ticks + currentChordNotes[0].durationTicks,
        0,
        1,
      );
      for (let l = 0; l < degree.length; l++) {
        for (let r = l + 1; r < degree.length; r++) {
          const lDegree = p.map(
            easeOutQuint(progress),
            0,
            1,
            prevDegree[l],
            degree[l],
          );
          const rDegree = p.map(
            easeOutQuint(progress),
            0,
            1,
            prevDegree[r],
            degree[r],
          );
          const [lx, ly] = getXY(lDegree, size);
          const [rx, ry] = getXY(rDegree, size);

          p.stroke(255, r - l === 1 ? 255 : 64);
          p.strokeWeight(dotUnit);
          p.line(lx, ly, rx, ry);
        }
      }
    }
  }
});
