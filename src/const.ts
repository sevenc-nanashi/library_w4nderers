import { midi } from "./midi";

export const width = 1920;
export const height = 1080;

export const bg = [0, 0, 0];
export const fg = [0x43, 0xb0, 0xd5];
export const fill = [0x43, 0xb0, 0xd5];

export const frameRate = 60;

export const dotUnit = 4;

export const smallFont = "35-55 Font";

export const songLength = midi.header.ticksToSeconds(
  Math.max(
    ...midi.tracks.flatMap((track) =>
      track.notes.map((note) => note.ticks + note.durationTicks),
    ),
  ),
);
