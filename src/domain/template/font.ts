export type FontSource =
  | Readonly<{
      type: "google";
      family: string;
    }>
  | Readonly<{
      type: "local";
      assetId: string;
    }>;

export type FontDescriptor = Readonly<{
  family: string;
  weight: number;
  style: "normal" | "italic";
  source: FontSource;
}>;
