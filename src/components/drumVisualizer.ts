import type { Track } from "@tonejs/midi";
import type { Note } from "@tonejs/midi/dist/Note";
import type p5 from "p5";
import { colors, dotUnit, frameRate, reiColor, tycColor } from "../const.ts";
import { easeInQuint, easeOutQuint } from "../easing";
import midi from "../assets/main.mid?mid";
import type { State } from "../state";
import { cymbal, drumDefinition } from "../drum.ts";
import timeline from "../assets/timeline.mid?mid";
import { saturate } from "../utils.ts";
import { characterMidi, characterTimeline } from "../tracks.ts";

const mainDrum = midi.tracks.find((track) => track.name === "Sitala")!;
const subDrum = midi.tracks.find((track) => track.name === "RVK-808")!;
const visualizerTimeline = timeline.tracks.find(
  (track) => track.name === "visualizer",
)!;

const cymbalWidth = dotUnit * 6;
const cymbalPadding = dotUnit * 1;
const cymbalWidthPadded = cymbalWidth + cymbalPadding;
const cymbalSeparatorWidth = dotUnit * 1;
const cellWidth = dotUnit * 12;
const cellHeight = cellWidth;
const cellPadding = dotUnit * 3;
const cellSectionSize = cellWidth * 8 + cellPadding * 7 + dotUnit * 2;

export const drumVisualizerWidth =
  cymbalWidthPadded * 2 + cellSectionSize + cymbalSeparatorWidth * 2;
export const drumVisualizerHeight = cellHeight + dotUnit * 2;
export const drumVisualizer = (
  graphics: p5,
  state: State,
  activateNote: Note,
) => {
  graphics.noStroke();

  const currentTimeSignature = midi.header.timeSignatures.findLast(
    (v) => v.ticks <= state.currentTick,
  )!;
  const beats =
    (currentTimeSignature.timeSignature[0] /
      currentTimeSignature.timeSignature[1]) *
    8;
  for (let i = 0; i <= 8; i++) {
    graphics.fill(255, i % beats === 0 ? 255 : i > beats ? 64 : 128);
    let heightLevel = 0.5;
    if (i % 2 === 1) {
      heightLevel *= 0.5;
    }
    if (i % beats === 0) {
      heightLevel = 1;
    } else if (i > beats) {
      heightLevel *= 0.75;
    }
    const height = drumVisualizerHeight * heightLevel;

    graphics.rect(
      -cymbalWidthPadded -
        cymbalSeparatorWidth -
        i * cellWidth -
        i * cellPadding,
      -height,
      dotUnit,
      height,
    );
  }

  const currentTick = state.currentTick;

  const lastCymbal = [
    subDrum.notes.findLast(
      (note) =>
        note.ticks >= activateNote.ticks &&
        note.ticks <= currentTick &&
        note.midi === 50,
    ),
    cymbal.notes.findLast(
      (note) => note.ticks >= activateNote.ticks && note.ticks <= currentTick,
    ),
  ]
    .filter((note) => note !== undefined)
    .toSorted((a, b) => a!.ticks - b!.ticks)
    .at(-1)!;
  if (lastCymbal) {
    const cymbalTime = midi.header.ticksToSeconds(lastCymbal.ticks);
    const currentTime = state.currentFrame / frameRate;
    graphics.fill(
      255,
      Math.max(0, 255 - (255 * (currentTime - cymbalTime)) / 1),
    );
    const widthFactor = lastCymbal.midi === 49 ? 1 : 0.5;
    graphics.rect(
      -drumVisualizerWidth + cymbalWidth * (1 - widthFactor),
      -drumVisualizerHeight,
      cymbalWidth * widthFactor,
      drumVisualizerHeight,
    );
    graphics.rect(
      -cymbalWidth,
      -drumVisualizerHeight,
      cymbalWidth * widthFactor,
      drumVisualizerHeight,
    );
  }

  let shootingStar: Note | undefined;
  const kicks: Note[] = [];
  const snares: Note[] = [];
  const hihats: Note[] = [];
  const openHihats: Note[] = [];
  const claps: Note[] = [];

  const currentMeasure = state.currentMeasure;
  const startMeasure = Math.max(0, Math.floor(currentMeasure) - 2);
  const endMeasure = Math.floor(currentMeasure) + 1;
  for (const [track, definition] of drumDefinition) {
    for (const note of track.notes) {
      const measure = midi.header.ticksToMeasures(note.ticks);
      if (
        measure >= startMeasure &&
        measure < endMeasure &&
        note.ticks >= activateNote.ticks
      ) {
        if (note.midi === definition.kick) {
          kicks.push(note);
        } else if (note.midi === definition.snare) {
          snares.push(note);
        } else if (note.midi === definition.hihat) {
          hihats.push(note);
        } else if (note.midi === definition.openHihat) {
          openHihats.push(note);
        } else if (note.midi === definition.clap) {
          claps.push(note);
        } else if (note.midi === definition.star) {
          shootingStar = note;
        }
      }
    }
  }
  const drums = [
    shootingStar && ([shootingStar, "star"] as const),
    ...claps.map((note) => [note, "clap"] as const),
    ...kicks.map((note) => [note, "kick"] as const),
    ...snares.map((note) => [note, "snare"] as const),
    ...hihats.map((note) => [note, "hihat"] as const),
    ...openHihats.map((note) => [note, "openHihat"] as const),
  ]
    .filter((drum) => drum !== undefined)
    .toSorted((a, b) => a[0].ticks - b[0].ticks);

  for (const [note, noteType] of drums) {
    if (note.ticks > currentTick) {
      continue;
    }

    const noteTimeSignature = midi.header.timeSignatures.findLast(
      (v) => v.ticks <= note.ticks,
    )!;
    const beats =
      (noteTimeSignature.timeSignature[0] /
        noteTimeSignature.timeSignature[1]) *
      8;
    const measure = midi.header.ticksToMeasures(note.ticks);
    const measureDivision =
      Math.floor((measure % 1) * beats + 0.00001) + (8 - beats);
    let sixteenthType: "none" | "left" | "right" = "none";
    if (Math.floor((measure % 1) * beats * 2 + 0.00001) % 2 === 1) {
      sixteenthType = "right";
    } else if (
      drums.some(
        ([drum]) =>
          drum.ticks > note.ticks &&
          drum.ticks <= note.ticks + midi.header.ppq / 4,
      )
    ) {
      sixteenthType = "left";
    }
    const x =
      -cymbalWidthPadded -
      cymbalSeparatorWidth -
      cellSectionSize +
      measureDivision * cellWidth +
      measureDivision * cellPadding +
      dotUnit;
    let y = -cellHeight;
    let alpha = 255;
    if (measure < Math.floor(currentMeasure)) {
      const progress = Math.min((currentMeasure % 1) / 0.5, 1);
      const eased = easeOutQuint(progress);
      // y +=
      //   shiftHeight * eased +
      //   shiftHeight * (Math.floor(currentMeasure) - Math.floor(measure) - 1);
      alpha =
        currentMeasure - measure <= 1
          ? 96 * (1 - eased) + 64
          : (measure - currentMeasure - 1) * 64;
    }
    const progress = Math.min((currentMeasure - measure) * 16, 1);
    let saturation = 0.5 - (alpha / 255) * 0.5;
    if (sixteenthType !== "none") {
      saturation += 0.5;
      saturation = Math.min(saturation, 1);
    }
    const color = characterTimeline.notes.find(
      (timelineNote) =>
        timelineNote.ticks <= note.ticks &&
        note.ticks < timelineNote.ticks + timelineNote.durationTicks &&
        timelineNote.midi >= characterMidi &&
        timelineNote.midi < characterMidi + colors.length,
    )?.midi;
    const primaryColor = colors[color ? color - characterMidi : 0];
    const borderColor = [
      ...saturate(primaryColor, saturation),
      alpha * progress,
    ] as [number, number, number, number];
    const mainColor = [
      ...saturate(primaryColor, saturation * 0.7 + 0.3),
      alpha * progress,
    ] as [number, number, number, number];
    graphics.fill(...mainColor);
    if (noteType === "star") {
      const height = cellHeight - dotUnit * 7;
      graphics.rect(
        x + dotUnit * 5,
        y + dotUnit * 2 + height * (1 - progress),
        cellWidth - dotUnit * 10,
        height * progress,
      );
      graphics.rect(
        x + dotUnit * 5,
        y + cellHeight - dotUnit * 4,
        cellWidth - dotUnit * 10,
        dotUnit * 2,
      );
      continue;
    }
    switch (noteType) {
      case "kick": {
        if (snares.some((snare) => snare.ticks === note.ticks)) {
          continue;
        }
        if (claps.some((clap) => clap.ticks === note.ticks)) {
          continue;
        }
        const height = cellHeight - dotUnit * 4;

        if (shootingStar?.ticks === note.ticks) {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2 + height * (1 - progress),
            dotUnit * 2,
            height * progress,
          );
          graphics.rect(
            x + cellWidth - dotUnit * 4,
            y + dotUnit * 2 + height * (1 - progress),
            dotUnit * 2,
            height * progress,
          );
        } else {
          if (sixteenthType === "none" || sixteenthType === "left") {
            graphics.rect(
              x + dotUnit * 2,
              y + dotUnit * 2 + height * (1 - progress),
              (cellWidth - dotUnit * 4) / 2,
              height * progress,
            );
          }
          if (sixteenthType === "none" || sixteenthType === "right") {
            graphics.rect(
              x + cellWidth / 2,
              y + dotUnit * 2 + height * (1 - progress),
              (cellWidth - dotUnit * 4) / 2,
              height * progress,
            );
          }
        }
        break;
      }
      case "snare": {
        if (shootingStar?.ticks === note.ticks) {
          continue;
        }
        const width = cellWidth - dotUnit * 4;
        if (kicks.some((kick) => kick.ticks === note.ticks)) {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + (width / 2) * (1 - progress),
            y + dotUnit * 2 + (cellHeight - dotUnit * 6) / 3 + dotUnit,
            (width / 2) * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + width / 2,
            y + dotUnit * 2 + (cellHeight - dotUnit * 6) / 3 + dotUnit,
            (width / 2) * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + width * (1 - progress),
            y +
              dotUnit * 2 +
              (cellHeight - dotUnit * 6) * (2 / 3) +
              dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
        } else {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 5) / 2,
          );
          graphics.rect(
            x + dotUnit * 2 + width * (1 - progress),
            y + dotUnit * 2 + (cellHeight - dotUnit * 5) / 2 + dotUnit,
            width * progress,
            (cellHeight - dotUnit * 5) / 2,
          );
        }
        break;
      }
      case "clap": {
        const height = cellHeight - dotUnit * 4;
        graphics.rect(
          x + dotUnit * 2,
          y + dotUnit * 2,
          (cellWidth - dotUnit * 5) / 2,
          height * progress,
        );
        graphics.rect(
          x + dotUnit * 2 + (cellWidth - dotUnit * 5) / 2 + dotUnit,
          y + dotUnit * 2 + height * (1 - progress),
          (cellWidth - dotUnit * 5) / 2,
          height * progress,
        );
        break;
      }
      case "hihat": {
        if (openHihats.some((openHihat) => openHihat.ticks === note.ticks)) {
          continue;
        }
        graphics.fill(...borderColor);
        if (sixteenthType === "none" || sixteenthType === "left") {
          graphics.rect(x, y, cellWidth / 2, dotUnit);
          graphics.rect(x, y + cellHeight - dotUnit, cellWidth / 2, dotUnit);
          graphics.rect(x, y, dotUnit, cellHeight);
        }
        if (sixteenthType === "none" || sixteenthType === "right") {
          graphics.rect(x + cellWidth / 2, y, cellWidth / 2, dotUnit);
          graphics.rect(
            x + cellWidth / 2,
            y + cellHeight - dotUnit,
            cellWidth / 2,
            dotUnit,
          );
          graphics.rect(x + cellWidth - dotUnit, y, dotUnit, cellHeight);
        }
        break;
      }
      case "openHihat": {
        graphics.fill(...borderColor);
        const partWidth = (cellWidth - dotUnit) / 2;
        const partHeight = (cellHeight - dotUnit) / 2;
        if (sixteenthType === "none" || sixteenthType === "left") {
          graphics.rect(x, y, partWidth * progress, dotUnit);
          graphics.rect(x, y, dotUnit, partHeight * progress);
          graphics.rect(
            x,
            y + cellHeight - partHeight * progress,
            dotUnit,
            partHeight * progress,
          );
          graphics.rect(
            x,
            y + cellHeight - dotUnit,
            partWidth * progress,
            dotUnit,
          );
        }
        if (sixteenthType === "none" || sixteenthType === "right") {
          graphics.rect(
            x + cellWidth - partWidth * progress,
            y,
            partWidth * progress,
            dotUnit,
          );
          graphics.rect(
            x + cellWidth - dotUnit,
            y,
            dotUnit,
            partHeight * progress,
          );
          graphics.rect(
            x + cellWidth - partWidth,
            y + cellHeight - dotUnit,
            partWidth * progress,
            dotUnit,
          );
          graphics.rect(
            x + cellWidth - dotUnit,
            y + cellHeight - partHeight,
            dotUnit,
            partHeight * progress,
          );
        }

        break;
      }
    }
  }
};
