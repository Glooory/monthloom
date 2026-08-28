# Holiday Library and Formats

Monthloom provides a persistent **Global Holiday Library** stored in your browser's IndexedDB, decoupled from individual project templates. Templates bind to calendars via dynamic **Holiday Layers**.

## 1. Monthloom Holiday Calendar JSON (`monthloom-holidays` v1)

Monthloom supports export and import of individual holiday calendars, base records, and coverage ranges using its native exchange format.

### Schema Structure
```json
{
  "format": "monthloom-holidays",
  "version": 1,
  "calendar": {
    "id": "builtin-cn-public-holidays",
    "name": "中国法定节假日"
  },
  "records": [
    {
      "date": "2027-01-01",
      "type": "holiday",
      "name": "元旦"
    },
    {
      "date": "2027-02-06",
      "type": "workday",
      "name": "春节调休"
    }
  ],
  "coverage": [
    {
      "start": "2027-01-01",
      "end": "2027-12-31",
      "status": "confirmed"
    }
  ]
}
```

## 2. Third-Party Provider JSON Formats

You can directly sync or import third-party datasets into existing or new calendars:

### China Holiday JSON (Timor / NianJia Format)
```json
{
  "holiday": {
    "01-01": { "holiday": true, "name": "元旦", "wage": 3, "date": "2027-01-01" },
    "02-06": { "holiday": false, "name": "春节调休", "wage": 1, "date": "2027-02-06", "target": "春节" },
    "02-07": { "holiday": true, "name": "除夕", "wage": 2, "date": "2027-02-07" },
    "02-08": { "holiday": true, "name": "初一", "wage": 3, "date": "2027-02-08" }
  }
}
```

### Japan Holiday JSON (Holidays JP Format)
```json
{
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2027-01-01": "元日"
}
```

## 3. Manual Overrides and Effective Records

Monthloom allows you to edit or add manual overrides for any date in a calendar.
- Overrides with `kind: "upsert"` create or replace records for a specific date (holiday or workday).
- Overrides with `kind: "delete"` create tombstones that suppress base provider records (e.g. removing a holiday).
- Local manual overrides always take precedence over synced or imported base records.

## 4. Coverage Requirements and Diagnostics

For target year $Y$, Monthloom monitors required holiday coverage spanning $Y-1$ December through $Y+1$ February (15 months). Missing dates in confirmed coverage ranges trigger non-blocking diagnostics in the workspace.
