import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="30 September 2026"
      intro="WeCanHelpWay connects people who need help with people who can give it. These terms explain what we do, what we ask of you, and what we won't do."
      sections={[
        {
          heading: "What WeCanHelpWay is",
          paragraphs: [
            "We are an introduction service. You tell us what you need or what you can offer. A member of our team reads it and may propose a connection to a specific other person.",
            "We are not an employer, an agency, a licensed professional service, or a guarantor of outcomes. We introduce people; what happens in that conversation is between the two of you.",
          ],
        },
        {
          heading: "Your account",
          paragraphs: [
            "You must be at least 16 to use WeCanHelpWay, and you must give us accurate information about who you are.",
            "You're responsible for keeping your password safe. Tell us straight away if you think someone else has access to your account.",
            "One account per person. Don't impersonate anyone.",
          ],
        },
        {
          heading: "Consent is the whole design",
          paragraphs: [
            "Nobody can message you on WeCanHelpWay unless our team proposed a connection and you both accepted it. There is no public directory and no way to browse or contact members directly.",
            "You can decline any proposed connection without giving a reason. Declining is never held against you.",
            "Our team can withdraw a proposed connection at any point before it is accepted.",
          ],
        },
        {
          heading: "How to behave",
          paragraphs: [
            "Be honest about what you need and what you can offer. Someone is giving you their time on the strength of it.",
            "Don't harass, threaten, deceive or discriminate against anyone. Don't use a connection to sell, recruit, or solicit money.",
            "Don't share someone else's private information from a conversation without their permission.",
            "We can suspend or remove an account that breaks these rules, and we will do so without warning where someone's safety is involved.",
          ],
        },
        {
          heading: "What we don't promise",
          paragraphs: [
            "We can't promise that we'll find someone for every request, or that a connection will solve your problem. We review every request by hand, which means we're honest when we can't help.",
            "Advice you receive through WeCanHelpWay comes from another member, not from us. It isn't professional legal, medical, or financial advice, and we don't verify members' credentials.",
            "The service is provided as is. To the extent the law allows, we're not liable for what happens between two members we introduced.",
          ],
        },
        {
          heading: "Ending things",
          paragraphs: [
            "You can close your account whenever you like. Your requests and offers are removed from our matching pool immediately.",
            "We may end your access if you break these terms, or if we shut the service down — in which case we'll give you reasonable notice and a way to take your data with you.",
          ],
        },
      ]}
    />
  );
}
