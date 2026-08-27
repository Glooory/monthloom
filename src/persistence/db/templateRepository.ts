import type { MonthloomDatabase } from "./monthloomDb";
import { db as defaultDb } from "./monthloomDb";
import type { TemplateSnapshotV1 } from "../schema/templateSnapshot";
import { validateTemplateSnapshot } from "../schema/validation";

export class TemplateRepository {
  constructor(private db: MonthloomDatabase = defaultDb) {}

  async save(template: TemplateSnapshotV1): Promise<void> {
    const validated = validateTemplateSnapshot(template);
    await this.db.templates.put(validated);
  }

  async getById(id: string): Promise<TemplateSnapshotV1 | null> {
    const record = await this.db.templates.get(id);
    if (!record) return null;
    return validateTemplateSnapshot(record);
  }

  async list(): Promise<Array<Pick<TemplateSnapshotV1, "id" | "name" | "updatedAt">>> {
    const records = await this.db.templates.toArray();
    return records
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id, name, updatedAt }) => ({
        id,
        name,
        updatedAt,
      }));
  }

  async delete(id: string): Promise<void> {
    await this.db.templates.delete(id);
  }
}
