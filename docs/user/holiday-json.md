# Holiday JSON Formats and Usage

Monthloom supports official holiday and workday override data for China and Japan through standard JSON datasets.

## 1. China Holiday JSON Format

Monthloom accepts JSON files adhering to the Timor / NianJia holiday format (e.g. `2026.json`, `2027.json`).

### Structure Example
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

- `holiday: true`: Marked as official public holiday (treated as holiday styling/rules).
- `holiday: false`: Marked as official workday transfer / compensatory working day (treated as working day even if falling on a weekend).

## 2. Japan Holiday JSON Format

Monthloom accepts JSON files following the Holidays JP format (key-value mapping of date strings to holiday names, e.g. `ja.json`).

### Structure Example
```json
{
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2027-01-01": "元日"
}
```

## Coverage Requirements and Diagnostics

For a target year $Y$, Monthloom displays and renders calendar months spanning from:
- **$Y-1$ December** (First Mini month)
- through **$Y+1$ February** (Last Mini month)

The **Holiday Coverage Diagnostics** component monitors your imported holiday datasets and warns you if dates within this 15-month span are missing. Monthloom will never guess or extrapolate missing holiday rules.
