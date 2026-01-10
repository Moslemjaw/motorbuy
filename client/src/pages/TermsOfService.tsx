import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function TermsOfService() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {t("legal.terms.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("legal.terms.lastUpdated")}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section1.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section1.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section2.title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("legal.terms.section2.content")}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>{t("legal.terms.section2.item1")}</li>
                  <li>{t("legal.terms.section2.item2")}</li>
                  <li>{t("legal.terms.section2.item3")}</li>
                  <li>{t("legal.terms.section2.item4")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section3.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section3.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section4.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section4.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section5.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section5.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section6.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section6.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section7.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section7.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.terms.section8.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.terms.section8.content")}</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

