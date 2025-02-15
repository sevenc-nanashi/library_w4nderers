import type p5 from "p5";
import { sort } from "pixelsort";
import { dotUnit } from "../const";
import { easeInQuint, easeOutQuint } from "../easing";
import { loadTimelineWithText } from "../midi";
import commonVert from "../shaders/common.vert?raw";
import pixelizeFrag from "../shaders/pixelize.frag?raw";
import timelineMid, {
  rawMidi as timelineRawMid,
} from "../assets/timeline.mid?mid";
import type { State } from "../state";

const imageSwitchMid = 60;
const pixelsortInMid = 61;
const pixelsortOutMid = 62;
const alphaInMid = 63;

const backgroundTrack = loadTimelineWithText(
  "backgrounds",
  timelineMid,
  timelineRawMid,
  {
    midis: [imageSwitchMid],
  },
);

const images = import.meta.glob("../assets/backgrounds/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const loadedImages: Record<string, p5.Image> = {};
let pixelizeShader: p5.Shader;
let cpuGraphics: p5.Graphics;
let mainGraphics: p5.Graphics;

const wave = dotUnit;
const minusScale = 1 / 4;

export const preload = import.meta.hmrify((p: p5) => {
  for (const [path, image] of Object.entries(images)) {
    const filename = path.split("/").pop()!;
    loadedImages[filename] = p.loadImage(image.default);
  }
});

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (Object.keys(loadedImages).length === 0) {
    preload(p);
    return;
  }
  if (!pixelizeShader) {
    pixelizeShader = p.createShader(commonVert, pixelizeFrag);
  }
  if (!mainGraphics) {
    cpuGraphics = p.createGraphics(p.width * minusScale, p.height * minusScale);
    mainGraphics = p.createGraphics(
      p.width * minusScale,
      p.height * minusScale,
      p.WEBGL,
    );

    mainGraphics.shader(pixelizeShader);
  }

  mainGraphics.clear();
  const currentTick = state.currentTick;
  const activeBackground = backgroundTrack.texts.find(
    (note) =>
      note.note.ticks <= currentTick &&
      note.note.ticks + note.note.durationTicks > currentTick &&
      note.note.midi === imageSwitchMid,
  );

  const sortNote = backgroundTrack.track.notes.find(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      (note.midi === pixelsortInMid || note.midi === pixelsortOutMid),
  );

  if (activeBackground) {
    cpuGraphics.clear();
    cpuGraphics.image(
      loadedImages[activeBackground.text],
      0,
      0,
      cpuGraphics.width,
      cpuGraphics.height,
    );
    if (sortNote) {
      cpuGraphics.loadPixels();
      cpuGraphics.noSmooth();
      const sortNoteProgress = Math.min(
        1,
        (currentTick - sortNote.ticks) / sortNote.durationTicks,
      );
      const sorted = sort(
        cpuGraphics.pixels as unknown as Uint8Array,
        cpuGraphics.width,
        cpuGraphics.height,
        512 *
          (sortNote.midi === pixelsortInMid
            ? easeInQuint(sortNoteProgress)
            : easeInQuint(1 - sortNoteProgress)),
      );
      for (let i = 0; i < sorted.length; i++) {
        cpuGraphics.pixels[i] = sorted[i];
      }
      cpuGraphics.updatePixels(0, 0, cpuGraphics.width, cpuGraphics.height);
    }
    pixelizeShader.setUniform("u_resolution", [
      p.width * minusScale,
      p.height * minusScale,
    ]);

    const currentMeasure = state.currentMeasure;
    pixelizeShader.setUniform(
      "u_wave",
      Math.sin(currentMeasure * Math.PI) * wave * minusScale,
    );
    pixelizeShader.setUniform("u_pixelSize", dotUnit * 2 * minusScale);
    pixelizeShader.setUniform("u_texture", cpuGraphics);

    mainGraphics.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  }

  const alphaNote = backgroundTrack.track.notes.find(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      note.midi === alphaInMid,
  );
  const alphaProgress = alphaNote
    ? Math.min(1, (currentTick - alphaNote.ticks) / alphaNote.durationTicks)
    : 1;
  p.tint(255, 192 * easeOutQuint(alphaProgress));
  p.image(mainGraphics, 0, 0, p.width, p.height);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    mainGraphics?.remove();
  });
}
