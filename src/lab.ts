const rawLabs = import.meta.glob("./assets/lab/*.lab", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

type LabEntry = {
  start: number;
  end: number;
  phoneme: string;
};
export const characterLabs = {
  rei: [] as LabEntry[],
  tyc: [] as LabEntry[],
};

for (const [path, lab] of Object.entries(rawLabs)) {
  const lines = lab.split("\n");
  const character = path.split("/").pop()!.split(".")[0];
  if (!(character in characterLabs)) {
    throw new Error(`Invalid character: ${character}`);
  }
  for (const line of lines) {
    const [start, end, phoneme] = line.split(" ");
    if (phoneme === "pau") {
      continue;
    }
    characterLabs[character as keyof typeof characterLabs].push({
      start: Number.parseInt(start) / 10e6,
      end: Number.parseInt(end) / 10e6,
      phoneme,
    });
  }
}

for (const character of Object.keys(
  characterLabs,
) as (keyof typeof characterLabs)[]) {
  characterLabs[character].sort((a, b) => a.start - b.start);
}
