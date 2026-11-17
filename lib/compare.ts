import type { PricedQuote } from "@/lib/pricing"

// Rough estimate of running a Fivetran + Snowflake + Tableau stack with an
// in-house data engineer to do similar work. Prices are public or widely reported US list
// prices as of late 2026 and change often. Every assumption lives here so it
// is easy to adjust.

const monthsInYear = 12
const million = 1_000_000

// Fivetran Standard plan. Each source is one connection, and a source's
// monthly records are treated as its monthly active rows (MAR). Each active
// connection pays a $5 base plus a per-million rate within each band, so 1M
// MAR is $500, 4M is $1,010, 16M is $1,706, and 64M is $2,651.60. Bands apply
// per connection and are not pooled across connections.
const fivetranBasePerConnection = 5
const fivetranBands = [
  { upTo: 1 * million, perMillion: 495 },
  { upTo: 4 * million, perMillion: 170 },
  { upTo: 16 * million, perMillion: 58 },
  { upTo: 64 * million, perMillion: 19.7 },
  { upTo: Infinity, perMillion: 6.72 },
]

// Snowflake Enterprise on AWS US East, on demand.
const snowflakePerCredit = 3
const snowflakeStoragePerTbMonth = 23
// An X-Small warehouse uses 1 credit an hour. Frequent Fivetran syncs and
// hourly refreshes keep waking it, so it is assumed to run 2 hours a day plus
// half an hour a day for each source connection.
const snowflakeCreditsPerHour = 1
const snowflakeBaseHoursPerDay = 2
const snowflakeHoursPerSourcePerDay = 0.5
const snowflakeDaysPerMonth = 30
// Transformations behind dashboards (joins, deduping, aggregations) cost 1
// credit for every 5 million records loaded or refreshed. Projects refresh
// hourly, so the warehouse reprocesses their records 24 times a day. Project
// records in the estimate are already counted once per day.
const snowflakeRecordsPerCredit = 5 * million
const snowflakeProjectRefreshesPerDay = 24
// About 1 KB stored per synced record, with 12 months of history kept.
const snowflakeBytesPerRecord = 1_000
const snowflakeMonthsOfHistory = 12
const bytesPerTb = 1e12

// Tableau at a blended $600 per user a year. List prices are $75 (Creator),
// $42 (Explorer), and $15 (Viewer) per user a month, billed annually.
const tableauPerUserYear = 600
// Fixed user count for now; the calculator does not ask for users yet.
const tableauUsers = 5

// Data engineer: a flat 0.2 of a full-time engineer at $120k a year.
const engineerAnnualComp = 120_000
const engineerFte = 0.2

export type CompareLine = {
  name: string
  annualPrice: number
  hint: string
}

export type Comparison = {
  lines: CompareLine[]
  annualTotal: number
}

function fivetranConnectionMonthly(records: number) {
  if (records <= 0) {
    return 0
  }
  let remaining = records
  let floor = 0
  let cost = 0
  for (const band of fivetranBands) {
    const inBand = Math.min(remaining, band.upTo - floor)
    cost += (inBand / million) * band.perMillion
    remaining -= inBand
    floor = band.upTo
    if (remaining <= 0) {
      break
    }
  }
  return fivetranBasePerConnection + cost
}

export function compareStack(estimate: PricedQuote): Comparison {
  const fivetranMonthly = estimate.sources.reduce(
    (sum, source) => sum + fivetranConnectionMonthly(source.records),
    0,
  )

  const processedRecords =
    estimate.sourceRecords +
    estimate.projectRecords * snowflakeProjectRefreshesPerDay
  const snowflakeHoursPerDay =
    snowflakeBaseHoursPerDay +
    estimate.sources.length * snowflakeHoursPerSourcePerDay
  const snowflakeCredits =
    snowflakeHoursPerDay * snowflakeDaysPerMonth * snowflakeCreditsPerHour +
    processedRecords / snowflakeRecordsPerCredit
  const storageTb =
    (estimate.sourceRecords *
      snowflakeMonthsOfHistory *
      snowflakeBytesPerRecord) /
    bytesPerTb
  const snowflakeMonthly =
    snowflakeCredits * snowflakePerCredit + storageTb * snowflakeStoragePerTbMonth

  const lines: CompareLine[] = [
    {
      name: "Fivetran",
      annualPrice: Math.round(fivetranMonthly * monthsInYear),
      hint: "Standard plan. Each source is one connection, with its monthly records counted as monthly active rows.",
    },
    {
      name: "Snowflake",
      annualPrice: Math.round(snowflakeMonthly * monthsInYear),
      hint: "Enterprise edition at $3 per credit. An X-Small warehouse running 2 hours a day plus 30 minutes per source, compute for hourly project refreshes, and a year of stored history.",
    },
    {
      name: "Tableau",
      annualPrice: tableauUsers * tableauPerUserYear,
      hint: "5 users at a blended $600 per user a year, mixing Creator, Explorer, and Viewer seats.",
    },
    {
      name: "Data Engineer",
      annualPrice: Math.round(engineerFte * engineerAnnualComp),
      hint: "0.2 of a full-time engineer at $120,000 a year, to run and maintain the stack.",
    },
  ]

  return {
    lines,
    annualTotal: lines.reduce((sum, line) => sum + line.annualPrice, 0),
  }
}
