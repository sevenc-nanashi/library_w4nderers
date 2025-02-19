import p5 from "p5";
import { State } from "../state.ts";
import { drumVisualizer } from "../components/drumVisualizer.ts";
import { dotUnit, mainFont, smallFont } from "../const.ts";
import timeline from "../assets/timeline.mid?mid";
import { useRendererContext } from "../utils.ts";

const visualizerTimeline = timeline.tracks.find(
  (track) => track.name === "visualizer",
)!;

const activateMidi = 60;
const padding = dotUnit * 12;
const cornerSize = dotUnit * 32;
const cornerPadding = dotUnit * 8;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  const activateNote = visualizerTimeline.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === activateMidi,
  );
  if (!activateNote) return;
  using _context = useRendererContext(p);
  p.drawingContext.shadowColor = "#888f";
  p.drawingContext.shadowBlur = dotUnit;
  {
    using _context = useRendererContext(p);
    p.stroke(255);
    p.strokeWeight(dotUnit);
    p.noFill();
    p.line(padding, padding, padding + cornerSize, padding);
    p.line(padding, padding, padding, padding + cornerSize);
    p.line(p.width - padding, padding, p.width - padding - cornerSize, padding);
    p.line(p.width - padding, padding, p.width - padding, padding + cornerSize);
    p.line(
      padding,
      p.height - padding,
      padding + cornerSize,
      p.height - padding,
    );
    p.line(
      padding,
      p.height - padding,
      padding,
      p.height - padding - cornerSize,
    );
    p.line(
      p.width - padding,
      p.height - padding,
      p.width - padding - cornerSize,
      p.height - padding,
    );
    p.line(
      p.width - padding,
      p.height - padding,
      p.width - padding,
      p.height - padding - cornerSize,
    );
  }
  p.textFont(smallFont);
  p.textSize(dotUnit * 6);
  p.fill(255);
  {
    using _context = useRendererContext(p);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text(
      [
        `${Math.floor(state.currentMeasure)}.${
          (Math.floor(state.currentMeasure * 4) % 4) + 1
        }.${Math.floor((state.currentMeasure * 400) % 100)
          .toString()
          .padStart(2, "0")}`,
        `${Math.floor(state.currentTime / 60)}:${String(
          Math.floor(state.currentTime % 60),
        ).padStart(2, "0")}.${String(
          Math.floor((state.currentTime % 1) * 100),
        ).padStart(2, "0")}`,
      ].join(" | "),
      padding + cornerPadding,
      p.height - padding - cornerPadding,
    );
  }
  {
    using _context = useRendererContext(p);
    p.translate(
      p.width - padding - cornerPadding,
      p.height - padding - cornerPadding,
    );
    p.drawingContext.shadowColor = "transparent";
    drumVisualizer(p, state, activateNote);
  }
});
