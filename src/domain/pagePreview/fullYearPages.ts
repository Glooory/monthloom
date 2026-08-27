import type { YearMonth } from "../calendar/types";
import { getMainMonths } from "../calendar/monthSequence";

export type FullYearPageDefinition = Readonly<{
  pageIndex: number;
  label: string;
  mainMonth: YearMonth;
  previousMiniMonth: YearMonth;
  nextMiniMonth: YearMonth;
}>;

export function shiftYearMonth(yearMonth: YearMonth, deltaMonths: number): YearMonth {
  let totalMonths = yearMonth.year * 12 + (yearMonth.month - 1) + deltaMonths;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12 + 12) % 12 + 1;
  return { year, month };
}

export function getFullYearPageDefinitions(
  targetYear: number,
): readonly FullYearPageDefinition[] {
  const mainMonths = getMainMonths(targetYear); // 13 formal main months
  return mainMonths.map((mainMonth, pageIndex) => {
    const previousMiniMonth = shiftYearMonth(mainMonth, -1);
    const nextMiniMonth = shiftYearMonth(mainMonth, 1);
    const label = `${mainMonth.year}-${mainMonth.month}`;

    return {
      pageIndex,
      label,
      mainMonth,
      previousMiniMonth,
      nextMiniMonth,
    };
  });
}
