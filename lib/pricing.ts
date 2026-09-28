const recordsPerMillion = 1_000_000

export const pricePerMillion = 50
export const automationPricePerMillion = 500
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
  amount: number
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
  whiteGlove: boolean
  whiteGloveRate: number
  whiteGloveAmount: number
  monthlyTotal: number
}

function priceForRecords(records: number, rate: number) {
  return (records / recordsPerMillion) * rate
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
  whiteGlove: boolean
}): PricedQuote {
  const sources = priceRows(input.sources, 1, pricePerMillion)
  const projects = priceRows(input.projects, daysInMonth, pricePerMillion)
  const automations = priceRows(input.automations, 1, automationPricePerMillion)
  const sourceRecords = sources.reduce((sum, row) => sum + row.records, 0)
  const projectRecords = projects.reduce((sum, row) => sum + row.records, 0)
  const automationRecords = automations.reduce((sum, row) => sum + row.records, 0)
  const sourceAmount = priceForRecords(sourceRecords, pricePerMillion)
  const projectAmount = priceForRecords(projectRecords, pricePerMillion)
  const automationAmount = automations.reduce((sum, row) => sum + row.amount, 0)
  const spend = sourceAmount + projectAmount + automationAmount
  const whiteGloveAmount = input.whiteGlove ? spend * whiteGloveRate : 0

  return {
    currency: "USD",
    pricePerMillion,
    automationPricePerMillion,
    daysInMonth,
    sources,
    projects,
    automations,
    sourceRecords,
    sourceAmount,
    projectRecords,
    projectAmount,
    automationRecords,
    automationAmount,
    whiteGlove: input.whiteGlove,
    whiteGloveRate,
    whiteGloveAmount,
    monthlyTotal: spend + whiteGloveAmount,
  }
}
