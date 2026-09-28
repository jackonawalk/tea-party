import { isQuoteId, readQuote, writeQuote } from "@/lib/quote-store"
import { parseSavedForm } from "@/lib/saved-form"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!isQuoteId(id)) {
    return Response.json({ error: "Quote not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  const form = parseSavedForm(body)
  if (!form) {
    return Response.json({ error: "Invalid form" }, { status: 400 })
  }

  try {
    const existing = await readQuote(id)
    if (!existing) {
      return Response.json({ error: "Quote not found" }, { status: 404 })
    }
    await writeQuote(id, form)
    return Response.json({ id })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message === "Missing blob token") {
      return Response.json({ error: "Missing blob token" }, { status: 500 })
    }
    return Response.json({ error: "Could not save form" }, { status: 502 })
  }
}
