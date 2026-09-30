import { getUser } from "@/lib/auth";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import {
  FinalCta,
  HowItWorks,
  Principles,
  SmallSteps,
  StatusTransparency,
  Stories,
  TwoDoors,
} from "@/components/marketing/sections";
import { Footer } from "@/components/marketing/footer";

export default async function HomePage() {
  const user = await getUser();

  return (
    <>
      <MarketingNav signedIn={Boolean(user)} />
      <main>
        <Hero />
        <HowItWorks />
        <TwoDoors />
        <StatusTransparency />
        <SmallSteps />
        <Stories />
        <Principles />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
