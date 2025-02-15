import atlasRaw from "./assets/atlas.yml";

export type SliceDefinition = {
  name: string;
  start: [number, number];
  width: number;
  yellowPixels: [number, number][];
  height: number;
  end: [number, number];
};
export const atlas = atlasRaw as {
  slices: SliceDefinition[];
};
export const atlasMap = Object.fromEntries(
  atlas.slices.map((slice: SliceDefinition) => [slice.name, slice]),
) as Record<string, SliceDefinition>;
