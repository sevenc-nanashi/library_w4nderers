import p5 from "p5";
import "./style.css";
import { draw } from "./draw.ts";
import { width, height, frameRate } from "./const.ts";
import { State } from "./state.ts";
import { attachCapturerUi } from "p5-frame-capturer";

new p5((p: p5) => {
  const state = new State(0, false);
  p.setup = async () => {
    p.frameRate(frameRate);
    p.createCanvas(width, height);
  };

  p.draw = () => {
    draw(p, state);
  };

  attachCapturerUi(p);
});
