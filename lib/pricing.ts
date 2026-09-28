const recordsPerMillion = 1_000_000

export const pricePerMillion = 50
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
  monthlyTotal: number
}

function priceForRecords(records: number) {
  return (records / recordsPerMillion) * pricePerMillion
}

export function quote(input: QuoteInput): Quote {
  const sourceAmount = priceForRecords(input.totalRecords)
  const projectAmount = priceForRecords(input.projectRecords)

  return {
    totalRecords: input.totalRecords,
    projectRecords: input.projectRecords,
    sourceAmount,
    projectAmount,
    monthlyTotal: sourceAmount + projectAmount,
  }
}

function priceRows(rows: UsageRow[], dayMultiplier: number): PricedRow[] {
  return rows.map((row) => {
    const records = row.recordsInMillions * recordsPerMillion * dayMultiplier

    return {
      name: row.name,
      recordsInMillions: row.recordsInMillions,
      records,
      amount: priceForRecords(records),
    }
  })
}

export function priceUsage(input: {
  sources: UsageRow[]
  projects: UsageRow[]
}): PricedQuote {
  const sources = priceRows(input.sources, 1)
  const projects = priceRows(input.projects, daysInMonth)
  const sourceRecords = sources.reduce((sum, row) => sum + row.records, 0)
  const projectRecords = projects.reduce((sum, row) => sum + row.records, 0)
  const priced = quote({ totalRecords: sourceRecords, projectRecords })

  return {
    currency: "USD",
    pricePerMillion,
    daysInMonth,
    sources,
    projects,
    sourceRecords: priced.totalRecords,
    sourceAmount: priced.sourceAmount,
    projectRecords: priced.projectRecords,
    projectAmount: priced.projectAmount,
    monthlyTotal: priced.monthlyTotal,
  }
}
