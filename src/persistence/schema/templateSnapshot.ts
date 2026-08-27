import { z } from "zod";
import { editorDocumentSchema } from "./projectSnapshot";

import type { EditorDocument } from "../../editor/model/types";

export type TemplateSnapshotV1 = Readonly<{
  version: 1;
  type: "template";
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  document: EditorDocument;
}>;

export const templateSnapshotV1Schema: z.ZodType<TemplateSnapshotV1> = z.object({
  version: z.literal(1),
  type: z.literal("template"),
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  document: editorDocumentSchema as unknown as z.ZodType<EditorDocument>,
});
