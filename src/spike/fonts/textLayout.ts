import type { SpikeFont } from "./fontkitAdapter";

export function fontScale(font: SpikeFont, fontSize: number): number {
  return fontSize / font.unitsPerEm;
}
