import { cp, mkdir, rm } from "node:fs/promises";

const outputDirectory = "dist";
const publicEntries = ["index.html", "manifest.webmanifest", "sw.js", "assets", "src"];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  publicEntries.map((entry) => cp(entry, `${outputDirectory}/${entry}`, { recursive: true }))
);
