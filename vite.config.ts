import { defineConfig } from "vite";
import yaml from "@rollup/plugin-yaml";
import hmrify from "vite-plugin-hmrify";
import arraybuffer from "vite-plugin-arraybuffer";

export default defineConfig({
	plugins: [yaml(), hmrify(), arraybuffer()],
});
