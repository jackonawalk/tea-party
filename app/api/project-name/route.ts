import OpenAI from "openai"

function mermaidSource(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  let text = value.trim()
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/, "").trim()
  }
  if (!/^(flowchart|graph|erDiagram|classDiagram)\b/.test(text)) {
    return null
  }

  return text
}

const refreshSchema = {
  type: "object",
  properties: {
    description: { type: "string" },
    diagram: { type: "string" },
  },
  required: ["description", "diagram"],
  additionalProperties: false,
} as const

function refreshPrompt(kind: string, title: string, sourceName: string) {
  const sourceClause = sourceName === "" ? "" : ` It uses ${sourceName} data.`
  if (kind === "automation") {
    return `Write the description as a short request the customer would type for an automation titled "${title}".${sourceClause} Use the style of "Notify me when a deal stalls" or "Post closed revenue to the channel". Do not describe the product, and do not start every description with "Notify me". Also draw a mermaid flowchart of the relevant data objects. Put only the mermaid source in diagram, with no code fences.`
  }

  return `Write the description as a short request the customer would type for a project titled "${title}".${sourceClause} Use the style of "Show me pipeline health by rep" or "Compare revenue to closed deals". Do not describe the product, and do not start every description with "Show me". Also draw a mermaid flowchart of the relevant data objects. Put only the mermaid source in diagram, with no code fences.`
}

const projectNameSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    diagram: { type: "string" },
  },
  required: ["name", "description", "diagram"],
  additionalProperties: false,
} as const

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 500 })
  }

  let sourceName = ""
  let kind = "project"
  let title = ""
  try {
    const body = (await request.json()) as {
      sourceName?: unknown
      kind?: unknown
      name?: unknown
    }
    if (typeof body.sourceName === "string") {
      sourceName = body.sourceName.trim()
    }
    if (typeof body.name === "string") {
      title = body.name.trim()
    }
    if (body.kind === "automation") {
      kind = "automation"
    } else if (body.kind !== undefined && body.kind !== "project") {
      return Response.json({ error: "Invalid kind" }, { status: 400 })
    }
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  if (title !== "") {
    try {
      const client = new OpenAI({ apiKey })
      const response = await client.responses.create({
        model: "gpt-6-luna",
        service_tier: "fast",
        reasoning: { effort: "none" },
        input: refreshPrompt(kind, title, sourceName),
        text: {
          format: {
            type: "json_schema",
            name: "diagram",
            strict: true,
            schema: refreshSchema,
          },
        },
      })

      const parsed = JSON.parse(response.output_text) as {
        description?: unknown
        diagram?: unknown
      }
      const diagram = mermaidSource(parsed.diagram)
      if (
        typeof parsed.description !== "string" ||
        parsed.description.trim() === "" ||
        diagram === null
      ) {
        return Response.json({ error: "No diagram" }, { status: 502 })
      }

      return Response.json({
        diagram,
        description: parsed.description.trim(),
      })
    } catch {
      return Response.json({ error: "Diagram request failed" }, { status: 502 })
    }
  }

  if (sourceName === "") {
    return Response.json({ error: "Source name is required" }, { status: 400 })
  }

  const prompt =
    kind === "automation"
      ? `Suggest one short automation name a customer would run from ${sourceName} data. Write the description as a short request the customer would type, in the style of "Notify me when a deal stalls" or "Post closed revenue to the channel". Do not describe the product, and do not start every description with "Notify me". Also include a mermaid flowchart of the relevant data objects this automation reads and writes. Put only the mermaid source in diagram, with no code fences.`
      : `Suggest one short project name a customer would build from ${sourceName} data. Write the description as a short request the customer would type, in the style of "Show me pipeline health by rep" or "Compare revenue to closed deals". Do not describe the product, and do not start every description with "Show me". Also include a mermaid flowchart of the relevant data objects this project uses. Put only the mermaid source in diagram, with no code fences.`

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model: "gpt-6-luna",
      service_tier: "fast",
      reasoning: { effort: "none" },
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "project_name",
          strict: true,
          schema: projectNameSchema,
        },
      },
    })

    const parsed = JSON.parse(response.output_text) as {
      name?: unknown
      description?: unknown
      diagram?: unknown
    }
    const diagram = mermaidSource(parsed.diagram)
    if (
      typeof parsed.name !== "string" ||
      parsed.name.trim() === "" ||
      typeof parsed.description !== "string" ||
      parsed.description.trim() === "" ||
      diagram === null
    ) {
      return Response.json({ error: "No project name" }, { status: 502 })
    }

    return Response.json({
      name: parsed.name.trim(),
      description: parsed.description.trim(),
      diagram,
    })
  } catch {
    return Response.json({ error: "Project name request failed" }, { status: 502 })
  }
}
