import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HolidayRecordDialog } from "./HolidayRecordDialog";

describe("HolidayRecordDialog", () => {
  it("submits single date holiday creation", async () => {
    const saveSingleMock = vi.fn().mockResolvedValue(undefined);
    const saveRangeMock = vi.fn().mockResolvedValue(undefined);
    const closeMock = vi.fn();

    render(
      <HolidayRecordDialog
        isOpen={true}
        onClose={closeMock}
        onSaveSingle={saveSingleMock}
        onSaveRange={saveRangeMock}
      />,
    );

    const dateInput = screen.getByLabelText(/日期/i);
    fireEvent.change(dateInput, { target: { value: "2027-01-01" } });

    const nameInput = screen.getByLabelText(/节假日名称/i);
    fireEvent.change(nameInput, { target: { value: "元旦" } });

    const saveBtn = screen.getByRole("button", { name: /保存/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveSingleMock).toHaveBeenCalledWith({
        date: { year: 2027, month: 1, day: 1 },
        type: "holiday",
        name: "元旦",
      });
      expect(closeMock).toHaveBeenCalled();
    });
  });

  it("switches to date range tab and submits range creation", async () => {
    const saveSingleMock = vi.fn().mockResolvedValue(undefined);
    const saveRangeMock = vi.fn().mockResolvedValue(undefined);
    const closeMock = vi.fn();

    render(
      <HolidayRecordDialog
        isOpen={true}
        onClose={closeMock}
        onSaveSingle={saveSingleMock}
        onSaveRange={saveRangeMock}
      />,
    );

    // Switch to range tab
    const rangeTab = screen.getByRole("button", { name: /日期区间/i });
    fireEvent.click(rangeTab);

    const startInput = screen.getByLabelText(/开始日期/i);
    fireEvent.change(startInput, { target: { value: "2027-05-01" } });

    const endInput = screen.getByLabelText(/结束日期/i);
    fireEvent.change(endInput, { target: { value: "2027-05-03" } });

    const saveBtn = screen.getByRole("button", { name: /保存/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveRangeMock).toHaveBeenCalledWith({
        start: { year: 2027, month: 5, day: 1 },
        end: { year: 2027, month: 5, day: 3 },
        type: "holiday",
        name: undefined,
      });
      expect(closeMock).toHaveBeenCalled();
    });
  });
});
