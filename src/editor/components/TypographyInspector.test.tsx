import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TypographyInspector } from "./TypographyInspector";
import { createDefaultEditorDocument } from "../state/documentStore";
import { getStoredInstalledFonts, queryInstalledFonts } from "../fonts/localFonts";
import { listGoogleFontFamilies } from "../../resources/fonts/googleFontCatalog";

vi.mock("../fonts/localFonts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../fonts/localFonts")>();
  return {
    ...actual,
    getCachedInstalledFonts: () => null,
    getStoredInstalledFonts: vi.fn(() => null),
    clearStoredInstalledFonts: vi.fn(),
    queryInstalledFonts: vi.fn(async () => [{
      family: "Test Sans",
      fullName: "Test Sans Regular",
      postscriptName: "TestSans-Regular",
      style: "Regular",
      blob: vi.fn(),
    }]),
  };
});

const originalPermissions = navigator.permissions;
afterEach(() => {
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: originalPermissions,
  });
});

function renderInspector() {
  const document = createDefaultEditorDocument();
  return render(
    <TypographyInspector
      typography={document.mainTemplate.date.typography}
      fontDescriptor={document.fontCatalog["main.date"]}
      onChangeTypography={vi.fn()}
      onSelectFont={vi.fn()}
      fontAssetStore={{ setAsset: vi.fn() }}
    />,
  );
}

describe("TypographyInspector system fonts", () => {
  it("hides the load action after system fonts are available", async () => {
    renderInspector();
    fireEvent.click(await screen.findByRole("button", { name: /加载系统字体/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /加载系统字体/ })).toBeNull());

    fireEvent.change(screen.getByRole("combobox", { name: "字体" }), {
      target: { value: "Test Sans" },
    });
    const option = screen.getByRole("option", { name: "Test Sans — Regular" });
    expect((option.querySelector("span") as HTMLSpanElement).style.fontFamily).toBe("Test Sans");
  });

  it("shows saved system font names without requesting enumeration on page load", async () => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: vi.fn(async () => ({ state: "granted" })) },
    });
    vi.mocked(getStoredInstalledFonts).mockReturnValueOnce([{
      family: "Test Sans", fullName: "Test Sans Regular",
      postscriptName: "TestSans-Regular", style: "Regular",
    }]);
    vi.mocked(queryInstalledFonts).mockClear();
    renderInspector();
    await waitFor(() => expect(screen.queryByRole("button", { name: /加载系统字体/ })).toBeNull());
    expect(queryInstalledFonts).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox", { name: "字体" }), {
      target: { value: "Test Sans" },
    });
    expect(screen.getByRole("option", { name: "Test Sans — Regular" })).toBeDefined();
  });
});

describe("TypographyInspector Google Fonts", () => {
  it("uses one font combobox for the current value and search", () => {
    renderInspector();
    const input = screen.getByRole("combobox", { name: "字体" }) as HTMLInputElement;
    expect(input.value).toBe("Noto Sans");
    expect(screen.queryByRole("button", { name: "字体" })).toBeNull();
    fireEvent.click(input);
    expect(input.value).toBe("");
    const list = screen.getByRole("listbox", { name: "字体" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(document.activeElement).toBe(list);
    fireEvent.keyDown(list, { key: "Escape" });
    expect(screen.queryByRole("listbox", { name: "字体" })).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("opens the full font list when the search field is clicked without typing", () => {
    renderInspector();
    const search = screen.getByRole("combobox", { name: "字体" });
    expect(screen.queryByRole("listbox", { name: "字体" })).toBeNull();

    fireEvent.click(search);
    expect(screen.getByRole("listbox", { name: "字体" })).toBeDefined();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByRole("listbox", { name: "字体" })).toBeNull();
    fireEvent.click(search);
    expect(screen.getByRole("listbox", { name: "字体" })).toBeDefined();
  });

  it("shows the picker as an overlay outside the inspector layout flow", () => {
    renderInspector();
    const input = screen.getByRole("combobox", { name: "字体" });
    const controls = input.closest(".font-picker-controls");
    fireEvent.click(input);

    const list = screen.getByRole("listbox", { name: "字体" });
    expect(controls?.contains(list)).toBe(false);
    expect(list.parentElement?.classList.contains("font-picker-popover")).toBe(true);
  });

  it("opens above when the input is near the viewport bottom", () => {
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rect = (top: number, bottom: number) => ({
      top, bottom, left: 100, right: 380, width: 280, height: bottom - top,
    }) as DOMRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.id === "font-search") return rect(400, 428);
        if (this.classList.contains("font-picker-controls")) return rect(400, 428);
        return originalRect.call(this);
      });
    try {
      renderInspector();
      fireEvent.click(screen.getByRole("combobox", { name: "字体" }));
      const list = screen.getByRole("listbox", { name: "字体" });
      const popoverTop = Number.parseFloat((list.parentElement as HTMLElement).style.top);
      const popoverHeight = Number.parseFloat((list as HTMLElement).style.height);
      expect(popoverTop + popoverHeight).toBeLessThanOrEqual(396);
    } finally {
      rectSpy.mockRestore();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
    }
  });

  it("opens below when the full list fits beneath the input", () => {
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rect = (top: number, bottom: number) => ({
      top, bottom, left: 100, right: 380, width: 280, height: bottom - top,
    }) as DOMRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.id === "font-search") return rect(100, 128);
        if (this.classList.contains("font-picker-controls")) return rect(100, 128);
        return originalRect.call(this);
      });
    try {
      renderInspector();
      fireEvent.click(screen.getByRole("combobox", { name: "字体" }));
      const list = screen.getByRole("listbox", { name: "字体" });
      expect(Number.parseFloat((list.parentElement as HTMLElement).style.top)).toBe(132);
    } finally {
      rectSpy.mockRestore();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
    }
  });

  it("opens above both controls when there is too little room below the search field", () => {
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 500 });
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rect = (top: number, bottom: number) => ({
      top, bottom, left: 100, right: 380, width: 280, height: bottom - top,
    }) as DOMRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.id === "font-search") return rect(450, 478);
        if (this.classList.contains("font-picker-controls")) return rect(450, 478);
        return originalRect.call(this);
      });
    try {
      renderInspector();
      fireEvent.click(screen.getByRole("combobox", { name: "字体" }));
      const list = screen.getByRole("listbox", { name: "字体" });
      const popoverTop = Number.parseFloat((list.parentElement as HTMLElement).style.top);
      const popoverHeight = Number.parseFloat((list as HTMLElement).style.height);
      expect(popoverTop + popoverHeight).toBeLessThanOrEqual(446);
    } finally {
      rectSpy.mockRestore();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
    }
  });

  it("shows the full Google Fonts list before searching and filters it afterward", () => {
    renderInspector();
    fireEvent.click(screen.getByRole("combobox", { name: "字体" }));
    const list = screen.getByRole("listbox", { name: "字体" });
    expect(within(list).getAllByRole("option").length).toBeLessThan(20);
    const index = listGoogleFontFamilies().indexOf("Merriweather") + 1;
    fireEvent.scroll(list, { target: { scrollTop: index * 44 } });
    const option = within(list).getByRole("option", { name: "Merriweather" });
    expect((option.querySelector("span") as HTMLSpanElement).style.fontFamily).toBe("Merriweather");

    fireEvent.change(screen.getByRole("combobox", { name: "字体" }), {
      target: { value: "Lato" },
    });
    expect(screen.queryByRole("option", { name: "Merriweather" })).toBeNull();
    expect(screen.getByRole("option", { name: "Lato" })).toBeDefined();
  });

  it("searches the full catalog and selects an available Lato face", () => {
    const document = createDefaultEditorDocument();
    const onSelectFont = vi.fn();
    render(
      <TypographyInspector
        typography={document.mainTemplate.date.typography}
        fontDescriptor={document.fontCatalog["main.date"]}
        onChangeTypography={vi.fn()}
        onSelectFont={onSelectFont}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "字体" }), {
      target: { value: "Lato" },
    });
    const option = screen.getByRole("option", { name: "Lato" });
    fireEvent.pointerDown(option);
    fireEvent.click(option);
    expect(onSelectFont).toHaveBeenCalledWith(
      expect.objectContaining({ family: "Lato", weight: 400 }),
      expect.objectContaining({ fontWeight: 400 }),
    );
    expect((screen.getByRole("combobox", { name: "字体" }) as HTMLInputElement).value).toBe("Noto Sans");
  });
});
