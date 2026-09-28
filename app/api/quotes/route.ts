import { createQuote } from "@/lib/quote-store"
import { parseSavedForm } from "@/lib/saved-form"

export async function POST(request: Request) {
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
    const id = await createQuote(form)
    return Response.json({ id })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message === "Missing blob token") {
      return Response.json({ error: "Missing blob token" }, { status: 500 })
    }
    return Response.json({ error: "Could not save form" }, { status: 502 })
  }
}
