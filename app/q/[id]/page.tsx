import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorScreen } from "@/components/calculator-screen";
import { isQuoteId, readQuote } from "@/lib/quote-store";
import { defaultQuoteTitle } from "@/lib/saved-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isQuoteId(id)) {
    return {};
  }

  const form = await readQuote(id);
  if (!form) {
    return {};
  }

  const title = form.title.trim();
  return { title: title === "" ? defaultQuoteTitle : title };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isQuoteId(id)) {
    notFound();
  }

  const form = await readQuote(id);
  if (!form) {
    notFound();
  }

  return <CalculatorScreen quoteId={id} initialForm={form} />;
}
