import type { MainTemplate } from "./mainTemplate";
import type { MiniTemplate } from "./miniTemplate";

export const DEFAULT_MAIN_WEEKDAYS: readonly string[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const DEFAULT_MINI_WEEKDAYS: readonly string[] = [
  "S",
  "M",
  "T",
  "W",
  "T",
  "F",
  "S",
];

export const DEFAULT_MAIN_TEMPLATE: MainTemplate = {
  width: 700,
  height: 500,

  weekdayRow: {
    height: 50,
    labels: DEFAULT_MAIN_WEEKDAYS,
    startOfWeek: 0,
    showBorder: false,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    weekday: {
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
      typography: {
        fontId: "default-sans",
        fontSize: 14,
        fontWeight: 600,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#374151",
        opacity: 1,
      },
    },
  },

  dateGrid: {
    showBorder: true,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  date: {
    position: { anchor: "top-left", offsetX: 10, offsetY: 8 },
    typography: {
      fontId: "default-sans",
      fontSize: 18,
      fontWeight: 500,
      fontStyle: "normal",
      letterSpacing: 0,
      color: "#1F2937",
      opacity: 1,
    },
  },

  chinaHolidayName: {
    position: { anchor: "bottom-left", offsetX: 10, offsetY: -8 },
    typography: {
      fontId: "default-sans",
      fontSize: 11,
      fontWeight: 400,
      fontStyle: "normal",
      letterSpacing: 0,
      color: "#DC2626",
      opacity: 1,
    },
  },

  japanHolidayName: {
    position: { anchor: "bottom-right", offsetX: -10, offsetY: -8 },
    typography: {
      fontId: "default-sans",
      fontSize: 11,
      fontWeight: 400,
      fontStyle: "normal",
      letterSpacing: 0,
      color: "#DC2626",
      opacity: 1,
    },
  },

  chinaMarkers: {
    holiday: {
      type: "text",
      value: "休",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "default-sans",
        fontSize: 10,
        fontWeight: 500,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#DC2626",
        opacity: 1,
      },
    },
    workday: {
      type: "text",
      value: "班",
      position: { anchor: "top-right", offsetX: -8, offsetY: 8 },
      typography: {
        fontId: "default-sans",
        fontSize: 10,
        fontWeight: 500,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#4B5563",
        opacity: 1,
      },
    },
  },

  colors: {
    default: "#1F2937",
    sunday: "#DC2626",
    saturday: "#2563EB",
    japanHoliday: "#DC2626",
  },

  adjacentMonthOpacity: 0.4,
};

export const DEFAULT_MINI_TEMPLATE: MiniTemplate = {
  width: 280,
  height: 210,

  monthRow: {
    height: 30,
    label: {
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
      typography: {
        fontId: "default-sans",
        fontSize: 14,
        fontWeight: 600,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#111827",
        opacity: 1,
      },
    },
  },

  weekdayRow: {
    height: 30,
    labels: DEFAULT_MINI_WEEKDAYS,
    startOfWeek: 0,
    showBorder: false,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    weekday: {
      position: { anchor: "center", offsetX: 0, offsetY: 0 },
      typography: {
        fontId: "default-sans",
        fontSize: 11,
        fontWeight: 500,
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#6B7280",
        opacity: 1,
      },
    },
  },

  date: {
    position: { anchor: "center", offsetX: 0, offsetY: 0 },
    typography: {
      fontId: "default-sans",
      fontSize: 12,
      fontWeight: 400,
      fontStyle: "normal",
      letterSpacing: 0,
      color: "#1F2937",
      opacity: 1,
    },
  },

  markers: {
    holidayDot: {
      position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
      size: 4,
      color: "#DC2626",
      opacity: 1,
    },
    workdayDot: {
      position: { anchor: "top-right", offsetX: -4, offsetY: 4 },
      size: 4,
      color: "#6B7280",
      opacity: 1,
    },
  },

  colors: {
    default: "#1F2937",
    sunday: "#DC2626",
    saturday: "#2563EB",
    japanHoliday: "#DC2626",
  },
};
