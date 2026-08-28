import type { TextElementTemplate } from "./primitives";
import type { CalendarBaseColors } from "./mainTemplate";

export type MiniTemplate = Readonly<{
  width: number;
  height: number;

  monthRow: Readonly<{
    height: number;
    label: TextElementTemplate;
  }>;

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

  date: TextElementTemplate;
  colors: CalendarBaseColors;
}>;
