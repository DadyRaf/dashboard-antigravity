import { Select } from "./select"

export type DateRangePreset = "24h" | "7d" | "30d" | "90d" | "all"

const PRESET_LABELS: Record<DateRangePreset, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
}

const PRESET_HOURS: Record<DateRangePreset, number | null> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
  all: null,
}

interface DateRangePickerProps {
  value: DateRangePreset
  onChange: (preset: DateRangePreset) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <Select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value as DateRangePreset)}
    >
      {(Object.keys(PRESET_LABELS) as DateRangePreset[]).map((preset) => (
        <option key={preset} value={preset}>
          {PRESET_LABELS[preset]}
        </option>
      ))}
    </Select>
  )
}

export function presetToISO(preset: DateRangePreset): string | null {
  const hours = PRESET_HOURS[preset]
  if (hours === null) return null
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)
  return since.toISOString()
}
