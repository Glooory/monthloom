import { TemplateRepository } from "../db/templateRepository";
import { db as defaultDb, type MonthloomDatabase } from "../db/monthloomDb";
import { useDocumentStore } from "../../editor/state/documentStore";
import type { TemplateSnapshotV1 } from "../schema/templateSnapshot";

export class TemplateOperations {
  private repo: TemplateRepository;

  constructor(customDb?: MonthloomDatabase) {
    this.repo = new TemplateRepository(customDb ?? defaultDb);
  }

  async saveCurrentTemplate(name: string): Promise<string> {
    const document = useDocumentStore.getState().document;
    const templateId = `template-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const snapshot: TemplateSnapshotV1 = {
      version: 1,
      type: "template",
      id: templateId,
      name: name.trim() || "Untitled Template",
      createdAt: now,
      updatedAt: now,
      document,
    };

    await this.repo.save(snapshot);
    return templateId;
  }

  async applyTemplate(id: string): Promise<void> {
    const template = await this.repo.getById(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    // Applying template is an undoable action in documentStore
    useDocumentStore.getState().commitDocument(template.document);
  }

  async listTemplates() {
    return this.repo.list();
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

export const templateOperations = new TemplateOperations();
