import type { Note } from "@tonejs/midi/dist/Note";
import type p5 from "p5";
import texts from "../assets/texts.txt?raw";
import type { State } from "../state";
import timelineMid, {
  rawMidi as timelineRawMid,
} from "../assets/timeline.mid?mid";
import { dim, toRgb, useRendererContext } from "../utils";
import { dotUnit, mainFont, reiColor, tycColor } from "../const";

const fg = [255, 255, 255] as const;
const textsTrack = timelineMid.tracks.find((track) => track.name === "texts")!;

const baseMidi = 60;
const fontSwitchMidi = 59;

const textSections = texts
  .trim()
  .split("\n====\n")
  .map((section) => section.split("\n---\n"));

const padding = dotUnit * 20;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  const currentNote = textsTrack.notes.find(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi >= baseMidi,
  );
  if (!currentNote) return;

  const index = currentNote.midi - baseMidi;
  if (index === -1) return;

  using _context = useRendererContext(p);

  const section = textSections[index];
  if (!section) throw new Error(`No text for index ${index}`);

  const fontSize = dotUnit * 6;

  const isFontSwitchExists = textsTrack.notes.some(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === fontSwitchMidi,
  );

  p.textSize(fontSize);
  p.textFont(isFontSwitchExists ? "35-55 Font" : mainFont);
  p.fill(...fg);

  p.textAlign(p.LEFT, p.CENTER);
  const textSizeFactor = 0.2;
  p.textLeading(fontSize * (1 + textSizeFactor));
  const leftSection = section[0];

  p.drawingContext.shadowBlur = dotUnit;

  p.drawingContext.shadowColor = toRgb(dim(reiColor, 0.7));
  p.text(leftSection, padding, p.height * 0.4);

  p.textAlign(p.RIGHT, p.CENTER);
  const rightSection = section[1];
  p.drawingContext.shadowColor = toRgb(dim(tycColor, 0.7));
  p.text(rightSection, p.width - padding, p.height * 0.4);
});
