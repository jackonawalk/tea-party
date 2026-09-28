import { notFound } from "next/navigation";
import { CalculatorScreen } from "@/components/calculator-screen";
import { isQuoteId, readQuote } from "@/lib/quote-store";

export const dynamic = "force-dynamic";

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
