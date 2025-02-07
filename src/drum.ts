import { Track } from "@tonejs/midi";
import { midi } from "./midi.ts";

export const mainDrum = midi.tracks.find((track) => track.name === "Sitala")!;
export const subDrum = midi.tracks.find((track) => track.name === "RVK-808")!;
export const star = midi.tracks.find((track) => track.name === "Shooting Star")!;
export const dial = midi.tracks.find(
  (track) => track.name === "Fade Dial (Vital)",
)!;

export type DrumDefinition = {
  kick: number;
  snare: number;
  hihat: number;
  openHihat: number;
  clap: number;
  star: number;
  dial: number;
};
export const drumDefinition = [
  [
    mainDrum,
    {
      kick: 36,
      snare: 37,
      hihat: 38,
      openHihat: 41,
    },
  ],
  [
    subDrum,
    {
      clap: 39,
    },
  ],
  [
    dial,
    {
      dial: 76,
    },
  ],
  [
    star,
    {
      star: 52,
    },
  ],
] as [midi: Track, definition: Partial<DrumDefinition>][];
