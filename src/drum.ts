import { Track } from "@tonejs/midi";
import { midi } from "./midi.ts";

export const mainDrum = midi.tracks.find((track) => track.name === "Sitala")!;
export const subDrum = midi.tracks.find((track) => track.name === "RVK-808")!;

export type DrumDefinition = {
  kick: number;
  snare: number;
  hihat: number;
  openHihat: number;
  clap: number;
  star: number;
};
export const drumDefinition = [
  [
    mainDrum,
    {
      kick: 36,
      snare: 37,
      hihat: 38,
      openHihat: 41,
      clap: 40,
    },
  ],
] as [midi: Track, definition: Partial<DrumDefinition>][];
