import { priceUsage, type UsageRow } from "@/lib/pricing"

function readRows(value: unknown, label: string): UsageRow[] | string {
  if (value === undefined) {
    return []
  }
  if (!Array.isArray(value)) {
    return `${label} must be an array`
  }
  if (value.length > 40) {
    return `${label} has too many rows`
  }

  const rows: UsageRow[] = []
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return `${label} must be objects`
    }

    const record = item as { name?: unknown; recordsInMillions?: unknown }
    if (
      typeof record.recordsInMillions !== "number" ||
      !Number.isFinite(record.recordsInMillions)
    ) {
      return "Record counts must be numbers"
    }
    if (record.recordsInMillions < 0) {
      return "Record counts must be zero or greater"
    }

    let name = ""
    if (record.name !== undefined) {
      if (typeof record.name !== "string") {
        return "Names must be strings"
      }
      name = record.name
    }

    rows.push({ name, recordsInMillions: record.recordsInMillions })
  }

  return rows
}

export async function POST(request: Request) {
  let body: {
    sources?: unknown
    projects?: unknown
    automations?: unknown
    whiteGlove?: unknown
  }
  try {
    body = (await request.json()) as {
      sources?: unknown
      projects?: unknown
      automations?: unknown
      whiteGlove?: unknown
    }
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  const sources = readRows(body.sources, "Sources")
  if (typeof sources === "string") {
    return Response.json({ error: sources }, { status: 400 })
  }
  const projects = readRows(body.projects, "Projects")
  if (typeof projects === "string") {
    return Response.json({ error: projects }, { status: 400 })
  }
  const automations = readRows(body.automations, "Automations")
  if (typeof automations === "string") {
    return Response.json({ error: automations }, { status: 400 })
  }

  let whiteGlove = false
  if (body.whiteGlove !== undefined) {
    if (typeof body.whiteGlove !== "boolean") {
      return Response.json(
        { error: "White-glove support must be true or false" },
        { status: 400 },
      )
    }
    whiteGlove = body.whiteGlove
  }

  return Response.json(
    priceUsage({ sources, projects, automations, whiteGlove }),
  )
}
