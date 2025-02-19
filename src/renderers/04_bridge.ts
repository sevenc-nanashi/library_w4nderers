import type { Note } from "@tonejs/midi/dist/Note";
import type p5 from "p5";
import { dotUnit, mainFont, reiColor, tycColor } from "../const";
import type { State } from "../state";
import timelineMid from "../assets/timeline.mid?mid";
import { dim, useRendererContext } from "../utils";
import vert from "../shaders/common.vert?raw";
import mult from "../shaders/mult.frag?raw";
import mainImageUrl from "../assets/illusts/main.png?url";
import { atlasMap } from "../atlas";
import { characterLabs } from "../lab";
import { easeOutQuint, unlerp } from "../easing";

const bridgeTrack = timelineMid.tracks.find(
  (track) => track.name === "bridge",
)!;
let shadowGraphics: p5.Graphics;
let mainGraphics: p5.Graphics;
let bufferGraphics: p5.Graphics;

let shader: p5.Shader;
let mainImage: p5.Image;

const bridgeSpawnMidi = 48;
const bridgePersistMidi = 49;
const shadowSpawnMidi = 50;
const shadowPersistMidi = 51;
const roadSpawnMidi = 52;
const roadPersistMidi = 53;

const reiBaseNote = 60;
const tycBaseNote = 72;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!shadowGraphics) {
    mainImage = p.loadImage(mainImageUrl);
    shadowGraphics = p.createGraphics(p.width / dotUnit, p.height / dotUnit);
    mainGraphics = p.createGraphics(p.width / dotUnit, p.height / dotUnit);
    bufferGraphics = p.createGraphics(
      p.width / dotUnit,
      p.height / dotUnit,
      p.WEBGL,
    );

    shader = p.createShader(vert, mult);
    // rgb(213, 199, 209)
    bufferGraphics.shader(shader);
  }

  shadowGraphics.clear();
  mainGraphics.clear();
  bufferGraphics.clear();
  shadowGraphics.noSmooth();
  mainGraphics.noSmooth();

  let shadowScale = 0;
  const shadowSpawnNote = bridgeTrack.notes.find(
    (note) =>
      note.midi === shadowSpawnMidi &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (shadowSpawnNote) {
    shadowScale = easeOutQuint(
      unlerp(
        shadowSpawnNote.ticks,
        shadowSpawnNote.ticks + shadowSpawnNote.durationTicks,
        state.currentTick,
      ),
    );
  }
  const shadowPersistNote = bridgeTrack.notes.find(
    (note) =>
      note.midi === shadowPersistMidi &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (shadowPersistNote) {
    shadowScale = 1;
  }

  const bridgeAlpha = getAlpha(state, bridgeSpawnMidi, bridgePersistMidi);
  if (bridgeAlpha > 0) {
    using _context = useRendererContext(mainGraphics);
    mainGraphics.tint(255, bridgeAlpha * 255);
    mainGraphics.translate(0, 4 * (1 - bridgeAlpha));
    const bridgeAtlas = atlasMap["bridge"];
    const shadowAtlas = atlasMap["bridge_shadow"];
    const bridgeHeight = bridgeAtlas.height - 10;
    mainGraphics.image(
      mainImage,
      0,
      mainGraphics.height - bridgeHeight,
      bridgeAtlas.width,
      bridgeAtlas.height,
      ...bridgeAtlas.start,
      bridgeAtlas.width,
      bridgeAtlas.height,
    );
    if (shadowScale > 0) {
      using _context = useRendererContext(shadowGraphics);
      shadowGraphics.translate(
        0,
        shadowGraphics.height -
          bridgeHeight +
          (bridgeAtlas.yellowPixels[0][1] - bridgeAtlas.start[1]),
      );
      shadowGraphics.scale(1, shadowScale);
      shadowGraphics.image(
        mainImage,
        0,
        0,
        shadowAtlas.width,
        shadowAtlas.height,
        ...shadowAtlas.start,
        shadowAtlas.width,
        shadowAtlas.height,
      );
    }
  }

  const roadAlpha = getAlpha(state, roadSpawnMidi, roadPersistMidi);
  if (roadAlpha > 0) {
    using _context = useRendererContext(mainGraphics);
    mainGraphics.tint(255, roadAlpha * 255);
    mainGraphics.translate(0, 4 * (1 - roadAlpha));
    const roadAtlas = atlasMap["road"];
    const roadHeight = roadAtlas.height;
    mainGraphics.image(
      mainImage,
      0,
      mainGraphics.height - roadHeight,
      roadAtlas.width,
      roadAtlas.height,
      ...roadAtlas.start,
      roadAtlas.width,
      roadAtlas.height,
    );
  }

  const characterX = 100;
  const characterMinusY = 20;
  {
    using _context = useRendererContext(shadowGraphics);

    shadowGraphics.translate(
      shadowGraphics.width / 2 - characterX,
      shadowGraphics.height - characterMinusY,
    );
    shadowGraphics.scale(1, -shadowScale);
    drawCharacter(p, shadowGraphics, state, "rei", reiBaseNote);
  }
  {
    using _context = useRendererContext(shadowGraphics);

    shadowGraphics.translate(
      shadowGraphics.width / 2 + characterX,
      shadowGraphics.height - characterMinusY,
    );
    shadowGraphics.scale(1, -shadowScale);
    drawCharacter(p, shadowGraphics, state, "tyc", tycBaseNote);
  }

  shader.setUniform("uResolution", [p.width / dotUnit, p.height / dotUnit]);
  shader.setUniform("uColor", [213 / 255, 199 / 255, 209 / 255, 1.0]);
  shader.setUniform("uBase", mainGraphics);
  shader.setUniform("uMult", shadowGraphics);
  bufferGraphics.quad(-1, -1, 1, -1, 1, 1, -1, 1);

  using _context = useRendererContext(p);
  p.noSmooth();
  p.image(bufferGraphics, 0, 0, p.width, p.height);
  p.translate(p.width / 2, p.height);
  p.scale(dotUnit);
  {
    using _context = useRendererContext(p);
    p.translate(-characterX, -characterMinusY);
    drawCharacter(p, p, state, "rei", reiBaseNote);
  }
  {
    using _context = useRendererContext(p);
    p.translate(characterX, -characterMinusY);
    drawCharacter(p, p, state, "tyc", tycBaseNote);
  }
});

const drawCharacter = (
  p: p5,
  graphics: p5,
  state: State,
  name: keyof typeof characterLabs,
  baseMidi: number,
) => {
  const note = bridgeTrack.notes.find(
    (note) =>
      note.midi >= baseMidi &&
      note.midi < baseMidi + 4 &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (!note) {
    return;
  }
  const atlas = atlasMap[name];
  const yShift = note.midi === baseMidi ? 1 : 0;
  const footPixel = atlas.yellowPixels[2];
  const footY = footPixel[1] - atlas.start[1];

  const isOpen = !bridgeTrack.notes.find(
    (note) =>
      note.midi === baseMidi + 4 &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );

  const eyeAtlas = atlasMap[`${name}_eyes_${isOpen ? "open" : "closed"}`];
  const eyePixel = atlas.yellowPixels[0];
  const eyePixelDiff = [
    eyePixel[0] - atlas.start[0],
    eyePixel[1] - atlas.start[1],
  ];
  const currentMouth = characterLabs[name].find(
    (lab) => lab.start <= state.currentTime && state.currentTime < lab.end,
  );
  const mouthAtlas =
    atlasMap[`${name}_mouth_${currentMouth?.phoneme}`] ||
    atlasMap[`${name}_mouth_n`];
  const mouthPixel = atlas.yellowPixels[1];
  const mouthPixelDiff = [
    mouthPixel[0] - atlas.start[0],
    mouthPixel[1] - atlas.start[1],
  ];

  graphics.image(
    mainImage,
    -atlas.width / 2,
    -atlas.height + footY,
    atlas.width,
    atlas.height - footY,
    atlas.start[0],
    atlas.start[1] + footY,
    atlas.width,
    atlas.height - footY,
  );
  graphics.image(
    mainImage,
    -atlas.width / 2,
    -atlas.height + yShift,
    atlas.width,
    footY,
    ...atlas.start,
    atlas.width,
    footY,
  );
  graphics.image(
    mainImage,
    -atlas.width / 2 + eyePixelDiff[0],
    -atlas.height + eyePixelDiff[1] + yShift,
    eyeAtlas.width,
    eyeAtlas.height,
    ...eyeAtlas.start,
    eyeAtlas.width,
    eyeAtlas.height,
  );
  graphics.image(
    mainImage,
    -atlas.width / 2 + mouthPixelDiff[0],
    -atlas.height + mouthPixelDiff[1] + yShift,
    mouthAtlas.width,
    mouthAtlas.height,
    ...mouthAtlas.start,
    mouthAtlas.width,
    mouthAtlas.height,
  );
};

const getAlpha = (state: State, spawnMidi: number, persistMidi: number) => {
  let alpha = 0;
  const spawnNote = bridgeTrack.notes.find(
    (note) =>
      note.midi === spawnMidi &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (spawnNote) {
    alpha = easeOutQuint(
      unlerp(
        spawnNote.ticks,
        spawnNote.ticks + spawnNote.durationTicks,
        state.currentTick,
      ),
    );
  }
  const persistNote = bridgeTrack.notes.find(
    (note) =>
      note.midi === persistMidi &&
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (persistNote) {
    alpha = 1;
  }
  return alpha;
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    shadowGraphics?.remove();
    mainGraphics?.remove();
    bufferGraphics?.remove();
  });
}
