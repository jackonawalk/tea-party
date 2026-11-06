import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a credit?",
    answer: "One credit is 1 million records.",
  },
  {
    question: "How are projects counted?",
    answer:
      "Projects refresh hourly and are metered daily. Monthly usage is the daily record count multiplied by 30.",
  },
  {
    question: "Do automations use credits?",
    answer:
      "Automations have their own action limit. They do not spend credits.",
  },
  {
    question: "How is a plan chosen?",
    answer:
      "The suggested plan is the smallest plan whose included credits cover the records you entered. Prices are annual.",
  },
  {
    question: "Are users or LLM tokens limited?",
    answer: "Every plan includes unlimited users and unlimited LLM tokens.",
  },
];

export function SiteFooter() {
  return (
    <Accordion>
      <AccordionItem
        value="faq"
        className="rounded-xl border-b-0 bg-card px-3 ring-1 ring-foreground/10"
      >
        <AccordionTrigger className="px-0 py-3 text-base hover:no-underline">
          FAQ
        </AccordionTrigger>
        <AccordionContent>
          <dl className="flex flex-col gap-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
