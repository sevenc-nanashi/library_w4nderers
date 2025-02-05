import p5 from "p5";
import { State } from "../state.ts";
import { drumVisualizer } from "../components/drumVisualizer.ts";
import {dotUnit} from "../const.ts";

export const draw = import.meta.hmrify((p: p5, state: State) => {
  p.translate(p.width - dotUnit * 6, p.height - dotUnit * 6);
  drumVisualizer(p, state);
});
