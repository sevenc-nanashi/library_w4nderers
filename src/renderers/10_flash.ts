import p5 from "p5";
import { State } from "../state.ts";
import timeline from "../assets/timeline.mid?mid";

const flashTimeline = timeline.tracks.find((track) => track.name === "flash")!;
const flashMidi = 48;
const fadeMidi = 60;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  const flashNote = flashTimeline.notes.findLast(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi >= flashMidi &&
      note.midi < flashMidi + 12,
  );
  if (flashNote) {
    p.background(
      255,
      p.map(
        state.currentTick,
        flashNote.ticks,
        flashNote.ticks + flashNote.durationTicks,
        255 * flashNote.velocity,
        0,
      ),
    );
  }

  const fadeNote = flashTimeline.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === fadeMidi,
  );
  if (fadeNote) {
    p.background(
      255,
      p.map(
        state.currentTick,
        fadeNote.ticks,
        fadeNote.ticks + fadeNote.durationTicks,
        0,
        255 * fadeNote.velocity,
      ),
    );
  }
});
