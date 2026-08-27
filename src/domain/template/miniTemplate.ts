import type { DotTemplate, TextElementTemplate } from "./primitives";

export type MiniTemplate = Readonly<{
  width: number;
  height: number;

  monthRow: Readonly<{
    height: number;
    label: TextElementTemplate;
  }>;

  weekdayRow: Readonly<{
    height: number;
    weekday: TextElementTemplate;
  }>;

  date: TextElementTemplate;

  markers: Readonly<{
    holidayDot: DotTemplate;
    workdayDot: DotTemplate;
  }>;

  colors: Readonly<{
    default: string;
    sunday: string;
    saturday: string;
    japanHoliday: string;
  }>;
}>;
