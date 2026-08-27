import type { MonthloomDatabase } from "./monthloomDb";
import { db as defaultDb } from "./monthloomDb";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import { validateProjectSnapshot } from "../schema/validation";

export class ProjectRepository {
  constructor(private db: MonthloomDatabase = defaultDb) {}

  async save(project: ProjectSnapshotV1): Promise<void> {
    const validated = validateProjectSnapshot(project);
    await this.db.projects.put(validated);
  }

  async getById(id: string): Promise<ProjectSnapshotV1 | null> {
    const record = await this.db.projects.get(id);
    if (!record) return null;
    return validateProjectSnapshot(record);
  }

  async list(): Promise<Array<Pick<ProjectSnapshotV1, "id" | "name" | "targetYear" | "updatedAt">>> {
    const records = await this.db.projects.toArray();
    return records
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id, name, targetYear, updatedAt }) => ({
        id,
        name,
        targetYear,
        updatedAt,
      }));
  }

  async delete(id: string): Promise<void> {
    await this.db.projects.delete(id);
  }
}
