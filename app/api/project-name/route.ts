import OpenAI from "openai"

const projectNameSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
  },
  required: ["name", "description"],
  additionalProperties: false,
} as const

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 500 })
  }

  let sourceName = ""
  let kind = "project"
  try {
    const body = (await request.json()) as {
      sourceName?: unknown
      kind?: unknown
    }
    if (typeof body.sourceName === "string") {
      sourceName = body.sourceName.trim()
    }
    if (body.kind === "automation") {
      kind = "automation"
    } else if (body.kind !== undefined && body.kind !== "project") {
      return Response.json({ error: "Invalid kind" }, { status: 400 })
    }
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  if (sourceName === "") {
    return Response.json({ error: "Source name is required" }, { status: 400 })
  }

  const prompt =
    kind === "automation"
      ? `Suggest one short automation name a customer would run from ${sourceName} data. Write the description as a short request the customer would type, in the style of "Notify me when a deal stalls" or "Post closed revenue to the channel". Do not describe the product, and do not start every description with "Notify me".`
      : `Suggest one short project name a customer would build from ${sourceName} data. Write the description as a short request the customer would type, in the style of "Show me pipeline health by rep" or "Compare revenue to closed deals". Do not describe the product, and do not start every description with "Show me".`

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
    }
    if (
      typeof parsed.name !== "string" ||
      parsed.name.trim() === "" ||
      typeof parsed.description !== "string" ||
      parsed.description.trim() === ""
    ) {
      return Response.json({ error: "No project name" }, { status: 502 })
    }

    return Response.json({
      name: parsed.name.trim(),
      description: parsed.description.trim(),
    })
  } catch {
    return Response.json({ error: "Project name request failed" }, { status: 502 })
  }
}
