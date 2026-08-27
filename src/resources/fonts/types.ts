import type { FontDescriptor } from "../../domain/template/font";

export type FontCatalog = Readonly<Record<string, FontDescriptor>>;

export type FontTextRequirements = ReadonlyMap<string, string>;
