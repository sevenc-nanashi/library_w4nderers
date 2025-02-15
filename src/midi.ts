import { Midi } from "@tonejs/midi";
import data from "./assets/main.mid?uint8array";
import { MidiData } from "midi-file";
import { Note } from "@tonejs/midi/dist/Note";

export const midi = new Midi(data);
midi.tracks = midi.tracks.filter((track) => !track.name.startsWith("#"));

export const loadTimelineWithText = (
  trackName: string,
  timelineMid: Midi,
  timelineRawMid: MidiData,
  options?: Partial<{
    midis: number[];
  }>,
) => {
  const midis = options?.midis;
  const tonejsMidiTrack = timelineMid.tracks.find(
    (track) => track.name === trackName,
  )!;
  const rawTrack = timelineRawMid.tracks.find((track) =>
    track.some((note) => note.type === "trackName" && note.text === trackName),
  )!;

  const textEvents = rawTrack.reduce(
    (acc, note) => {
      acc.time += note.deltaTime;
      if (note.type !== "text") {
        return acc;
      }
      const textBytes = note.text.split("").map((char) => char.charCodeAt(0));
      const text = new TextDecoder()
        .decode(new Uint8Array(textBytes))
        .replaceAll("/", "\n");
      const midiNote = tonejsMidiTrack.notes.find(
        (note) =>
          note.ticks + 1 >= acc.time && (!midis || midis.includes(note.midi)),
      );
      if (!midiNote) {
        throw new Error(`No note found at ${acc.time}, ${text}`);
      }
      acc.texts.push({ text, time: acc.time, note: midiNote });
      return acc;
    },
    { texts: [] as { text: string; time: number; note: Note }[], time: 0 },
  );

  return { texts: textEvents.texts, track: tonejsMidiTrack };
};
