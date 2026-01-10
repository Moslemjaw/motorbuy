import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary/10 py-12 mb-8 border-b border-primary/20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {t("legal.privacy.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("legal.privacy.lastUpdated")}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section1.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section1.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section2.title")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t("legal.privacy.section2.content")}</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>{t("legal.privacy.section2.item1")}</li>
                  <li>{t("legal.privacy.section2.item2")}</li>
                  <li>{t("legal.privacy.section2.item3")}</li>
                  <li>{t("legal.privacy.section2.item4")}</li>
                  <li>{t("legal.privacy.section2.item5")}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section3.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section3.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section4.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section4.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section5.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section5.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section6.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section6.content")}</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t("legal.privacy.section7.title")}</h2>
                <p className="text-muted-foreground leading-relaxed">{t("legal.privacy.section7.content")}</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

