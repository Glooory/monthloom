export type HolidayLayerElement =
  | "name"
  | "holidayMarker"
  | "workdayMarker"
  | "dateColors";

export type HolidaySemanticId =
  | `main.holiday.${string}.${HolidayLayerElement}`
  | `mini.holiday.${string}.${Exclude<HolidayLayerElement, "name">}`;

export function buildHolidaySemanticId(
  target: "main" | "mini",
  layerId: string,
  element: HolidayLayerElement,
): HolidaySemanticId {
  if (target === "mini" && element === "name") {
    throw new Error("Mini calendars do not support holiday names.");
  }
  return `${target}.holiday.${layerId}.${element}` as HolidaySemanticId;
}

export function parseHolidaySemanticId(id: string): {
  target: "main" | "mini";
  layerId: string;
  element: HolidayLayerElement;
} | null {
  const parts = id.split(".");
  if (parts.length !== 4 || parts[1] !== "holiday") return null;
  const target = parts[0];
  const layerId = parts[2];
  let rawElement = parts[3];

  if (rawElement === "holiday-marker") rawElement = "holidayMarker";
  if (rawElement === "workday-marker") rawElement = "workdayMarker";
  if (rawElement === "date-colors") rawElement = "dateColors";

  const validElements: HolidayLayerElement[] = [
    "name",
    "holidayMarker",
    "workdayMarker",
    "dateColors",
  ];
  if (!validElements.includes(rawElement as HolidayLayerElement)) {
    return null;
  }

  const element = rawElement as HolidayLayerElement;
  if (target !== "main" && target !== "mini") return null;
  if (target === "mini" && element === "name") return null;

  return { target, layerId, element };
}
