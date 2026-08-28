import type {
  EditorDocument,
  EditableSemanticId,
  PositionableSemanticId,
  CalendarColors,
} from "./types";
import type {
  Position,
  Typography,
} from "../../domain/template/primitives";
import type { FontDescriptor } from "../../domain/template/font";
import {
  DEFAULT_MAIN_WEEKDAYS,
  DEFAULT_MINI_WEEKDAYS,
} from "../../domain/template/defaults";
import { parseHolidaySemanticId } from "./holidaySemanticId";

export function getElementPosition(
  document: EditorDocument,
  semanticId: PositionableSemanticId,
): Position {
  const parsedHoliday = parseHolidaySemanticId(semanticId);
  if (parsedHoliday) {
    const layer = document.holidayLayers?.find(
      (l) => l.id === parsedHoliday.layerId,
    );
    if (layer) {
      if (parsedHoliday.target === "main") {
        if (parsedHoliday.element === "name") {
          return layer.main.name.position;
        }
        if (parsedHoliday.element === "holidayMarker") {
          return layer.main.holidayMarker.marker.position;
        }
        if (parsedHoliday.element === "workdayMarker") {
          return layer.main.workdayMarker.marker.position;
        }
      } else {
        if (parsedHoliday.element === "holidayMarker") {
          return layer.mini.holidayMarker.marker.position;
        }
        if (parsedHoliday.element === "workdayMarker") {
          return layer.mini.workdayMarker.marker.position;
        }
      }
    }
  }

  switch (semanticId) {
    case "main.weekday":
      return document.mainTemplate.weekdayRow.weekday.position;
    case "main.date":
      return document.mainTemplate.date.position;
    case "mini.monthLabel":
      return document.miniTemplate.monthRow.label.position;
    case "mini.weekday":
      return document.miniTemplate.weekdayRow.weekday.position;
    case "mini.date":
      return document.miniTemplate.date.position;
    default:
      return { anchor: "top-left", offsetX: 0, offsetY: 0 };
  }
}

export function setElementPosition(
  document: EditorDocument,
  semanticId: PositionableSemanticId,
  position: Position,
): EditorDocument {
  const parsedHoliday = parseHolidaySemanticId(semanticId);
  if (parsedHoliday && document.holidayLayers) {
    const nextLayers = document.holidayLayers.map((layer) => {
      if (layer.id !== parsedHoliday.layerId) return layer;
      if (parsedHoliday.target === "main") {
        if (parsedHoliday.element === "name") {
          return {
            ...layer,
            main: {
              ...layer.main,
              name: {
                ...layer.main.name,
                position,
              },
            },
          };
        }
        if (parsedHoliday.element === "holidayMarker") {
          return {
            ...layer,
            main: {
              ...layer.main,
              holidayMarker: {
                ...layer.main.holidayMarker,
                marker: {
                  ...layer.main.holidayMarker.marker,
                  position,
                },
              },
            },
          };
        }
        if (parsedHoliday.element === "workdayMarker") {
          return {
            ...layer,
            main: {
              ...layer.main,
              workdayMarker: {
                ...layer.main.workdayMarker,
                marker: {
                  ...layer.main.workdayMarker.marker,
                  position,
                },
              },
            },
          };
        }
      } else {
        if (parsedHoliday.element === "holidayMarker") {
          return {
            ...layer,
            mini: {
              ...layer.mini,
              holidayMarker: {
                ...layer.mini.holidayMarker,
                marker: {
                  ...layer.mini.holidayMarker.marker,
                  position,
                },
              },
            },
          };
        }
        if (parsedHoliday.element === "workdayMarker") {
          return {
            ...layer,
            mini: {
              ...layer.mini,
              workdayMarker: {
                ...layer.mini.workdayMarker,
                marker: {
                  ...layer.mini.workdayMarker.marker,
                  position,
                },
              },
            },
          };
        }
      }
      return layer;
    });

    return {
      ...document,
      holidayLayers: nextLayers,
    };
  }

  switch (semanticId) {
    case "main.weekday":
      return {
        ...document,
        mainTemplate: {
          ...document.mainTemplate,
          weekdayRow: {
            ...document.mainTemplate.weekdayRow,
            weekday: {
              ...document.mainTemplate.weekdayRow.weekday,
              position,
            },
          },
        },
      };
    case "main.date":
      return {
        ...document,
        mainTemplate: {
          ...document.mainTemplate,
          date: {
            ...document.mainTemplate.date,
            position,
          },
        },
      };
    case "mini.monthLabel":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          monthRow: {
            ...document.miniTemplate.monthRow,
            label: {
              ...document.miniTemplate.monthRow.label,
              position,
            },
          },
        },
      };
    case "mini.weekday":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          weekdayRow: {
            ...document.miniTemplate.weekdayRow,
            weekday: {
              ...document.miniTemplate.weekdayRow.weekday,
              position,
            },
          },
        },
      };
    case "mini.date":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          date: {
            ...document.miniTemplate.date,
            position,
          },
        },
      };
    default:
      return document;
  }
}

export function getTypography(
  document: EditorDocument,
  semanticId: EditableSemanticId,
): Typography | null {
  const parsedHoliday = parseHolidaySemanticId(semanticId);
  if (parsedHoliday) {
    const layer = document.holidayLayers?.find(
      (l) => l.id === parsedHoliday.layerId,
    );
    if (layer) {
      if (parsedHoliday.target === "main") {
        if (parsedHoliday.element === "name") {
          return layer.main.name.typography;
        }
        if (
          parsedHoliday.element === "holidayMarker" &&
          layer.main.holidayMarker.marker.type === "text"
        ) {
          return layer.main.holidayMarker.marker.typography;
        }
        if (
          parsedHoliday.element === "workdayMarker" &&
          layer.main.workdayMarker.marker.type === "text"
        ) {
          return layer.main.workdayMarker.marker.typography;
        }
      }
    }
    return null;
  }

  switch (semanticId) {
    case "main.weekday":
      return document.mainTemplate.weekdayRow.weekday.typography;
    case "main.date":
      return document.mainTemplate.date.typography;
    case "mini.monthLabel":
      return document.miniTemplate.monthRow.label.typography;
    case "mini.weekday":
      return document.miniTemplate.weekdayRow.weekday.typography;
    case "mini.date":
      return document.miniTemplate.date.typography;
    case "main.grid":
    default:
      return null;
  }
}

export function setTypography(
  document: EditorDocument,
  semanticId: EditableSemanticId,
  typography: Typography,
): EditorDocument {
  const parsedHoliday = parseHolidaySemanticId(semanticId);
  if (parsedHoliday && document.holidayLayers) {
    const nextLayers = document.holidayLayers.map((layer) => {
      if (layer.id !== parsedHoliday.layerId) return layer;
      if (parsedHoliday.target === "main") {
        if (parsedHoliday.element === "name") {
          return {
            ...layer,
            main: {
              ...layer.main,
              name: {
                ...layer.main.name,
                typography,
              },
            },
          };
        }
        if (
          parsedHoliday.element === "holidayMarker" &&
          layer.main.holidayMarker.marker.type === "text"
        ) {
          return {
            ...layer,
            main: {
              ...layer.main,
              holidayMarker: {
                ...layer.main.holidayMarker,
                marker: {
                  ...layer.main.holidayMarker.marker,
                  typography,
                },
              },
            },
          };
        }
        if (
          parsedHoliday.element === "workdayMarker" &&
          layer.main.workdayMarker.marker.type === "text"
        ) {
          return {
            ...layer,
            main: {
              ...layer.main,
              workdayMarker: {
                ...layer.main.workdayMarker,
                marker: {
                  ...layer.main.workdayMarker.marker,
                  typography,
                },
              },
            },
          };
        }
      }
      return layer;
    });

    return {
      ...document,
      holidayLayers: nextLayers,
    };
  }

  switch (semanticId) {
    case "main.weekday":
      return {
        ...document,
        mainTemplate: {
          ...document.mainTemplate,
          weekdayRow: {
            ...document.mainTemplate.weekdayRow,
            weekday: {
              ...document.mainTemplate.weekdayRow.weekday,
              typography,
            },
          },
        },
      };
    case "main.date":
      return {
        ...document,
        mainTemplate: {
          ...document.mainTemplate,
          date: {
            ...document.mainTemplate.date,
            typography,
          },
        },
      };
    case "mini.monthLabel":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          monthRow: {
            ...document.miniTemplate.monthRow,
            label: {
              ...document.miniTemplate.monthRow.label,
              typography,
            },
          },
        },
      };
    case "mini.weekday":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          weekdayRow: {
            ...document.miniTemplate.weekdayRow,
            weekday: {
              ...document.miniTemplate.weekdayRow.weekday,
              typography,
            },
          },
        },
      };
    case "mini.date":
      return {
        ...document,
        miniTemplate: {
          ...document.miniTemplate,
          date: {
            ...document.miniTemplate.date,
            typography,
          },
        },
      };
    default:
      return document;
  }
}

export function getCalendarColors(
  document: EditorDocument,
  target: "main" | "mini",
): CalendarColors {
  return target === "main"
    ? document.mainTemplate.colors
    : document.miniTemplate.colors;
}

export function setCalendarColors(
  document: EditorDocument,
  target: "main" | "mini",
  colors: CalendarColors,
): EditorDocument {
  if (target === "main") {
    return {
      ...document,
      mainTemplate: {
        ...document.mainTemplate,
        colors,
      },
    };
  } else {
    return {
      ...document,
      miniTemplate: {
        ...document.miniTemplate,
        colors,
      },
    };
  }
}

export function getGridBorder(
  document: EditorDocument,
): { showBorder?: boolean; borderWidth: number; borderColor: string } {
  return {
    showBorder: document.mainTemplate.dateGrid.showBorder ?? true,
    borderWidth: document.mainTemplate.dateGrid.borderWidth,
    borderColor: document.mainTemplate.dateGrid.borderColor,
  };
}

export function setGridBorder(
  document: EditorDocument,
  border: { showBorder?: boolean; borderWidth?: number; borderColor?: string },
): EditorDocument {
  return {
    ...document,
    mainTemplate: {
      ...document.mainTemplate,
      dateGrid: {
        ...document.mainTemplate.dateGrid,
        showBorder:
          border.showBorder !== undefined
            ? border.showBorder
            : (document.mainTemplate.dateGrid.showBorder ?? true),
        borderWidth:
          border.borderWidth !== undefined
            ? border.borderWidth
            : document.mainTemplate.dateGrid.borderWidth,
        borderColor:
          border.borderColor !== undefined
            ? border.borderColor
            : document.mainTemplate.dateGrid.borderColor,
      },
    },
  };
}

export function updateFontDescriptor(
  document: EditorDocument,
  fontId: string,
  updater: (prev: FontDescriptor) => FontDescriptor,
): EditorDocument {
  const current = document.fontCatalog[fontId];
  if (!current) return document;
  return {
    ...document,
    fontCatalog: {
      ...document.fontCatalog,
      [fontId]: updater(current),
    },
  };
}

export type WeekdayRowSettings = Readonly<{
  height: number;
  labels: readonly string[];
  startOfWeek: 0 | 1;
  showBorder: boolean;
  borderWidth: number;
  borderColor: string;
  colors: Readonly<{
    default?: string;
    sunday?: string;
    saturday?: string;
  }>;
}>;

export function getWeekdayRowSettings(
  document: EditorDocument,
  templateType: "main" | "mini",
): WeekdayRowSettings {
  const row =
    templateType === "main"
      ? document.mainTemplate.weekdayRow
      : document.miniTemplate.weekdayRow;
  const templateColors =
    templateType === "main"
      ? document.mainTemplate.colors
      : document.miniTemplate.colors;
  const defaultLabels =
    templateType === "main"
      ? DEFAULT_MAIN_WEEKDAYS
      : DEFAULT_MINI_WEEKDAYS;

  return {
    height: row.height,
    labels: row.labels ?? defaultLabels,
    startOfWeek: row.startOfWeek ?? 0,
    showBorder: row.showBorder ?? false,
    borderWidth: row.borderWidth ?? 1,
    borderColor: row.borderColor ?? "#E5E7EB",
    colors: {
      default: row.colors?.default ?? row.weekday.typography.color,
      sunday: row.colors?.sunday ?? templateColors.sunday,
      saturday: row.colors?.saturday ?? templateColors.saturday,
    },
  };
}

export function setWeekdayRowSettings(
  document: EditorDocument,
  templateType: "main" | "mini",
  settings: Partial<WeekdayRowSettings>,
): EditorDocument {
  if (templateType === "main") {
    const current = document.mainTemplate.weekdayRow;
    const nextTypography = settings.colors?.default
      ? { ...current.weekday.typography, color: settings.colors.default }
      : current.weekday.typography;
    return {
      ...document,
      mainTemplate: {
        ...document.mainTemplate,
        weekdayRow: {
          ...current,
          height:
            settings.height !== undefined ? settings.height : current.height,
          labels:
            settings.labels !== undefined ? settings.labels : current.labels,
          startOfWeek:
            settings.startOfWeek !== undefined
              ? settings.startOfWeek
              : current.startOfWeek,
          showBorder:
            settings.showBorder !== undefined
              ? settings.showBorder
              : current.showBorder,
          borderWidth:
            settings.borderWidth !== undefined
              ? settings.borderWidth
              : current.borderWidth,
          borderColor:
            settings.borderColor !== undefined
              ? settings.borderColor
              : current.borderColor,
          colors:
            settings.colors !== undefined
              ? { ...current.colors, ...settings.colors }
              : current.colors,
          weekday: {
            ...current.weekday,
            typography: nextTypography,
          },
        },
      },
    };
  } else {
    const current = document.miniTemplate.weekdayRow;
    const nextTypography = settings.colors?.default
      ? { ...current.weekday.typography, color: settings.colors.default }
      : current.weekday.typography;
    return {
      ...document,
      miniTemplate: {
        ...document.miniTemplate,
        weekdayRow: {
          ...current,
          height:
            settings.height !== undefined ? settings.height : current.height,
          labels:
            settings.labels !== undefined ? settings.labels : current.labels,
          startOfWeek:
            settings.startOfWeek !== undefined
              ? settings.startOfWeek
              : current.startOfWeek,
          showBorder:
            settings.showBorder !== undefined
              ? settings.showBorder
              : current.showBorder,
          borderWidth:
            settings.borderWidth !== undefined
              ? settings.borderWidth
              : current.borderWidth,
          borderColor:
            settings.borderColor !== undefined
              ? settings.borderColor
              : current.borderColor,
          colors:
            settings.colors !== undefined
              ? { ...current.colors, ...settings.colors }
              : current.colors,
          weekday: {
            ...current.weekday,
            typography: nextTypography,
          },
        },
      },
    };
  }
}

export function getWeekdayLabels(
  document: EditorDocument,
  templateType: "main" | "mini",
): readonly string[] {
  if (templateType === "main") {
    return document.mainTemplate.weekdayRow.labels ?? DEFAULT_MAIN_WEEKDAYS;
  } else {
    return document.miniTemplate.weekdayRow.labels ?? DEFAULT_MINI_WEEKDAYS;
  }
}

export function setWeekdayLabels(
  document: EditorDocument,
  templateType: "main" | "mini",
  labels: readonly string[],
): EditorDocument {
  return setWeekdayRowSettings(document, templateType, { labels });
}

export function getTemplateDimensions(
  document: EditorDocument,
  templateType: "main" | "mini",
): { width: number; height: number } {
  if (templateType === "main") {
    return {
      width: document.mainTemplate.width,
      height: document.mainTemplate.height,
    };
  } else {
    return {
      width: document.miniTemplate.width,
      height: document.miniTemplate.height,
    };
  }
}

export function setTemplateDimensions(
  document: EditorDocument,
  templateType: "main" | "mini",
  dimensions: { width?: number; height?: number },
): EditorDocument {
  if (templateType === "main") {
    const current = document.mainTemplate;
    const width =
      dimensions.width !== undefined
        ? Math.max(50, Math.min(10000, Math.round(dimensions.width)))
        : current.width;
    const height =
      dimensions.height !== undefined
        ? Math.max(50, Math.min(10000, Math.round(dimensions.height)))
        : current.height;
    return {
      ...document,
      mainTemplate: {
        ...current,
        width,
        height,
      },
    };
  } else {
    const current = document.miniTemplate;
    const width =
      dimensions.width !== undefined
        ? Math.max(50, Math.min(10000, Math.round(dimensions.width)))
        : current.width;
    const height =
      dimensions.height !== undefined
        ? Math.max(50, Math.min(10000, Math.round(dimensions.height)))
        : current.height;
    return {
      ...document,
      miniTemplate: {
        ...current,
        width,
        height,
      },
    };
  }
}

export function getAdjacentDaysSettings(document: EditorDocument): {
  showAdjacentDays: boolean;
  adjacentMonthOpacity: number;
} {
  return {
    showAdjacentDays: document.mainTemplate.showAdjacentDays ?? false,
    adjacentMonthOpacity: document.mainTemplate.adjacentMonthOpacity,
  };
}

export function setAdjacentDaysSettings(
  document: EditorDocument,
  settings: { showAdjacentDays?: boolean; adjacentMonthOpacity?: number },
): EditorDocument {
  return {
    ...document,
    mainTemplate: {
      ...document.mainTemplate,
      showAdjacentDays:
        settings.showAdjacentDays !== undefined
          ? settings.showAdjacentDays
          : (document.mainTemplate.showAdjacentDays ?? false),
      adjacentMonthOpacity:
        settings.adjacentMonthOpacity !== undefined
          ? Math.max(0, Math.min(1, settings.adjacentMonthOpacity))
          : document.mainTemplate.adjacentMonthOpacity,
    },
  };
}

