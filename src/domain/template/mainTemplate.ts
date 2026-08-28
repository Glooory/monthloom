import type { MarkerTemplate, TextElementTemplate } from "./primitives";

export type MainTemplate = Readonly<{
  width: number;
  height: number;

  weekdayRow: Readonly<{
    height: number;
    labels?: readonly string[];
    startOfWeek?: 0 | 1;
    showBorder?: boolean;
    borderWidth?: number;
    borderColor?: string;
    colors?: Readonly<{
      default?: string;
      sunday?: string;
      saturday?: string;
    }>;
    weekday: TextElementTemplate;
  }>;

  dateGrid: Readonly<{
    borderWidth: number;
    borderColor: string;
  }>;

  date: TextElementTemplate;
  chinaHolidayName: TextElementTemplate;
  japanHolidayName: TextElementTemplate;

  chinaMarkers: Readonly<{
    holiday: MarkerTemplate;
    workday: MarkerTemplate;
  }>;

  colors: Readonly<{
    default: string;
    sunday: string;
    saturday: string;
    japanHoliday: string;
  }>;

  adjacentMonthOpacity: number;
}>;
