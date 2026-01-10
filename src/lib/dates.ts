import { format } from 'date-fns'
import type { DatePrecision, FlexibleDate } from '@/types'

export function formatFlexibleDate(d: FlexibleDate): string {
  if (!d.date || d.precision === 'unknown') return 'Unknown'

  const date = new Date(d.date)

  switch (d.precision) {
    case 'circa':
      return `c. ${date.getFullYear()}`
    case 'range':
      if (d.endDate) {
        return `${date.getFullYear()}–${new Date(d.endDate).getFullYear()}`
      }
      return `${date.getFullYear()}–?`
    case 'year':
      return date.getFullYear().toString()
    case 'month':
      return format(date, 'MMMM yyyy')
    case 'exact':
    default:
      return format(date, 'd MMMM yyyy')
  }
}

export function parseFlexibleDateInput(
  value: string
): Partial<FlexibleDate> | null {
  if (!value.trim()) return null

  const trimmed = value.trim().toLowerCase()

  // Circa: "c. 1880", "circa 1880", "~1880"
  const circaMatch = trimmed.match(/^(?:c\.?\s*|circa\s*|~)(\d{4})$/)
  if (circaMatch) {
    return {
      date: `${circaMatch[1]}-01-01`,
      precision: 'circa',
    }
  }

  // Range: "1880-1885", "1880–1885", "between 1880 and 1885"
  const rangeMatch = trimmed.match(
    /^(?:between\s+)?(\d{4})[\s–-]+(?:and\s+)?(\d{4})$/
  )
  if (rangeMatch) {
    return {
      date: `${rangeMatch[1]}-01-01`,
      endDate: `${rangeMatch[2]}-01-01`,
      precision: 'range',
    }
  }

  // Year only: "1880"
  const yearMatch = trimmed.match(/^(\d{4})$/)
  if (yearMatch) {
    return {
      date: `${yearMatch[1]}-01-01`,
      precision: 'year',
    }
  }

  // Month year: "March 1880", "Mar 1880", "3/1880"
  const monthYearMatch = trimmed.match(
    /^([a-z]+|\d{1,2})[\s/]+(\d{4})$/
  )
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1]
    const year = monthYearMatch[2]
    const month = parseMonth(monthStr)
    if (month !== null) {
      return {
        date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        precision: 'month',
      }
    }
  }

  // Full date: "12 March 1880", "1880-03-12", "12/3/1880"
  // Try ISO format first
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return {
      date: trimmed,
      precision: 'exact',
    }
  }

  // Try d/m/yyyy or m/d/yyyy (assume d/m for ambiguous)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, a, b, year] = slashMatch
    const day = parseInt(a)
    const month = parseInt(b)
    // Assume day/month/year format
    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      precision: 'exact',
    }
  }

  // Try "12 March 1880" format
  const fullMatch = trimmed.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/)
  if (fullMatch) {
    const [, day, monthStr, year] = fullMatch
    const month = parseMonth(monthStr)
    if (month !== null) {
      return {
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`,
        precision: 'exact',
      }
    }
  }

  return null
}

function parseMonth(str: string): number | null {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]
  const shortMonths = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ]

  const lower = str.toLowerCase()

  // Try number
  const num = parseInt(lower)
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return num - 1
  }

  // Try full name
  const fullIndex = months.findIndex(m => m.startsWith(lower))
  if (fullIndex !== -1) return fullIndex

  // Try short name
  const shortIndex = shortMonths.indexOf(lower)
  if (shortIndex !== -1) return shortIndex

  return null
}

export function getDatePrecisionLabel(precision: DatePrecision): string {
  switch (precision) {
    case 'exact':
      return 'Exact date'
    case 'year':
      return 'Year only'
    case 'month':
      return 'Month and year'
    case 'circa':
      return 'Approximate (circa)'
    case 'range':
      return 'Date range'
    case 'unknown':
    default:
      return 'Unknown'
  }
}
