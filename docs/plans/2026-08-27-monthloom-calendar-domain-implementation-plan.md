# Monthloom Phase 1 — Calendar Domain Implementation Plan

> **Note (Superseded):** The original 14 Mini / Preview-only February concept in this historical plan has been superseded by `docs/plans/2026-08-27-monthloom-mini-scope-correction-phase6-plan.md`. Formal Mini scope is now 15 months (including Y+1 February).

**Goal:** Build Monthloom's production Calendar Domain: timezone-safe date primitives, 4/5/6-week calendar generation with adjacent dates, normalized China/Japan holiday models and adapters, holiday lookup, required rendering coverage calculation, and explicit coverage diagnostics.

**Architecture:** Keep date/calendar logic pure and independent from React/SVG. Third-party holiday JSON is validated and normalized only inside adapters; Calendar Core sees only `HolidayIndex`. `LocalDate` lives in a small shared domain module because both Calendar and Holiday depend on it, avoiding a Calendar ↔ Holiday type cycle.

**Tech Stack:** TypeScript, Vitest, Zod. No date library.

**Spec:** `docs/specs/2026-08-27-monthloom-technical-design.md`

## Global Constraints

- This is formal production code; do not extend the Rendering Spike into the production architecture.
- Do not implement SVG, Layout Engine, Template Model, Editor, Zustand, Dexie, ZIP export, or Page Preview UI in this phase.
- Calendar Core must not depend on React, SVG, fonts, anchors, pixel coordinates, Inspector, Figma, Timor JSON, or holidays-jp JSON.
- Third-party holiday schemas must not leave their adapter modules.
- Domain APIs must use `LocalDate`; browser-local JavaScript `Date` must not leak through public domain interfaces.
- Internal date calculations may use UTC-based JavaScript `Date`.
- Calendar weeks start on Sunday: `0 = Sunday ... 6 = Saturday`.
- Calendar generation always returns a complete rectangular 4 / 5 / 6-week grid including adjacent-month Cells.
- Missing holiday entries do not by themselves prove that a date is non-holiday; coverage is modeled explicitly.
- Monthloom never guesses missing holiday data.
- China `holiday: true` normalizes to `type: "holiday"`; `holiday: false` normalizes to `type: "workday"`.
- Japan holiday JSON normalizes to `japan: { name }`.
- Use Zod only at external JSON boundaries, not throughout pure internal domain logic.
- Keep implementation simple. No generic date framework, plugin system, DI framework, event bus, or speculative abstractions.
- Every Task must end with passing targeted tests plus a full `npm test` / `npm run build` verification where stated.

---

# 1. Target Production File Structure

Create the following production modules. Keep the existing `src/spike/` code isolated; production domain code must not import from it.

```text
src/
  domain/
    date/
      types.ts
      date.ts
      date.test.ts

    holiday/
      types.ts
      holidayIndex.ts
      holidayIndex.test.ts

      adapters/
        japanHolidaysJpAdapter.ts
        japanHolidaysJpAdapter.test.ts
        chinaTimorHolidayAdapter.ts
        chinaTimorHolidayAdapter.test.ts

      coverage.ts
      coverage.test.ts

    calendar/
      types.ts
      generateCalendarMonth.ts
      generateCalendarMonth.test.ts
      monthSequence.ts
      monthSequence.test.ts
```

Responsibilities:

- `domain/date/types.ts`: `LocalDate`, `DayOfWeek`, `DateRange`.
- `domain/date/date.ts`: validation, UTC-backed date arithmetic, ISO parsing/formatting, comparison.
- `domain/holiday/types.ts`: normalized holiday models, dataset, diagnostics, coverage.
- `domain/holiday/holidayIndex.ts`: merge normalized datasets into date-keyed lookup.
- `domain/holiday/adapters/*`: source-specific Zod validation and normalization only.
- `domain/holiday/coverage.ts`: coverage membership, uncovered-range calculation, warning diagnostics.
- `domain/calendar/types.ts`: `YearMonth`, `CalendarCell`, `CalendarWeek`, `CalendarMonth`.
- `domain/calendar/generateCalendarMonth.ts`: 4/5/6-week Sunday-first grid generation.
- `domain/calendar/monthSequence.ts`: formal Main/Mini month sequences and actual required date range for a target year.

---

# Task 1: Implement the Date-only Domain Primitive

**Files:**
- Create: `src/domain/date/types.ts`
- Create: `src/domain/date/date.ts`
- Create: `src/domain/date/date.test.ts`

**Interfaces:**
- Produces:

```ts
export type LocalDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRange = Readonly<{
  start: LocalDate;
  end: LocalDate;
}>;

export function isValidLocalDate(date: LocalDate): boolean;
export function daysInMonth(year: number, month: number): number;
export function dayOfWeek(date: LocalDate): DayOfWeek;
export function addDays(date: LocalDate, delta: number): LocalDate;
export function compareDate(a: LocalDate, b: LocalDate): -1 | 0 | 1;
export function toISODate(date: LocalDate): string;
export function parseISODate(value: string): LocalDate | null;
```

- [ ] **Step 1: Create immutable date types**

Create `src/domain/date/types.ts`:

```ts
export type LocalDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRange = Readonly<{
  start: LocalDate;
  end: LocalDate;
}>;
```

- [ ] **Step 2: Write failing tests for leap years and month lengths**

Create `src/domain/date/date.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { daysInMonth } from "./date";

describe("daysInMonth", () => {
  it("handles leap years", () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it("rejects invalid months", () => {
    expect(() => daysInMonth(2027, 0)).toThrow(RangeError);
    expect(() => daysInMonth(2027, 13)).toThrow(RangeError);
  });
});
```

- [ ] **Step 3: Run the targeted test and confirm failure**

Run:

```bash
npm test -- src/domain/date/date.test.ts
```

Expected:

```text
FAIL because the date implementation does not exist.
```

- [ ] **Step 4: Implement `daysInMonth` with UTC dates**

Use:

```ts
function assertValidMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${month}`);
  }
}

export function daysInMonth(year: number, month: number): number {
  assertValidMonth(month);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
```

- [ ] **Step 5: Add failing tests for validation, weekday and arithmetic**

Add:

```ts
import {
  addDays,
  dayOfWeek,
  isValidLocalDate,
} from "./date";

describe("LocalDate utilities", () => {
  it("validates real calendar dates", () => {
    expect(isValidLocalDate({ year: 2028, month: 2, day: 29 })).toBe(true);
    expect(isValidLocalDate({ year: 2027, month: 2, day: 29 })).toBe(false);
    expect(isValidLocalDate({ year: 2027, month: 13, day: 1 })).toBe(false);
  });

  it("uses Sunday as day 0", () => {
    expect(dayOfWeek({ year: 2027, month: 1, day: 3 })).toBe(0);
    expect(dayOfWeek({ year: 2027, month: 1, day: 9 })).toBe(6);
  });

  it("crosses month and year boundaries without local timezone behavior", () => {
    expect(addDays({ year: 2027, month: 1, day: 1 }, -1)).toEqual({
      year: 2026,
      month: 12,
      day: 31,
    });

    expect(addDays({ year: 2027, month: 12, day: 31 }, 1)).toEqual({
      year: 2028,
      month: 1,
      day: 1,
    });
  });
});
```

- [ ] **Step 6: Implement validation and UTC conversion helpers**

Keep JavaScript `Date` private:

```ts
function toUtcDate(date: LocalDate): Date {
  if (!isValidLocalDate(date)) {
    throw new RangeError(`Invalid LocalDate: ${JSON.stringify(date)}`);
  }

  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function fromUtcDate(date: Date): LocalDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}
```

Implement `isValidLocalDate`, `dayOfWeek`, and `addDays` using UTC getters/setters only.

- [ ] **Step 7: Add failing ISO and comparison tests**

Add:

```ts
import {
  compareDate,
  parseISODate,
  toISODate,
} from "./date";

it("formats ISO dates with zero-padded month and day", () => {
  expect(toISODate({ year: 2027, month: 5, day: 7 })).toBe("2027-05-07");
});

it("parses only strict valid YYYY-MM-DD values", () => {
  expect(parseISODate("2027-05-07")).toEqual({
    year: 2027,
    month: 5,
    day: 7,
  });

  expect(parseISODate("2027-5-7")).toBeNull();
  expect(parseISODate("2027-02-29")).toBeNull();
  expect(parseISODate("not-a-date")).toBeNull();
});

it("compares dates chronologically", () => {
  expect(
    compareDate(
      { year: 2027, month: 1, day: 1 },
      { year: 2027, month: 1, day: 2 },
    ),
  ).toBe(-1);

  expect(
    compareDate(
      { year: 2027, month: 1, day: 2 },
      { year: 2027, month: 1, day: 2 },
    ),
  ).toBe(0);
});
```

- [ ] **Step 8: Implement strict ISO parsing and comparison**

`parseISODate` must:

1. Match exactly `/^\d{4}-\d{2}-\d{2}$/`.
2. Convert components to numbers.
3. Return `null` unless `isValidLocalDate` is true.

`toISODate` must validate before formatting.

`compareDate` should compare:

```text
year → month → day
```

without timezone conversion.

- [ ] **Step 9: Run targeted and full verification**

Run:

```bash
npm test -- src/domain/date/date.test.ts
npm test
npm run build
```

Expected:

```text
All date tests pass.
Existing Rendering Spike tests still pass.
Production build succeeds.
```

- [ ] **Step 10: Commit**

```bash
git add src/domain/date
git commit -m "feat: add local date domain utilities"
```

---

# Task 2: Define the Normalized Holiday Model and Holiday Index

**Files:**
- Create: `src/domain/holiday/types.ts`
- Create: `src/domain/holiday/holidayIndex.ts`
- Create: `src/domain/holiday/holidayIndex.test.ts`

**Interfaces:**
- Consumes:
  - `LocalDate`
  - `DateRange`
  - `toISODate`
- Produces:

```ts
export type HolidayInfo = Readonly<{
  china?: Readonly<{
    type: "holiday" | "workday";
    name?: string;
  }>;
  japan?: Readonly<{
    name: string;
  }>;
}>;

export type HolidayEntry = Readonly<{
  date: LocalDate;
  info: HolidayInfo;
}>;

export type HolidaySource = "china-timor" | "japan-holidays-jp";

export type HolidayDiagnostic = Readonly<{
  level: "warning" | "error";
  code: string;
  message: string;
}>;

export type DateCoverage = Readonly<{
  ranges: readonly DateRange[];
}>;

export type HolidayDataset = Readonly<{
  source: HolidaySource;
  entries: readonly HolidayEntry[];
  coverage: DateCoverage;
  diagnostics: readonly HolidayDiagnostic[];
}>;

export type HolidayIndex = ReadonlyMap<string, HolidayInfo>;

export function buildHolidayIndex(
  datasets: readonly HolidayDataset[],
): HolidayIndex;
```

- [ ] **Step 1: Create normalized holiday types**

Create `src/domain/holiday/types.ts` using the exact interfaces above.

The normalized model must contain no source-specific fields such as:

```text
wage
after
target
code
week
```

- [ ] **Step 2: Write failing index tests**

Create `holidayIndex.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildHolidayIndex } from "./holidayIndex";
import type { HolidayDataset } from "./types";

describe("buildHolidayIndex", () => {
  it("merges China and Japan information on the same date", () => {
    const china: HolidayDataset = {
      source: "china-timor",
      entries: [
        {
          date: { year: 2027, month: 1, day: 1 },
          info: {
            china: {
              type: "holiday",
              name: "元旦",
            },
          },
        },
      ],
      coverage: { ranges: [] },
      diagnostics: [],
    };

    const japan: HolidayDataset = {
      source: "japan-holidays-jp",
      entries: [
        {
          date: { year: 2027, month: 1, day: 1 },
          info: {
            japan: {
              name: "元日",
            },
          },
        },
      ],
      coverage: { ranges: [] },
      diagnostics: [],
    };

    const index = buildHolidayIndex([china, japan]);

    expect(index.get("2027-01-01")).toEqual({
      china: {
        type: "holiday",
        name: "元旦",
      },
      japan: {
        name: "元日",
      },
    });
  });
});
```

- [ ] **Step 3: Run test and confirm failure**

```bash
npm test -- src/domain/holiday/holidayIndex.test.ts
```

Expected:

```text
FAIL because buildHolidayIndex is not defined.
```

- [ ] **Step 4: Implement immutable-style merge by ISO date**

Implementation rule:

```ts
const current = index.get(key) ?? {};

index.set(key, {
  ...current,
  ...entry.info,
});
```

A China entry and Japan entry for the same day must coexist.

Do not carry `HolidayDataset.source` into `HolidayInfo`.

- [ ] **Step 5: Add test for separate dates**

Assert that two different dates create two Map entries and keys are strict zero-padded ISO dates.

- [ ] **Step 6: Run tests and build**

```bash
npm test -- src/domain/holiday/holidayIndex.test.ts
npm test
npm run build
```

Expected:

```text
Holiday index tests pass.
Build succeeds.
```

- [ ] **Step 7: Commit**

```bash
git add src/domain/holiday/types.ts src/domain/holiday/holidayIndex.ts src/domain/holiday/holidayIndex.test.ts
git commit -m "feat: add normalized holiday domain model"
```

---

# Task 3: Generate 4 / 5 / 6-week Calendar Months

**Files:**
- Create: `src/domain/calendar/types.ts`
- Create: `src/domain/calendar/generateCalendarMonth.ts`
- Create: `src/domain/calendar/generateCalendarMonth.test.ts`

**Interfaces:**
- Consumes:
  - `LocalDate`
  - `DayOfWeek`
  - `HolidayInfo`
  - `HolidayIndex`
  - date utilities
- Produces:

```ts
export type YearMonth = Readonly<{
  year: number;
  month: number;
}>;

export type CalendarCell = Readonly<{
  date: LocalDate;
  dayOfWeek: DayOfWeek;
  inCurrentMonth: boolean;
  holiday?: HolidayInfo;
}>;

export type CalendarWeek = readonly CalendarCell[];

export type CalendarMonth = Readonly<{
  year: number;
  month: number;
  weekCount: 4 | 5 | 6;
  weeks: readonly CalendarWeek[];
}>;

export function generateCalendarMonth(
  year: number,
  month: number,
  holidayIndex?: HolidayIndex,
): CalendarMonth;
```

- [ ] **Step 1: Create Calendar domain types**

Create `types.ts` using the exact interfaces above.

Do not add rendering fields such as:

```text
x
y
width
height
color
opacity
```

- [ ] **Step 2: Write failing 4-week month test**

February 2026 starts on Sunday and has 28 days.

```ts
import { describe, expect, it } from "vitest";
import { generateCalendarMonth } from "./generateCalendarMonth";

describe("generateCalendarMonth", () => {
  it("generates a 4-week month when 28 days start on Sunday", () => {
    const month = generateCalendarMonth(2026, 2);

    expect(month.weekCount).toBe(4);
    expect(month.weeks).toHaveLength(4);
    expect(month.weeks.flat()).toHaveLength(28);
    expect(month.weeks[0][0]).toMatchObject({
      date: { year: 2026, month: 2, day: 1 },
      dayOfWeek: 0,
      inCurrentMonth: true,
    });
  });
});
```

- [ ] **Step 3: Run test and confirm failure**

```bash
npm test -- src/domain/calendar/generateCalendarMonth.test.ts
```

Expected:

```text
FAIL because generateCalendarMonth is not defined.
```

- [ ] **Step 4: Implement week-count calculation**

Use:

```text
firstDayOfWeek = dayOfWeek({ year, month, day: 1 })
currentMonthDays = daysInMonth(year, month)

weekCount =
ceil((firstDayOfWeek + currentMonthDays) / 7)
```

Assert that the result is one of:

```text
4
5
6
```

Do not hardcode month-specific behavior.

- [ ] **Step 5: Write failing adjacent-date test**

Use January 2027, which starts on Friday:

```ts
it("fills leading and trailing cells with real adjacent dates", () => {
  const month = generateCalendarMonth(2027, 1);

  expect(month.weeks[0][0].date).toEqual({
    year: 2026,
    month: 12,
    day: 27,
  });

  expect(month.weeks[0][0].inCurrentMonth).toBe(false);

  const cells = month.weeks.flat();

  expect(cells.some((cell) =>
    cell.date.year === 2027 &&
    cell.date.month === 2 &&
    cell.inCurrentMonth === false
  )).toBe(true);
});
```

- [ ] **Step 6: Implement the complete rectangular grid**

Algorithm:

```text
firstOfMonth
→ subtract `firstDayOfWeek`
→ first visible Sunday

totalCells
= weekCount * 7

for index = 0 .. totalCells - 1
  date = addDays(firstVisibleDate, index)
```

Set:

```ts
inCurrentMonth =
  date.year === year &&
  date.month === month;
```

Set:

```ts
dayOfWeek = index % 7;
```

or compute using the date utility. Whichever method is used, test Sunday-first ordering explicitly.

- [ ] **Step 7: Add 5-week and 6-week cases**

Use deterministic examples:

```ts
expect(generateCalendarMonth(2027, 2).weekCount).toBe(5);
expect(generateCalendarMonth(2027, 5).weekCount).toBe(6);
```

Also assert every week has exactly 7 cells.

- [ ] **Step 8: Add normalized holiday enrichment test**

Create an index:

```ts
const holidays = new Map([
  [
    "2027-01-01",
    {
      china: { type: "holiday" as const, name: "元旦" },
      japan: { name: "元日" },
    },
  ],
]);
```

Assert that January 1 Cell contains this exact normalized holiday info.

Also attach a holiday to an adjacent-month date and assert that the adjacent Cell keeps the holiday info. This is required later by Main rendering.

- [ ] **Step 9: Validate month input**

`generateCalendarMonth(2027, 0)` and `(2027, 13)` must throw `RangeError`, reusing date-domain month validation behavior rather than silently normalizing.

- [ ] **Step 10: Run targeted and full tests**

```bash
npm test -- src/domain/calendar/generateCalendarMonth.test.ts
npm test
npm run build
```

Expected:

```text
4 / 5 / 6-week tests pass.
Adjacent-date tests pass.
Holiday enrichment tests pass.
Build succeeds.
```

- [ ] **Step 11: Commit**

```bash
git add src/domain/calendar
git commit -m "feat: generate calendar month grids"
```

---

# Task 4: Implement the Japan Holidays JP Adapter

**Files:**
- Create: `src/domain/holiday/adapters/japanHolidaysJpAdapter.ts`
- Create: `src/domain/holiday/adapters/japanHolidaysJpAdapter.test.ts`
- Modify: `package.json`
- Modify: lockfile

**Interfaces:**
- Consumes:
  - `parseISODate`
  - normalized Holiday types
- Produces:

```ts
export function parseJapanHolidaysJp(
  raw: unknown,
): HolidayDataset;
```

Expected source shape:

```ts
{
  "2027-01-01": "元日",
  "2027-01-11": "成人の日"
}
```

- [ ] **Step 1: Add Zod**

Run:

```bash
npm install zod
```

Expected:

```text
zod is added as a production dependency.
```

- [ ] **Step 2: Write the valid normalization test**

```ts
import { describe, expect, it } from "vitest";
import { parseJapanHolidaysJp } from "./japanHolidaysJpAdapter";

describe("parseJapanHolidaysJp", () => {
  it("normalizes date-name records", () => {
    const result = parseJapanHolidaysJp({
      "2027-01-01": "元日",
      "2027-05-03": "憲法記念日",
    });

    expect(result.source).toBe("japan-holidays-jp");
    expect(result.entries).toEqual([
      {
        date: { year: 2027, month: 1, day: 1 },
        info: { japan: { name: "元日" } },
      },
      {
        date: { year: 2027, month: 5, day: 3 },
        info: { japan: { name: "憲法記念日" } },
      },
    ]);

    expect(result.diagnostics).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test and confirm failure**

```bash
npm test -- src/domain/holiday/adapters/japanHolidaysJpAdapter.test.ts
```

Expected:

```text
FAIL because the adapter does not exist.
```

- [ ] **Step 4: Define the source schema**

Use a Zod record whose keys and values are strings:

```ts
const schema = z.record(z.string(), z.string());
```

After schema validation, validate every key with `parseISODate`.

Do not expose the Zod schema outside this adapter.

- [ ] **Step 5: Implement normalized entries in chronological order**

Sort input records by ISO date before producing `entries`.

Map:

```text
"2027-05-03": "憲法記念日"
```

to:

```ts
{
  date: { year: 2027, month: 5, day: 3 },
  info: {
    japan: {
      name: "憲法記念日",
    },
  },
}
```

- [ ] **Step 6: Define Japan source coverage**

The adapter is specifically for a complete `holidays-jp` date JSON dataset, not arbitrary hand-authored subsets.

For each distinct year present in valid keys, produce full calendar-year coverage:

```ts
{
  start: { year, month: 1, day: 1 },
  end: { year, month: 12, day: 31 },
}
```

If consecutive years are present, they may remain separate ranges in Phase 1; merging adjacent ranges is not required for correctness.

- [ ] **Step 7: Add invalid-shape test**

```ts
it("returns an error diagnostic for malformed source data", () => {
  const result = parseJapanHolidaysJp({
    "2027-01-01": 123,
  });

  expect(result.entries).toEqual([]);
  expect(result.coverage.ranges).toEqual([]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      level: "error",
      code: "invalid-japan-holidays-jp",
    }),
  ]);
});
```

Adapter errors must return a `HolidayDataset`; do not throw raw Zod errors into the future UI.

- [ ] **Step 8: Add invalid-date-key test**

Input:

```ts
{
  "2027-02-29": "存在しない日"
}
```

Expected:

```text
entries = []
coverage = []
error diagnostic code = "invalid-japan-holiday-date"
```

Fail the dataset rather than partially accepting it in Phase 1.

- [ ] **Step 9: Run targeted and full tests**

```bash
npm test -- src/domain/holiday/adapters/japanHolidaysJpAdapter.test.ts
npm test
npm run build
```

Expected:

```text
Japan adapter tests pass.
Rendering Spike tests remain green.
Build succeeds.
```

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/domain/holiday/adapters
git commit -m "feat: normalize japan holiday json"
```

If the project uses a lockfile other than `package-lock.json`, stage the actual lockfile instead.

---

# Task 5: Implement the China Timor Year Adapter

**Files:**
- Create: `src/domain/holiday/adapters/chinaTimorHolidayAdapter.ts`
- Create: `src/domain/holiday/adapters/chinaTimorHolidayAdapter.test.ts`

**Interfaces:**
- Consumes:
  - Zod
  - `parseISODate`
  - normalized Holiday types
- Produces:

```ts
export function parseChinaTimorHolidayYear(
  raw: unknown,
): HolidayDataset;
```

Expected source subset:

```ts
{
  code: 0,
  holiday: {
    "01-01": {
      holiday: true,
      name: "元旦",
      date: "2027-01-01"
    },
    "02-06": {
      holiday: false,
      name: "春节前补班",
      date: "2027-02-06"
    }
  }
}
```

Fields such as `wage`, `after`, `target`, and `rest` may exist and must be ignored by the normalized model.

- [ ] **Step 1: Write holiday/workday normalization test**

```ts
import { describe, expect, it } from "vitest";
import { parseChinaTimorHolidayYear } from "./chinaTimorHolidayAdapter";

describe("parseChinaTimorHolidayYear", () => {
  it("normalizes both holidays and makeup workdays", () => {
    const result = parseChinaTimorHolidayYear({
      code: 0,
      holiday: {
        "01-01": {
          holiday: true,
          name: "元旦",
          wage: 3,
          date: "2027-01-01",
        },
        "02-06": {
          holiday: false,
          name: "春节前补班",
          wage: 1,
          after: false,
          target: "春节",
          date: "2027-02-06",
        },
      },
    });

    expect(result.entries).toEqual([
      {
        date: { year: 2027, month: 1, day: 1 },
        info: {
          china: {
            type: "holiday",
            name: "元旦",
          },
        },
      },
      {
        date: { year: 2027, month: 2, day: 6 },
        info: {
          china: {
            type: "workday",
            name: "春节前补班",
          },
        },
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test and confirm failure**

```bash
npm test -- src/domain/holiday/adapters/chinaTimorHolidayAdapter.test.ts
```

Expected:

```text
FAIL because the Timor adapter does not exist.
```

- [ ] **Step 3: Define a permissive source schema**

Validate only fields needed by Monthloom:

```ts
const holidayItemSchema = z.object({
  holiday: z.boolean(),
  name: z.string().optional(),
  date: z.string(),
}).passthrough();

const timorYearSchema = z.object({
  code: z.number(),
  holiday: z.record(z.string(), holidayItemSchema),
}).passthrough();
```

`.passthrough()` is intentional because source fields irrelevant to Monthloom must not break imports.

- [ ] **Step 4: Handle Timor error codes explicitly**

If:

```text
code !== 0
```

return:

```text
entries = []
coverage.ranges = []
diagnostic:
  level = error
  code = "china-timor-error"
```

Do not normalize source data from an unsuccessful response.

- [ ] **Step 5: Normalize source items**

For every item:

```text
holiday === true
→ china.type = "holiday"

holiday === false
→ china.type = "workday"
```

Use the item's full `date` field as the canonical date, not the outer `"MM-DD"` key.

Sort final entries chronologically.

- [ ] **Step 6: Validate all item dates**

If any `date` is not strict valid ISO format, return an invalid-source diagnostic and no entries.

Diagnostic code:

```text
invalid-china-timor-date
```

- [ ] **Step 7: Define annual source coverage**

`parseChinaTimorHolidayYear` is specifically for Timor's `/api/holiday/year/{year}/` response semantics.

Collect the distinct years from normalized item `date` fields.

For each distinct year, declare:

```text
January 1 → December 31
```

coverage.

If `holiday` is empty, coverage cannot be inferred safely from the payload. Return:

```text
entries = []
coverage.ranges = []
warning diagnostic code = "china-timor-coverage-unresolved"
```

Do not guess the year from the current clock or target year.

- [ ] **Step 8: Add empty-response test**

```ts
it("does not invent coverage for an empty annual payload", () => {
  const result = parseChinaTimorHolidayYear({
    code: 0,
    holiday: {},
  });

  expect(result.entries).toEqual([]);
  expect(result.coverage.ranges).toEqual([]);
  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      level: "warning",
      code: "china-timor-coverage-unresolved",
    }),
  ]);
});
```

- [ ] **Step 9: Add malformed-shape test**

For:

```ts
{
  code: 0,
  holiday: {
    "01-01": {
      holiday: "yes",
      date: "2027-01-01",
    },
  },
}
```

expect:

```text
error diagnostic code = "invalid-china-timor"
```

with no normalized entries.

- [ ] **Step 10: Run targeted and full tests**

```bash
npm test -- src/domain/holiday/adapters/chinaTimorHolidayAdapter.test.ts
npm test
npm run build
```

Expected:

```text
China adapter tests pass.
All project tests pass.
Build succeeds.
```

- [ ] **Step 11: Commit**

```bash
git add src/domain/holiday/adapters/chinaTimorHolidayAdapter.ts src/domain/holiday/adapters/chinaTimorHolidayAdapter.test.ts
git commit -m "feat: normalize china holiday json"
```

---

# Task 6: Define Formal Month Sequences and the Actual Required Date Range

**Files:**
- Create: `src/domain/calendar/monthSequence.ts`
- Create: `src/domain/calendar/monthSequence.test.ts`

**Interfaces:**
- Consumes:
  - `YearMonth`
  - `DateRange`
  - `generateCalendarMonth`
  - date comparison/utilities
- Produces:

```ts
export function getMainMonths(targetYear: number): readonly YearMonth[];

export function getMiniMonths(targetYear: number): readonly YearMonth[];

export function getPreviewExtraMiniMonths(
  targetYear: number,
): readonly YearMonth[];

export function calculateRequiredHolidayRange(
  targetYear: number,
): DateRange;
```

- [ ] **Step 1: Write the Main month sequence test**

For `targetYear = 2027`:

```ts
expect(getMainMonths(2027)).toEqual([
  { year: 2027, month: 1 },
  { year: 2027, month: 2 },
  { year: 2027, month: 3 },
  { year: 2027, month: 4 },
  { year: 2027, month: 5 },
  { year: 2027, month: 6 },
  { year: 2027, month: 7 },
  { year: 2027, month: 8 },
  { year: 2027, month: 9 },
  { year: 2027, month: 10 },
  { year: 2027, month: 11 },
  { year: 2027, month: 12 },
  { year: 2028, month: 1 },
]);
```

Assert length:

```text
13
```

- [ ] **Step 2: Write the formal Mini sequence test**

For 2027:

```text
2026-12
2027-1 ... 2027-12
2028-1
```

Assert length:

```text
14
```

- [ ] **Step 3: Write the Preview-only extra Mini test**

For 2027:

```ts
expect(getPreviewExtraMiniMonths(2027)).toEqual([
  { year: 2028, month: 2 },
]);
```

This month is for Preview coverage only and must never be included in `getMiniMonths`.

- [ ] **Step 4: Run tests and confirm failure**

```bash
npm test -- src/domain/calendar/monthSequence.test.ts
```

Expected:

```text
FAIL because the month sequence functions do not exist.
```

- [ ] **Step 5: Implement month sequences directly and readably**

Do not build a generic recurrence framework.

A small loop from month `1` through `12` is sufficient.

- [ ] **Step 6: Write the required-range test for 2027**

The algorithm must derive the range from actual generated needs rather than return a hardcoded `Y-1 December → Y+1 February` formula.

For 2027, expected final result is:

```ts
expect(calculateRequiredHolidayRange(2027)).toEqual({
  start: { year: 2026, month: 12, day: 1 },
  end: { year: 2028, month: 2, day: 29 },
});
```

Why:

- Formal previous Mini requires all of December 2026.
- Main months contribute all visible adjacent dates.
- Formal Mini includes January 2028.
- Last Page Preview needs February 2028 Mini.
- February 2028 is leap-year February.

- [ ] **Step 7: Implement required-range derivation**

Collect required dates from three sources:

### Formal Main

For every month returned by `getMainMonths(targetYear)`:

```text
generateCalendarMonth(...)
→ include every visible Cell date
```

This captures Main adjacent-month dates automatically.

### Formal Mini

For every month returned by `getMiniMonths(targetYear)`:

```text
include first day of the month
include last day of the month
```

Mini does not render adjacent-month content.

### Preview-only Mini

For every month returned by `getPreviewExtraMiniMonths(targetYear)`:

```text
include first day of the month
include last day of the month
```

Then return:

```text
minimum required date
maximum required date
```

Do not encode December/February assumptions in `calculateRequiredHolidayRange`.

- [ ] **Step 8: Add non-leap next-year test**

For target year 2026:

```ts
expect(calculateRequiredHolidayRange(2026)).toEqual({
  start: { year: 2025, month: 12, day: 1 },
  end: { year: 2027, month: 2, day: 28 },
});
```

- [ ] **Step 9: Run targeted and full tests**

```bash
npm test -- src/domain/calendar/monthSequence.test.ts
npm test
npm run build
```

Expected:

```text
Month sequence tests pass.
Required range tests pass for leap and non-leap years.
Build succeeds.
```

- [ ] **Step 10: Commit**

```bash
git add src/domain/calendar/monthSequence.ts src/domain/calendar/monthSequence.test.ts
git commit -m "feat: calculate calendar output date range"
```

---

# Task 7: Detect Holiday Coverage Gaps and Produce Explicit Warnings

**Files:**
- Create: `src/domain/holiday/coverage.ts`
- Create: `src/domain/holiday/coverage.test.ts`

**Interfaces:**
- Consumes:
  - `DateRange`
  - `DateCoverage`
  - `HolidayDiagnostic`
  - `HolidaySource`
  - date utilities
- Produces:

```ts
export function isDateCovered(
  date: LocalDate,
  coverage: DateCoverage,
): boolean;

export function getUncoveredRanges(
  required: DateRange,
  coverage: DateCoverage,
): readonly DateRange[];

export function createCoverageDiagnostics(
  source: HolidaySource,
  required: DateRange,
  coverage: DateCoverage,
): readonly HolidayDiagnostic[];
```

- [ ] **Step 1: Write coverage membership test**

```ts
it("checks coverage across multiple ranges", () => {
  const coverage = {
    ranges: [
      {
        start: { year: 2026, month: 1, day: 1 },
        end: { year: 2026, month: 12, day: 31 },
      },
      {
        start: { year: 2027, month: 1, day: 1 },
        end: { year: 2027, month: 12, day: 31 },
      },
    ],
  };

  expect(
    isDateCovered({ year: 2026, month: 5, day: 1 }, coverage),
  ).toBe(true);

  expect(
    isDateCovered({ year: 2028, month: 1, day: 1 }, coverage),
  ).toBe(false);
});
```

- [ ] **Step 2: Run test and confirm failure**

```bash
npm test -- src/domain/holiday/coverage.test.ts
```

Expected:

```text
FAIL because coverage helpers do not exist.
```

- [ ] **Step 3: Implement `isDateCovered`**

A date is covered when it satisfies for any range:

```text
range.start <= date <= range.end
```

Use `compareDate`.

- [ ] **Step 4: Write uncovered contiguous-range test**

Required:

```text
2026-12-01 → 2028-02-29
```

Coverage:

```text
2027-01-01 → 2027-12-31
```

Expected gaps:

```text
2026-12-01 → 2026-12-31
2028-01-01 → 2028-02-29
```

- [ ] **Step 5: Implement gap detection with simple day iteration**

The required interval is only around 15 months for Monthloom.

Prefer the simplest reliable implementation:

```text
cursor = required.start
while cursor <= required.end:
  test coverage
  group adjacent uncovered days into ranges
  cursor = addDays(cursor, 1)
```

Do not build a complex interval tree.

- [ ] **Step 6: Add no-gap test**

If one or multiple coverage ranges collectively cover the required range, return:

```ts
[]
```

- [ ] **Step 7: Write diagnostic test**

For missing coverage, expect one warning per uncovered contiguous range:

```ts
const diagnostics = createCoverageDiagnostics(
  "japan-holidays-jp",
  required,
  coverage,
);

expect(diagnostics).toEqual([
  {
    level: "warning",
    code: "holiday-coverage-gap",
    message:
      "japan-holidays-jp holiday data does not cover 2026-12-01 through 2026-12-31.",
  },
  {
    level: "warning",
    code: "holiday-coverage-gap",
    message:
      "japan-holidays-jp holiday data does not cover 2028-01-01 through 2028-02-29.",
  },
]);
```

Use `toISODate` for message formatting.

- [ ] **Step 8: Implement coverage diagnostics**

Coverage diagnostics are warnings, not errors.

The renderer must later be allowed to render with incomplete data after the user has been clearly warned; Phase 1 only produces diagnostics and does not define UI behavior.

- [ ] **Step 9: Run targeted and full tests**

```bash
npm test -- src/domain/holiday/coverage.test.ts
npm test
npm run build
```

Expected:

```text
Coverage gap tests pass.
All existing tests pass.
Build succeeds.
```

- [ ] **Step 10: Commit**

```bash
git add src/domain/holiday/coverage.ts src/domain/holiday/coverage.test.ts
git commit -m "feat: detect holiday coverage gaps"
```

---

# Task 8: Verify the Complete Phase 1 Domain Flow

**Files:**
- Modify only if required by test setup: existing domain files
- Create: `src/domain/calendar/calendarDomain.integration.test.ts`

**Interfaces:**
- Consumes all Phase 1 public functions.
- Produces no new production abstraction.
- Validates the end-to-end domain flow:

```text
Raw Japan JSON ─┐
                ├→ HolidayDataset
Raw China JSON ─┘
        ↓
HolidayIndex
        ↓
CalendarMonth
        ↓
Required Holiday Range
        ↓
Coverage Diagnostics
```

- [ ] **Step 1: Write one production-domain integration test**

Use a deliberately small source fixture:

```ts
const japanRaw = {
  "2027-01-01": "元日",
};

const chinaRaw = {
  code: 0,
  holiday: {
    "01-01": {
      holiday: true,
      name: "元旦",
      date: "2027-01-01",
    },
    "02-06": {
      holiday: false,
      name: "春节前补班",
      date: "2027-02-06",
    },
  },
};
```

Parse both adapters, build the index, and generate January 2027.

Assert:

```text
January 1 has both China and Japan info.
February 6 exists in China dataset as workday.
Calendar still has correct adjacent dates.
```

- [ ] **Step 2: Assert coverage correctly warns for an intentionally incomplete dataset**

The fixture only establishes 2027 coverage.

Calculate:

```ts
const required = calculateRequiredHolidayRange(2027);
```

Run coverage diagnostics separately for China and Japan.

Assert warnings exist for the missing:

```text
2026 December
2028 January / February
```

The exact gap boundaries should come from the coverage functions, not hardcoded adapter behavior.

- [ ] **Step 3: Run the integration test**

```bash
npm test -- src/domain/calendar/calendarDomain.integration.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 4: Run the entire test suite**

```bash
npm test
```

Expected:

```text
All production domain tests pass.
All Rendering Spike tests still pass.
```

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected:

```text
TypeScript and Vite production build succeed.
```

- [ ] **Step 6: Inspect production dependency boundaries**

Search production domain code:

```bash
grep -R "react\|svg\|fontkit\|zustand\|dexie" src/domain || true
```

Expected:

```text
No production Calendar/Holiday domain dependency on React, SVG, fontkit, Zustand, or Dexie.
```

Search source-specific third-party names:

```bash
grep -R "wage\|after\|target" src/domain --exclude='*chinaTimorHolidayAdapter*' || true
```

Expected:

```text
Timor-only fields do not leak outside the Timor adapter/tests.
```

- [ ] **Step 7: Confirm Phase 1 scope**

The repository should now contain production implementations for exactly:

```text
LocalDate
Date utilities
CalendarMonth
4 / 5 / 6 week calculation
Adjacent dates
Holiday internal model
HolidayIndex
China Timor Adapter
Japan Holidays JP Adapter
Formal Main/Mini month sequences
Required holiday date range
Coverage gap calculation
Coverage warnings
```

It should not contain newly implemented production:

```text
SVG Renderer
Layout Engine
Template Editor
Page Preview
IndexedDB persistence
ZIP export
```

- [ ] **Step 8: Commit Phase 1 integration verification**

```bash
git add src/domain/calendar/calendarDomain.integration.test.ts
git commit -m "test: verify calendar domain integration"
```

---

# Phase 1 Acceptance Gate

Do not move to Phase 2 — Template + Layout Engine until all items below pass.

## Date Domain

- [ ] `LocalDate` is the public date representation.
- [ ] Month/day validation rejects impossible dates.
- [ ] Leap years are correct.
- [ ] All JavaScript `Date` arithmetic is UTC-based and private to the date module.
- [ ] ISO serialization is strict and deterministic.
- [ ] No public domain API returns JavaScript `Date`.

## Calendar Core

- [ ] Sunday is column 0.
- [ ] 4-week months are supported.
- [ ] 5-week months are supported.
- [ ] 6-week months are supported.
- [ ] Every week contains exactly 7 Cells.
- [ ] Adjacent previous-month dates are real dates.
- [ ] Adjacent next-month dates are real dates.
- [ ] `inCurrentMonth` is correct.
- [ ] Adjacent Cells can retain normalized holiday information.
- [ ] Calendar Core contains no rendering concepts.

## Holiday Normalization

- [ ] Japan `{ "YYYY-MM-DD": "name" }` data normalizes correctly.
- [ ] Timor `holiday: true` becomes China `holiday`.
- [ ] Timor `holiday: false` becomes China `workday`.
- [ ] Timor-only fields do not leak into normalized models.
- [ ] Invalid third-party JSON produces diagnostics rather than raw parser exceptions.
- [ ] China and Japan data can coexist on one date in `HolidayIndex`.

## Output Month Scope

- [ ] Main sequence contains exactly 13 months.
- [ ] Formal Mini sequence contains exactly 14 months.
- [ ] Next-year February is Preview-only.
- [ ] Required holiday range is derived from actual generated needs.
- [ ] Leap-year next February is handled correctly.

## Coverage

- [ ] Coverage is explicit.
- [ ] Missing map entries are not interpreted as proof of complete coverage.
- [ ] Gaps can be detected across multiple coverage ranges.
- [ ] Coverage diagnostics identify exact missing date intervals.
- [ ] Monthloom does not infer or invent missing holiday values.

## Verification

- [ ] All Phase 1 unit tests pass.
- [ ] Phase 1 integration test passes.
- [ ] Rendering Spike tests remain green.
- [ ] `npm run build` succeeds.
- [ ] Production domain code does not depend on React/SVG/fontkit/editor/persistence modules.

## Decision

If all acceptance items pass:

```text
Phase 1 — Calendar Domain
→ ACCEPT
→ Proceed to Phase 2 — Template + Layout Engine
```

If any calendar, date, adapter, or coverage invariant fails:

```text
Phase 1
→ REJECT
→ Fix the domain behavior before introducing Layout/SVG concerns
```
