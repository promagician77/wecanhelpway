import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="30 September 2026"
      intro="Asking for help means telling someone something personal. Here is exactly what we collect, who can see it, and what we will never do with it."
      sections={[
        {
          heading: "What we collect",
          paragraphs: [
            "Account details: your name, email address, and — if you choose to add them — your phone number, photo, country and address.",
            "Profile details you choose to give: a short bio, the languages you speak, your skills and interests.",
            "What you submit: the requests you make, the offers you post, and the messages you send inside a connection.",
            "Technical basics needed to run the service: session cookies, and a last-seen timestamp so the other person in a chat can see whether you're online.",
          ],
        },
        {
          heading: "Who can see it",
          paragraphs: [
            "Your requests and offers are visible to the WeCanHelpWay team only. There is no public profile and no directory — other members cannot search for or browse you.",
            "When our team proposes a connection, the other person sees your name, photo, country, bio and skills, plus the request or offer that led to the introduction. They see nothing else.",
            "Your one-to-one messages are visible only to you and the person you're talking to.",
            "Your email address and phone number are never shown to other members.",
          ],
        },
        {
          heading: "What we do with it",
          paragraphs: [
            "We use it to match you with someone who can help, to tell you when your request moves, and to keep your account secure.",
            "We send you email when something happens that you'd want to know about: a status change, a proposed connection, a message while you're away.",
            "We do not sell your data, we do not share it with advertisers, and we do not train models on your requests or conversations.",
          ],
        },
        {
          heading: "Where it lives",
          paragraphs: [
            "Your data is stored in Supabase (PostgreSQL), protected by row-level security so that a signed-in account can only read what it is entitled to read.",
            "Transactional email is delivered through our email provider, which receives your address and the contents of the notification.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can edit or delete any request or offer at any time, and you can pause an offer so we stop suggesting you for matches.",
            "You can ask us for a copy of your data, or ask us to delete your account and everything in it.",
            "Deleting your account removes your profile, requests, offers and notifications. Messages you sent may remain visible to the person you sent them to, because they are also that person's record of the conversation.",
          ],
        },
        {
          heading: "Getting in touch",
          paragraphs: [
            "If you have a question about your data, or want it removed, contact the WeCanHelpWay team and we'll respond within 30 days.",
          ],
        },
      ]}
    />
  );
}
