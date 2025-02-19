import type { Note } from "@tonejs/midi/dist/Note";
import type p5 from "p5";
import { dotUnit } from "../const";
import { clip, easeOutQuint } from "../easing";
import { midi } from "../midi";
import timelineMid from "../assets/timeline.mid?mid";
import type { State } from "../state";
import { useRendererContext } from "../utils";

const track = midi.tracks.find((track) => track.name === "Enhance (Vital)")!;
const apTerminateTrack = timelineMid.tracks.find(
  (track) => track.name === "apTerminate",
)!;

const getSections = () => {
  let lastSection: { notes: Note[]; apIndex: number } = {
    notes: [],
    apIndex: -2,
  };
  const sections: { notes: Note[]; apIndex: number }[] = [lastSection];
  for (const note of track.notes) {
    if (lastSection.apIndex === -2) {
      lastSection.apIndex = apTerminateTrack.notes.findLastIndex(
        (apNote) => apNote.ticks <= note.ticks,
      );
    }
    if (
      lastSection.notes.length > 0 &&
      midi.header.ticksToMeasures(note.ticks) -
        midi.header.ticksToMeasures(lastSection.notes[0].ticks) >=
        1
    ) {
      lastSection = {
        notes: [],
        apIndex: -2,
      };
      sections.push(lastSection);
    }

    lastSection.notes.push(note);
  }
  return sections;
};

const sections = getSections();

const width = dotUnit * 64;
const topMidi = 102;
const noteHeight = dotUnit * 2;
const keepDuration = 0.2;
const fadeOutDuration = 0.4;
export const draw = import.meta.hmrify((p: p5, state: State) => {
  const currentApIndex = apTerminateTrack.notes.findLastIndex(
    (apNote) => apNote.ticks <= state.currentTick,
  );
  const currentSection = sections.find(
    (section) =>
      midi.header.ticksToMeasures(state.currentTick) >=
        midi.header.ticksToMeasures(section.notes[0].ticks) &&
      (midi.header.ticksToMeasures(state.currentTick) <
        midi.header.ticksToMeasures(
          section.notes[section.notes.length - 1].ticks +
            section.notes[section.notes.length - 1].durationTicks,
        ) ||
        state.currentTime <
          midi.header.ticksToSeconds(
            section.notes[section.notes.length - 1].ticks +
              section.notes[section.notes.length - 1].durationTicks,
          ) +
            fadeOutDuration) &&
      currentApIndex === section.apIndex,
  );

  if (!currentSection) return;

  const fadeOutProgress = clip(
    (state.currentTime -
      midi.header.ticksToSeconds(
        currentSection.notes[currentSection.notes.length - 1].ticks +
          currentSection.notes[currentSection.notes.length - 1].durationTicks,
      ) -
      keepDuration) /
      (fadeOutDuration - keepDuration),
  );

  using _context = useRendererContext(p);
  p.translate(p.width / 2, p.height * 0.45);

  const leftX = -width / 2;
  const rightX = +width / 2;
  p.fill(255);
  p.noStroke();
  const ticksStart = currentSection.notes[0].ticks;
  const ticksEnd =
    currentSection.notes[currentSection.notes.length - 1].ticks +
    currentSection.notes[currentSection.notes.length - 1].durationTicks;
  for (const note of currentSection.notes) {
    const noteLeftX = p.map(note.ticks, ticksStart, ticksEnd, leftX, rightX);
    const noteRightX = p.map(
      note.ticks + note.durationTicks,
      ticksStart,
      ticksEnd,
      leftX,
      rightX,
    );
    const noteTopY = (topMidi - note.midi) * noteHeight;

    let brightness = 64;
    if (
      note.ticks <= state.currentTick &&
      state.currentTick <= note.ticks + note.durationTicks
    ) {
      brightness = 255;
    } else if (note.ticks < state.currentTick) {
      brightness = 200;
    }

    p.fill(255, brightness * (1 - fadeOutProgress));
    p.rect(
      Math.round(noteLeftX),
      noteTopY + noteHeight * easeOutQuint(fadeOutProgress),
      Math.round(noteRightX) - Math.round(noteLeftX),
      noteHeight,
    );
  }
});
