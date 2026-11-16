import type { PricedQuote } from "@/lib/pricing"

// Rough estimate of running a Fivetran + Snowflake stack with an in-house data
// engineer to do similar work. Prices are public or widely reported US list
// prices as of late 2026 and change often. Every assumption lives here so it
// is easy to adjust.

const monthsInYear = 12
const million = 1_000_000

// Fivetran Standard plan. Each source is one connection, and a source's
// monthly records are treated as its monthly active rows (MAR). Rates are per
// million MAR within each band, applied per connection.
const fivetranMinimumPerConnection = 5
const fivetranBands = [
  { upTo: 1 * million, perMillion: 495 },
  { upTo: 4 * million, perMillion: 170 },
  { upTo: Infinity, perMillion: 58 },
]

// Snowflake Enterprise on AWS US East, on demand.
const snowflakePerCredit = 3
const snowflakeStoragePerTbMonth = 23
// An X-Small warehouse (1 credit an hour) running 2 hours a day for loads and
// refreshes, plus 1 credit for every 10 million records loaded or processed.
const snowflakeBaseCreditsPerMonth = 2 * 30
const snowflakeRecordsPerCredit = 10 * million
// About 1 KB stored per synced record.
const snowflakeBytesPerRecord = 1_000
const bytesPerTb = 1e12

// Data engineer at $120k a year. Staffing is a guess built from time to
// maintain each source pipeline and each project's models, plus time that
// grows with the records processed. The total is rounded up to the nearest
// tenth of a full-time engineer, with a minimum of 0.2.
const engineerAnnualComp = 120_000
const engineerMinimumFte = 0.2
const engineerFtePerSource = 0.1
const engineerFtePerProject = 0.05
const engineerFtePer50MRecords = 0.25
const engineerFteStepsPerFte = 10

function engineerFte(estimate: PricedQuote) {
  const processedRecords = estimate.sourceRecords + estimate.projectRecords
  const fte =
    estimate.sources.length * engineerFtePerSource +
    estimate.projects.length * engineerFtePerProject +
    (processedRecords / (50 * million)) * engineerFtePer50MRecords
  // The small offset keeps float noise such as 0.30000000000000004 from
  // rounding up a whole step.
  const rounded =
    Math.ceil(fte * engineerFteStepsPerFte - 1e-9) / engineerFteStepsPerFte
  return Math.max(engineerMinimumFte, rounded)
}

const fteFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

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
  return Math.max(fivetranMinimumPerConnection, cost)
}

export function compareStack(estimate: PricedQuote): Comparison {
  const fivetranMonthly = estimate.sources.reduce(
    (sum, source) => sum + fivetranConnectionMonthly(source.records),
    0,
  )

  const processedRecords = estimate.sourceRecords + estimate.projectRecords
  const snowflakeCredits =
    snowflakeBaseCreditsPerMonth + processedRecords / snowflakeRecordsPerCredit
  const storageTb = (estimate.sourceRecords * snowflakeBytesPerRecord) / bytesPerTb
  const snowflakeMonthly =
    snowflakeCredits * snowflakePerCredit + storageTb * snowflakeStoragePerTbMonth

  const fte = engineerFte(estimate)

  const lines: CompareLine[] = [
    {
      name: "Fivetran",
      annualPrice: Math.round(fivetranMonthly * monthsInYear),
      hint: "Standard plan. Each source is one connection, with its monthly records counted as monthly active rows.",
    },
    {
      name: "Snowflake",
      annualPrice: Math.round(snowflakeMonthly * monthsInYear),
      hint: "Enterprise edition at $3 per credit. An X-Small warehouse running 2 hours a day, plus compute for the records processed.",
    },
    {
      name: "Data Engineer",
      annualPrice: Math.round(fte * engineerAnnualComp),
      hint: `About ${fteFormat.format(fte)} full-time ${fte === 1 ? "engineer" : "engineers"} at $120,000 a year, to run the stack, maintain each source and project, and handle the data volume.`,
    },
  ]

  return {
    lines,
    annualTotal: lines.reduce((sum, line) => sum + line.annualPrice, 0),
  }
}
