import type p5 from "p5";
import chords from "../assets/chord.png";
import { dotUnit, height } from "../const";
import { easeOutQuint } from "../easing";
import timelineMid from "../assets/timeline.mid?mid";
import type { State } from "../state";
import { useRendererContext } from "../utils";

const baseMidi = 60;

const chordTrack = timelineMid.tracks.find((track) => track.name === "chord")!;

let chordImage: p5.Image;

export const preload = import.meta.hmrify((p: p5) => {
  chordImage = p.loadImage(chords);
});

const destWidth = 682;
const partWidth = 236;
const leftPadding = 86;
const imageLeftPadding = 44;
const imageTopPadding = 80;
const imagePartWidth = 124;
const rowHeight = 160;
const lineHeight = 80;

const animationWidth = 4;
const animationDuration = 0.5;

const padding = dotUnit * 20;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!chordImage) {
    preload(p);
    return;
  }
  using _context = useRendererContext(p);
  const activeChord = chordTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (!activeChord) return;

  const inactiveOverride = chordTrack.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === baseMidi - 1,
  );
  if (inactiveOverride) return;

  const index = activeChord.midi - baseMidi;

  const currentTick = state.currentTick;
  const progress =
    (currentTick - activeChord.ticks) / activeChord.durationTicks;

  const baseX = p.width / 2 - destWidth / 2;
  p.stroke(255, 128);
  p.strokeWeight(dotUnit / 2);
  p.noFill();
  const isHalf = activeChord.velocity <= 0.5;
  const lineY = height - padding - lineHeight / 2;
  let x: number;
  if (isHalf) {
    x = p.lerp(
      p.width / 2 - partWidth / 2,
      p.width / 2 + partWidth / 2,
      progress,
    );
  } else {
    if (progress < 0.5) {
      x = p.map(
        progress,
        0,
        0.5,
        baseX + leftPadding,
        baseX + partWidth + leftPadding,
      );
    } else {
      x = p.map(
        progress,
        0.5,
        1,
        baseX + destWidth - partWidth - leftPadding,
        baseX + destWidth - leftPadding,
      );
    }
  }

  p.line(x, lineY, x, lineY + lineHeight);
  const rate = chordImage.width / destWidth;

  const isContinued =
    chordTrack.notes.some(
      (note) => note.ticks + note.durationTicks === activeChord.ticks,
    ) &&
    !chordTrack.notes.some(
      (note) =>
        note.ticks + note.durationTicks === activeChord.ticks &&
        note.midi === baseMidi - 1,
    );
  let animationProgress = 1;
  if (!isContinued) {
    animationProgress = p.map(
      state.currentTime,
      activeChord.time,
      activeChord.time + animationDuration,
      0,
      1,
      true,
    );
  }

  p.tint(255, 255 * easeOutQuint(animationProgress));
  p.drawingContext.shadowColor = "#8888";
  p.drawingContext.shadowBlur = dotUnit;
  if (isHalf) {
    p.translate((leftPadding + destWidth - partWidth * 2) / 2, 0);
  }
  p.image(
    chordImage,
    baseX - animationWidth * (1 - easeOutQuint(animationProgress)),
    p.height - padding - rowHeight / rate + imageTopPadding + dotUnit * 2,
    destWidth,
    rowHeight / rate,
    0,
    rowHeight * index + imageTopPadding,
    chordImage.width,
    rowHeight,
  );
});
