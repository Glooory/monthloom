import { Lunar } from "lunar-typescript";
import { addDays, toISODate } from "../date/date";
import type { LocalDate } from "../date/types";

/** Only the festivals Monthloom displays, independent of annual leave schedules. */
export function getChineseFestivals(year: number): ReadonlyMap<string, string> {
  const names = new Map<string, string>();
  const add = (date: LocalDate, name: string) => {
    const key = toISODate(date);
    const existing = names.get(key);
    names.set(key, existing ? `${existing}、${name}` : name);
  };
  const fromLunar = (month: number, day: number): LocalDate => {
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    return {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
    };
  };

  add({ year, month: 1, day: 1 }, "元旦");
  add({ year, month: 5, day: 1 }, "劳动节");
  add({ year, month: 10, day: 1 }, "国庆节");
  const springFestival = fromLunar(1, 1);
  add(addDays(springFestival, -1), "除夕");
  add(springFestival, "春节");
  add(fromLunar(5, 5), "端午节");
  add(fromLunar(8, 15), "中秋节");
  const qingming = Lunar.fromYmd(year, 1, 1).getJieQiTable()["清明"];
  add(
    {
      year: qingming.getYear(),
      month: qingming.getMonth(),
      day: qingming.getDay(),
    },
    "清明节",
  );
  return names;
}
