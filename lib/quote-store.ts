import { get, put } from "@vercel/blob"
import { parseSavedForm, type SavedForm } from "@/lib/saved-form"

const quoteIdPattern = /^[a-z0-9]{12}$/
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

export function isQuoteId(id: string) {
  return quoteIdPattern.test(id)
}

export function quotePath(id: string) {
  return `quotes/${id}.json`
}

function createQuoteId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let id = ""
  for (const byte of bytes) {
    id += alphabet[byte % alphabet.length]
  }
  return id
}

function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error("Missing blob token")
  }
  return token
}

export async function readQuote(id: string): Promise<SavedForm | null> {
  if (!isQuoteId(id)) {
    return null
  }

  const result = await get(quotePath(id), {
    access: "private",
    useCache: false,
    token: blobToken(),
  })
  if (!result || result.statusCode !== 200) {
    return null
  }

  const text = await new Response(result.stream).text()
  try {
    return parseSavedForm(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}

export async function writeQuote(id: string, form: SavedForm) {
  await put(quotePath(id), JSON.stringify(form), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: blobToken(),
  })
}

export async function createQuote(form: SavedForm) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = createQuoteId()
    const existing = await readQuote(id)
    if (existing) {
      continue
    }
    await writeQuote(id, form)
    return id
  }

  throw new Error("Could not create quote")
}
