const recordsPerMillion = 1_000_000

export const pricePerMillion = 50
export const automationPricePerMillion = 500
export const daysInMonth = 30

export type UsageRow = {
  name: string
  recordsInMillions: number
}

export type PricedRow = {
  name: string
  recordsInMillions: number
  records: number
  amount: number
}

export type QuoteInput = {
  totalRecords: number
  projectRecords: number
}

export type Quote = {
  totalRecords: number
  projectRecords: number
  sourceAmount: number
  projectAmount: number
  monthlyTotal: number
}

export type PricedQuote = {
  currency: "USD"
  pricePerMillion: number
  daysInMonth: number
  sources: PricedRow[]
  projects: PricedRow[]
  sourceRecords: number
  sourceAmount: number
  projectRecords: number
  projectAmount: number
  automations: PricedRow[]
  automationRecords: number
  automationAmount: number
  automationPricePerMillion: number
  monthlyTotal: number
}

function priceForRecords(records: number, rate: number) {
  return (records / recordsPerMillion) * rate
}

export function quote(input: QuoteInput): Quote {
  const sourceAmount = priceForRecords(input.totalRecords, pricePerMillion)
  const projectAmount = priceForRecords(input.projectRecords, pricePerMillion)

  return {
    totalRecords: input.totalRecords,
    projectRecords: input.projectRecords,
    sourceAmount,
    projectAmount,
    monthlyTotal: sourceAmount + projectAmount,
  }
}

function priceRows(
  rows: UsageRow[],
  dayMultiplier: number,
  rate: number,
): PricedRow[] {
  return rows.map((row) => {
    const records = row.recordsInMillions * recordsPerMillion * dayMultiplier

    return {
      name: row.name,
      recordsInMillions: row.recordsInMillions,
      records,
      amount: priceForRecords(records, rate),
    }
  })
}

export function priceUsage(input: {
  sources: UsageRow[]
  projects: UsageRow[]
  automations: UsageRow[]
}): PricedQuote {
  const sources = priceRows(input.sources, 1, pricePerMillion)
  const projects = priceRows(input.projects, daysInMonth, pricePerMillion)
  const automations = priceRows(input.automations, 1, automationPricePerMillion)
  const sourceRecords = sources.reduce((sum, row) => sum + row.records, 0)
  const projectRecords = projects.reduce((sum, row) => sum + row.records, 0)
  const automationRecords = automations.reduce((sum, row) => sum + row.records, 0)
  const priced = quote({ totalRecords: sourceRecords, projectRecords })
  const automationAmount = automations.reduce((sum, row) => sum + row.amount, 0)

  return {
    currency: "USD",
    pricePerMillion,
    automationPricePerMillion,
    daysInMonth,
    sources,
    projects,
    automations,
    sourceRecords: priced.totalRecords,
    sourceAmount: priced.sourceAmount,
    projectRecords: priced.projectRecords,
    projectAmount: priced.projectAmount,
    automationRecords,
    automationAmount,
    monthlyTotal: priced.monthlyTotal + automationAmount,
  }
}
