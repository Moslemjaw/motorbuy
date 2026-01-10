import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const { t, isRTL } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: t("faq.item1.question"),
      answer: t("faq.item1.answer"),
    },
    {
      question: t("faq.item2.question"),
      answer: t("faq.item2.answer"),
    },
    {
      question: t("faq.item3.question"),
      answer: t("faq.item3.answer"),
    },
    {
      question: t("faq.item4.question"),
      answer: t("faq.item4.answer"),
    },
    {
      question: t("faq.item5.question"),
      answer: t("faq.item5.answer"),
    },
    {
      question: t("faq.item6.question"),
      answer: t("faq.item6.answer"),
    },
    {
      question: t("faq.item7.question"),
      answer: t("faq.item7.answer"),
    },
    {
      question: t("faq.item8.question"),
      answer: t("faq.item8.answer"),
    },
  ];

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {t("faq.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("faq.subtitle")}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b last:border-b-0 pb-4 last:pb-0"
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full flex items-center justify-between gap-4 text-left py-2 hover:text-primary transition-colors"
                    >
                      <h3 className="font-semibold text-lg flex-1">{faq.question}</h3>
                      {openIndex === index ? (
                        <ChevronUp className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 flex-shrink-0" />
                      )}
                    </button>
                    {openIndex === index && (
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

