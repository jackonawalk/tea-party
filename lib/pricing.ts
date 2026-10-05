const recordsPerMillion = 1_000_000

// One credit is 1M rows, and sources and projects share the same rate.
export const pricePerCredit = 50
export const minimumCredits = 1
export const whiteGloveRate = 0.2
export const daysInMonth = 30

export type UsageRow = {
  name: string
  recordsInMillions: number
}

export type PricedRow = {
  name: string
  recordsInMillions: number
  records: number
}

export type PricedQuote = {
  currency: "USD"
  pricePerCredit: number
  daysInMonth: number
  sources: PricedRow[]
  projects: PricedRow[]
  automations: PricedRow[]
  sourceRecords: number
  projectRecords: number
  automationRecords: number
  credits: number
  creditAmount: number
  whiteGlove: boolean
  whiteGloveRate: number
  whiteGloveAmount: number
  monthlyTotal: number
}

function toRows(rows: UsageRow[], dayMultiplier: number): PricedRow[] {
  return rows.map((row) => ({
    name: row.name,
    recordsInMillions: row.recordsInMillions,
    records: row.recordsInMillions * recordsPerMillion * dayMultiplier,
  }))
}

function sumRecords(rows: PricedRow[]) {
  return rows.reduce((sum, row) => sum + row.records, 0)
}

export function priceUsage(input: {
  sources: UsageRow[]
  projects: UsageRow[]
  automations: UsageRow[]
  whiteGlove: boolean
}): PricedQuote {
  // Projects are measured daily, so their records count once per day of the month.
  const sources = toRows(input.sources, 1)
  const projects = toRows(input.projects, daysInMonth)
  const automations = toRows(input.automations, 1)
  const sourceRecords = sumRecords(sources)
  const projectRecords = sumRecords(projects)
  // Automations are not billed yet, so they are left out of credits.
  const credits = Math.max(
    minimumCredits,
    Math.ceil((sourceRecords + projectRecords) / recordsPerMillion),
  )
  const creditAmount = credits * pricePerCredit
  const whiteGloveAmount = input.whiteGlove ? creditAmount * whiteGloveRate : 0

  return {
    currency: "USD",
    pricePerCredit,
    daysInMonth,
    sources,
    projects,
    automations,
    sourceRecords,
    projectRecords,
    automationRecords: sumRecords(automations),
    credits,
    creditAmount,
    whiteGlove: input.whiteGlove,
    whiteGloveRate,
    whiteGloveAmount,
    monthlyTotal: creditAmount + whiteGloveAmount,
  }
}
