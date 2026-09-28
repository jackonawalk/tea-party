export type SavedRow = {
  id: string
  name: string
  placeholder: string
  records: string
  generatedFor?: string
  linkedProjectId?: string
  generatedName?: string
  generatedRecords?: string
  description?: string
  bubbleColor?: string
}

export type SavedForm = {
  sources: SavedRow[]
  projects: SavedRow[]
  nextSourceId: number
  nextProjectId: number
}

const optionalKeys = [
  "generatedFor",
  "linkedProjectId",
  "generatedName",
  "generatedRecords",
  "description",
  "bubbleColor",
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCount(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null
  }

  return value
}

function readRow(value: unknown): SavedRow | null {
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null
  }
  if (typeof value.name !== "string" || typeof value.placeholder !== "string") {
    return null
  }
  if (typeof value.records !== "string") {
    return null
  }

  const row: SavedRow = {
    id: value.id,
    name: value.name,
    placeholder: value.placeholder,
    records: value.records,
  }

  for (const key of optionalKeys) {
    const field = value[key]
    if (field === undefined) {
      continue
    }
    if (typeof field !== "string") {
      return null
    }
    if (field !== "") {
      row[key] = field
    }
  }

  return row
}

function readRows(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    return null
  }

  const rows: SavedRow[] = []
  for (const item of value) {
    const row = readRow(item)
    if (!row) {
      return null
    }
    rows.push(row)
  }

  return rows
}

export function parseSavedForm(value: unknown): SavedForm | null {
  if (!isRecord(value)) {
    return null
  }

  const sources = readRows(value.sources)
  const projects = readRows(value.projects)
  const nextSourceId = readCount(value.nextSourceId)
  const nextProjectId = readCount(value.nextProjectId)
  if (!sources || !projects || nextSourceId === null || nextProjectId === null) {
    return null
  }

  return { sources, projects, nextSourceId, nextProjectId }
}
