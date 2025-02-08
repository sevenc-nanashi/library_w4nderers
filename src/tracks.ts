import timeline from "./assets/timeline.mid?mid";

export const characterTimeline = timeline.tracks.find(
  (track) => track.name === "character",
)!;

export const characterMidi = 60;
