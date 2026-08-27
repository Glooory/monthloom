import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthloomDatabase } from "./monthloomDb";
import { ProjectRepository } from "./projectRepository";
import { TemplateRepository } from "./templateRepository";
import { AssetRepository } from "./assetRepository";
import { FontCacheRepository } from "./fontCacheRepository";
import { createDefaultEditorDocument } from "../../editor/state/documentStore";
import type { ProjectSnapshotV1 } from "../schema/projectSnapshot";
import type { TemplateSnapshotV1 } from "../schema/templateSnapshot";

describe("IndexedDB Repositories", () => {
  let testDb: MonthloomDatabase;
  let projectRepo: ProjectRepository;
  let templateRepo: TemplateRepository;
  let assetRepo: AssetRepository;
  let fontCacheRepo: FontCacheRepository;

  beforeEach(() => {
    testDb = new MonthloomDatabase(`test-db-${Date.now()}-${Math.random()}`);
    projectRepo = new ProjectRepository(testDb);
    templateRepo = new TemplateRepository(testDb);
    assetRepo = new AssetRepository(testDb);
    fontCacheRepo = new FontCacheRepository(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it("saves, retrieves, lists, and deletes projects", async () => {
    const project: ProjectSnapshotV1 = {
      version: 1,
      type: "project",
      id: "p1",
      name: "Project One",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetYear: 2027,
      chinaHolidayDataset: null,
      japanHolidayDataset: null,
      document: createDefaultEditorDocument(),
    };

    await projectRepo.save(project);
    const retrieved = await projectRepo.getById("p1");
    expect(retrieved?.name).toBe("Project One");

    const list = await projectRepo.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("p1");

    await projectRepo.delete("p1");
    expect(await projectRepo.getById("p1")).toBeNull();
  });

  it("saves, retrieves, lists, and deletes templates", async () => {
    const template: TemplateSnapshotV1 = {
      version: 1,
      type: "template",
      id: "t1",
      name: "Template One",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      document: createDefaultEditorDocument(),
    };

    await templateRepo.save(template);
    const retrieved = await templateRepo.getById("t1");
    expect(retrieved?.name).toBe("Template One");

    const list = await templateRepo.list();
    expect(list).toHaveLength(1);

    await templateRepo.delete("t1");
    expect(await templateRepo.getById("t1")).toBeNull();
  });

  it("saves, retrieves, and deletes binary assets", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await assetRepo.save({
      id: "a1",
      mimeType: "image/png",
      data: bytes,
      createdAt: new Date().toISOString(),
    });

    const retrieved = await assetRepo.getById("a1");
    expect(retrieved).not.toBeNull();
    expect(Array.from(retrieved?.data ?? [])).toEqual(Array.from(bytes));

    await assetRepo.delete("a1");
    expect(await assetRepo.getById("a1")).toBeNull();
  });

  it("saves and retrieves font cache records", async () => {
    const binary = new Uint8Array([10, 20, 30]);
    await fontCacheRepo.save({
      cacheKey: "noto-sans-400-normal",
      family: "Noto Sans",
      weight: 400,
      style: "normal",
      format: "ttf",
      binary,
      updatedAt: new Date().toISOString(),
    });

    const retrieved = await fontCacheRepo.getByKey("noto-sans-400-normal");
    expect(Array.from(retrieved?.binary ?? [])).toEqual(Array.from(binary));

    await fontCacheRepo.clear();
    expect(await fontCacheRepo.getByKey("noto-sans-400-normal")).toBeNull();
  });
});
