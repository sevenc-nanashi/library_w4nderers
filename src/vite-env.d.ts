/// <reference types="vite/client" />
/// <reference types="vite-plugin-hmrify/client" />
/// <reference types="vite-plugin-arraybuffer/types" />

declare module "*.yml" {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const content: any;
	export default content;
}

declare module "*.mid?mid" {
	import { Midi } from "@tonejs/midi";
	import { MidiData } from "midi-file";

	const toneJsMidi: Midi;
	const rawMidi: MidiData;
	export { toneJsMidi, rawMidi };
	export default toneJsMidi;
}
