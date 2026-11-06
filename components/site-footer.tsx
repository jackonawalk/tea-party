import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <footer className="mt-16">
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-medium">{faq.question}</dt>
                  <dd className="mt-1 text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </footer>
  );
}
