import type { TextElementTemplate } from "./primitives";

export type CalendarBaseColors = Readonly<{
  default: string;
  sunday: string;
  saturday: string;
}>;

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
    showBorder?: boolean;
    borderWidth: number;
    borderColor: string;
  }>;

  date: TextElementTemplate;
  colors: CalendarBaseColors;
  adjacentMonthOpacity: number;
}>;
