export type QuoteInput = {
  totalRecords: number
  projectRecords: number
  projects: number
}

export type QuoteLine = {
  label: string
  amount: number
}

export type Quote = {
  totalRecords: number
  projectRecords: number
  projects: number
  lines: QuoteLine[]
  monthlyTotal: number
}

export function quote(input: QuoteInput): Quote {
  return {
    totalRecords: input.totalRecords,
    projectRecords: input.projectRecords,
    projects: input.projects,
    lines: [],
    monthlyTotal: 0,
  }
}
