import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HolidayLibraryRepository } from "../../persistence/db/holidayLibraryRepository";
import { MonthloomDatabase } from "../../persistence/db/monthloomDb";
import { useHolidayLibraryStore } from "../state/holidayLibraryStore";
import { HolidayLibraryPanel } from "./HolidayLibraryPanel";

describe("HolidayLibraryPanel", () => {
  let db: MonthloomDatabase;
  let repo: HolidayLibraryRepository;

  beforeEach(async () => {
    db = new MonthloomDatabase(`test-panel-db-${Math.random()}`);
    repo = new HolidayLibraryRepository(db);
    await repo.ensureBuiltins();
    await useHolidayLibraryStore.getState().hydrate(repo);
  });

  it("renders calendar list with China and Japan and switches active calendar", async () => {
    const closeMock = vi.fn();
    render(
      <HolidayLibraryPanel
        isOpen={true}
        onClose={closeMock}
        targetYear={2027}
        repository={repo}
      />,
    );

    expect(screen.getByText("全局节假日资料库")).toBeDefined();
    expect(screen.getAllByText("中国公众假期").length).toBeGreaterThan(0);
    expect(screen.getByText("日本公众假期")).toBeDefined();

    // Click Japan calendar in the left list
    const japanBtn = screen.getByText("日本公众假期");
    fireEvent.click(japanBtn);

    await waitFor(() => {
      expect(screen.getAllByText("日本公众假期").length).toBeGreaterThan(1);
    });
  });

  it("triggers new calendar creation via prompt", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Custom Calendar");

    render(
      <HolidayLibraryPanel
        isOpen={true}
        onClose={() => {}}
        targetYear={2027}
        repository={repo}
      />,
    );

    const addCalBtn = screen.getByRole("button", { name: /\+ 新增日历/i });
    fireEvent.click(addCalBtn);

    await waitFor(() => {
      expect(screen.getAllByText("Custom Calendar").length).toBeGreaterThan(0);
    });
  });

  it("imports a new calendar with its stable ID through the calendar list import button", async () => {
    render(
      <HolidayLibraryPanel
        isOpen={true}
        onClose={() => {}}
        targetYear={2027}
        repository={repo}
      />,
    );

    const newCalendarJson = JSON.stringify({
      format: "monthloom-holidays",
      version: 1,
      calendar: {
        id: "custom-external-holiday-cal",
        name: "External Custom Holidays",
      },
      coverage: [{ start: "2027-01-01", end: "2027-12-31", status: "confirmed" }],
      records: [
        {
          date: "2027-05-01",
          type: "holiday",
          name: "May Day Celebration",
        },
      ],
    });


    const file = new File([newCalendarJson], "external-holidays.json", {
      type: "application/json",
    });
    file.text = async () => newCalendarJson;

    const importBtn = screen.getByRole("button", { name: /导入日历 \(JSON\)/i });
    expect(importBtn).toBeDefined();

    const fileInput = document.querySelector(
      '.holiday-calendar-list input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });


    // A confirmation dialog appears for applying the update
    await waitFor(() => {
      expect(screen.getByText("确认应用节假日变更")).toBeDefined();
    });

    const confirmBtn = screen.getByRole("button", { name: /确认应用/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const snapshot = useHolidayLibraryStore.getState().snapshot;
      expect(
        snapshot.calendars.map((c) => c.id),
      ).toContain("custom-external-holiday-cal");
      expect(screen.getAllByText("External Custom Holidays").length).toBeGreaterThan(0);
    });
  });
});
