export type GeneratedKind = "project" | "automation"

export type GeneratedLink = {
  sourceName: string
  linkedId: string
  name: string
  records: string
}

export type SavedRow = {
  id: string
  name: string
  placeholder: string
  records: string
  generated?: Partial<Record<GeneratedKind, GeneratedLink>>
  description?: string
  diagram?: string
  diagramHidden?: boolean
  bubbleColor?: string
}

export const defaultQuoteTitle = "Pricing calculator"

export type SavedForm = {
  title: string
  sources: SavedRow[]
  projects: SavedRow[]
  automations: SavedRow[]
  nextSourceId: number
  nextProjectId: number
  nextAutomationId: number
  whiteGlove: boolean
}

const optionalKeys = ["description", "diagram", "bubbleColor"] as const

const generatedKinds: GeneratedKind[] = ["project", "automation"]

const legacyLinkKeys: Record<
  GeneratedKind,
  { sourceName: string; linkedId: string; name: string; records: string }
> = {
  project: {
    sourceName: "generatedFor",
    linkedId: "linkedProjectId",
    name: "generatedName",
    records: "generatedRecords",
  },
  automation: {
    sourceName: "generatedAutomationFor",
    linkedId: "linkedAutomationId",
    name: "generatedAutomationName",
    records: "generatedAutomationRecords",
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCount(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null
  }

  return value
}

function readLink(value: unknown): GeneratedLink | null | undefined {
  if (!isRecord(value)) {
    return null
  }

  const sourceName = value.sourceName
  const linkedId = value.linkedId
  const name = value.name
  const records = value.records
  const fields = [sourceName, linkedId, name, records]
  if (fields.every((field) => field === undefined || field === "")) {
    return undefined
  }
  if (
    typeof sourceName !== "string" ||
    typeof linkedId !== "string" ||
    typeof name !== "string" ||
    typeof records !== "string" ||
    sourceName === "" ||
    linkedId === "" ||
    name === "" ||
    records === ""
  ) {
    return null
  }

  return { sourceName, linkedId, name, records }
}

function readLegacyLink(
  value: Record<string, unknown>,
  kind: GeneratedKind,
): GeneratedLink | null | undefined {
  const keys = legacyLinkKeys[kind]
  const sourceName = value[keys.sourceName]
  const linkedId = value[keys.linkedId]
  const name = value[keys.name]
  const records = value[keys.records]
  const fields = [sourceName, linkedId, name, records]
  if (fields.every((field) => field === undefined)) {
    return undefined
  }
  if (
    typeof sourceName !== "string" ||
    typeof linkedId !== "string" ||
    typeof name !== "string" ||
    typeof records !== "string"
  ) {
    return null
  }
  if (sourceName === "" || linkedId === "" || name === "" || records === "") {
    return undefined
  }

  return { sourceName, linkedId, name, records }
}

function readGenerated(
  value: Record<string, unknown>,
): Partial<Record<GeneratedKind, GeneratedLink>> | null {
  const generated: Partial<Record<GeneratedKind, GeneratedLink>> = {}

  if (value.generated !== undefined) {
    if (!isRecord(value.generated)) {
      return null
    }
    for (const kind of generatedKinds) {
      if (value.generated[kind] === undefined) {
        continue
      }
      const link = readLink(value.generated[kind])
      if (link === null) {
        return null
      }
      if (link) {
        generated[kind] = link
      }
    }
  }

  for (const kind of generatedKinds) {
    if (generated[kind]) {
      continue
    }
    const link = readLegacyLink(value, kind)
    if (link === null) {
      return null
    }
    if (link) {
      generated[kind] = link
    }
  }

  return generated
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

  if (value.diagramHidden !== undefined) {
    if (typeof value.diagramHidden !== "boolean") {
      return null
    }
    if (value.diagramHidden) {
      row.diagramHidden = true
    }
  }

  const generated = readGenerated(value)
  if (!generated) {
    return null
  }
  if (generated.project || generated.automation) {
    row.generated = generated
  }

  return row
}

function readRows(value: unknown, allowEmpty = false) {
  if (!Array.isArray(value) || value.length > 40) {
    return null
  }
  if (!allowEmpty && value.length === 0) {
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

  let automations = [
    {
      id: "automation-1",
      name: "",
      placeholder: "Automation name",
      records: "",
    },
  ]
  let nextAutomationId = 2
  if (value.automations !== undefined) {
    const parsed = readRows(value.automations, true)
    if (!parsed) {
      return null
    }
    automations = parsed
  }
  if (value.nextAutomationId !== undefined) {
    const parsed = readCount(value.nextAutomationId)
    if (parsed === null) {
      return null
    }
    nextAutomationId = parsed
  }
  if (automations.length === 0) {
    automations = [
      {
        id: `automation-${nextAutomationId}`,
        name: "",
        placeholder: "Automation name",
        records: "",
      },
    ]
    nextAutomationId += 1
  }

  let whiteGlove = false
  if (value.whiteGlove !== undefined) {
    if (typeof value.whiteGlove !== "boolean") {
      return null
    }
    whiteGlove = value.whiteGlove
  }

  let title = defaultQuoteTitle
  if (value.title !== undefined) {
    if (typeof value.title !== "string") {
      return null
    }
    title = value.title.slice(0, 200)
  }

  return {
    title,
    sources,
    projects,
    automations,
    nextSourceId,
    nextProjectId,
    nextAutomationId,
    whiteGlove,
  }
}
