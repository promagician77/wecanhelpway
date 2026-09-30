import type { ConnectionStatus, NeedStatus, OfferStatus, Priority } from "./types";

/* ---------------------------------------------------------------------------
 * Imagery — photographs from Unsplash, stored locally in /public/images so
 * pages never wait on a third-party image server at request time.
 * Every photo was chosen to feel calm and hopeful for someone going through a
 * hard stretch: daylight, nature, growth, people helping one another.
 * ------------------------------------------------------------------------- */
const img = (name: string) => `/images/${name}.jpg`;
const face = (name: string) => `/images/faces/${name}.jpg`;

export const IMAGES = {
  heroBackdrop: img("tree-meadow"), // a lone tree under an open sky
  lakeCalm: img("lake-dock"), // a quiet dock on a still lake
  seedlings: img("seedlings"), // young plants growing
  forestPath: img("forest-bridge"), // a footbridge into a green forest
  poppies: img("poppies"), // sunlit flowers, blue sky
  journaling: img("journaling"), // planning, coffee, daylight
  helpingGroup: img("helping-group"), // people gathered to help
  friendsStudying: img("friends-studying"),

  // Aliases still referenced by app screens.
  heroPortrait: img("tree-meadow"),
  earthOrbit: img("lake-dock"),
  authAside: img("forest-bridge"),
  mentoring: img("helping-group"),
  learning: img("journaling"),
  collaborate: img("friends-studying"),
} as const;

/**
 * Optional hero footage. Drop a licensed, landscape .mp4 into /public and set
 * NEXT_PUBLIC_HERO_VIDEO=/your-file.mp4 — the photo stays as poster and
 * fallback, and cross-fades to the video once it can play.
 */
export const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO || undefined;

export const FACES = {
  sarah: face("sarah"),
  amara: face("amara"),
  alex: face("alex"),
  lena: face("lena"),
  nadia: face("nadia"),
  priya: face("priya"),
  marco: face("marco"),
  yuki: face("yuki"),
  elena: face("elena"),
  david: face("david"),
  omar: face("omar"),
  chloe: face("chloe"),
  isabel: face("isabel"),
  jonas: face("jonas"),
  maya: face("maya"),
  ines: face("ines"),
} as const;

/* ---------------------------------------------------------------------------
 * Need categories. "I'm not sure what I need" is deliberately first-class —
 * nobody should be blocked because they can't name their own problem yet.
 * ------------------------------------------------------------------------- */
export const NEED_CATEGORIES = [
  { value: "not_sure", label: "I'm not sure what I need", icon: "Sparkles", hint: "Tell us the situation — we'll work it out with you." },
  { value: "career", label: "Career & work", icon: "Briefcase", hint: "Finding a job, changing direction, interviews, CVs." },
  { value: "learning", label: "Learning a skill", icon: "GraduationCap", hint: "Programming, languages, design, anything." },
  { value: "building", label: "Building something", icon: "Rocket", hint: "An app, a business, a project that needs a partner." },
  { value: "mentorship", label: "Mentorship & guidance", icon: "Compass", hint: "Someone who has walked the road before you." },
  { value: "education", label: "Education & study", icon: "BookOpen", hint: "School, university, exams, applications." },
  { value: "business", label: "Business & entrepreneurship", icon: "TrendingUp", hint: "Starting, growing, or fixing a venture." },
  { value: "creative", label: "Creative work", icon: "Palette", hint: "Writing, music, art, film, design." },
  { value: "tech_support", label: "Technical help", icon: "Wrench", hint: "Something technical you're stuck on." },
  { value: "relocation", label: "Moving & settling in", icon: "Plane", hint: "A new country, city, or culture." },
  { value: "wellbeing", label: "Wellbeing & life", icon: "HeartPulse", hint: "Confidence, balance, motivation, direction." },
  { value: "community", label: "Community & connection", icon: "Users", hint: "Finding people who understand." },
  { value: "other", label: "Something else", icon: "CircleHelp", hint: "If none of these fit, start here." },
] as const;

export const OFFER_CATEGORIES = [
  { value: "mentorship", label: "Mentoring & coaching", icon: "Compass", hint: "Regular guidance for someone finding their way." },
  { value: "teaching", label: "Teaching a skill", icon: "GraduationCap", hint: "Programming, languages, design, music." },
  { value: "building", label: "Building & engineering", icon: "Rocket", hint: "Help someone ship a real product." },
  { value: "career", label: "Career support", icon: "Briefcase", hint: "CVs, interviews, introductions, direction." },
  { value: "business", label: "Business advice", icon: "TrendingUp", hint: "Strategy, operations, fundraising, sales." },
  { value: "creative", label: "Creative collaboration", icon: "Palette", hint: "Co-create, critique, or produce." },
  { value: "language", label: "Language exchange", icon: "Languages", hint: "Conversation practice, fluency, confidence." },
  { value: "listening", label: "Listening & encouragement", icon: "HeartPulse", hint: "Sometimes that is exactly what's needed." },
  { value: "local", label: "Local & practical help", icon: "MapPin", hint: "Knowing a place, a system, a process." },
  { value: "other", label: "Something else", icon: "CircleHelp", hint: "Describe it in your own words." },
] as const;

export const HELP_TYPES = [
  "A one-off conversation",
  "Ongoing mentorship",
  "Hands-on collaboration",
  "Teaching or tutoring",
  "Review and feedback",
  "An introduction to someone",
  "Practical, step-by-step help",
  "I genuinely don't know yet",
] as const;

export const AVAILABILITY_OPTIONS = [
  "A few hours a week",
  "An hour or two a month",
  "Weekends only",
  "Evenings only",
  "Flexible — ask me",
  "Intensive for a short burst",
] as const;

export const EXPERIENCE_LEVELS = [
  "Just getting started",
  "1–3 years",
  "3–7 years",
  "7–15 years",
  "15+ years",
] as const;

/* ---------------------------------------------------------------------------
 * Status vocabulary — one source of truth for label, tone and explanation.
 * ------------------------------------------------------------------------- */
export interface StatusMeta {
  label: string;
  /** Plain-language line shown to the person who submitted it. */
  blurb: string;
  tone: "neutral" | "info" | "progress" | "success" | "warn" | "danger";
}

export const NEED_STATUS_META: Record<NeedStatus, StatusMeta> = {
  submitted: { label: "Submitted", blurb: "We have your request. Nothing more is needed from you right now.", tone: "neutral" },
  under_review: { label: "Under Review", blurb: "A real person on the WeCanHelpWay team is reading this.", tone: "info" },
  needs_clarification: { label: "Clarification Needed", blurb: "We asked you a question — your answer unblocks the match.", tone: "warn" },
  looking_for_match: { label: "We're Looking for a Match", blurb: "We're searching our community for the right person.", tone: "progress" },
  match_suggested: { label: "Match Suggested", blurb: "We've found someone promising and are preparing the introduction.", tone: "progress" },
  connection_proposed: { label: "Connection Proposed", blurb: "An introduction is on the table. It needs both of you to agree.", tone: "progress" },
  connected: { label: "Connected", blurb: "You're both in. A private conversation is open.", tone: "success" },
  conversation_active: { label: "Conversation Active", blurb: "You're talking. We'll stay out of the way.", tone: "success" },
  resolved: { label: "Resolved", blurb: "This need has been met. Thank you for telling us.", tone: "success" },
  rejected: { label: "Closed", blurb: "We couldn't take this one forward. You can always submit another.", tone: "danger" },
  archived: { label: "Archived", blurb: "Tucked away. Nothing is lost — reopen it any time.", tone: "neutral" },
};

export const OFFER_STATUS_META: Record<OfferStatus, StatusMeta> = {
  submitted: { label: "Submitted", blurb: "Thank you. We have your offer to help.", tone: "neutral" },
  under_review: { label: "Under Review", blurb: "We're reading what you can offer.", tone: "info" },
  needs_clarification: { label: "Clarification Needed", blurb: "We asked you something — a quick reply helps.", tone: "warn" },
  active: { label: "Active", blurb: "You're in the pool. We'll reach out when someone needs you.", tone: "success" },
  matched: { label: "Matched", blurb: "You've been matched with someone who needs your help.", tone: "success" },
  paused: { label: "Paused", blurb: "We won't suggest you for matches until you unpause.", tone: "neutral" },
  rejected: { label: "Closed", blurb: "We couldn't take this one forward right now.", tone: "danger" },
  archived: { label: "Archived", blurb: "Stored away. Reopen whenever you like.", tone: "neutral" },
};

export const CONNECTION_STATUS_META: Record<ConnectionStatus, StatusMeta> = {
  proposed: { label: "Proposed", blurb: "Waiting for both people to accept.", tone: "progress" },
  partially_accepted: { label: "One Accepted", blurb: "One side has said yes. Waiting on the other.", tone: "progress" },
  connected: { label: "Connected", blurb: "Both accepted. The conversation is open.", tone: "success" },
  declined: { label: "Declined", blurb: "Someone chose not to go ahead. That's always allowed.", tone: "danger" },
  cancelled: { label: "Cancelled", blurb: "The WeCanHelpWay team withdrew this proposal.", tone: "neutral" },
  completed: { label: "Completed", blurb: "This connection has run its course.", tone: "success" },
};

/** The journey we show the user as a timeline, in order. */
export const NEED_JOURNEY: NeedStatus[] = [
  "submitted",
  "under_review",
  "looking_for_match",
  "connection_proposed",
  "connected",
  "conversation_active",
  "resolved",
];

export const PRIORITY_META: Record<Priority, { label: string; tone: StatusMeta["tone"] }> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "High", tone: "warn" },
  urgent: { label: "Urgent", tone: "danger" },
};

export function categoryLabel(value: string, kind: "need" | "offer" = "need") {
  const list = kind === "need" ? NEED_CATEGORIES : OFFER_CATEGORIES;
  return list.find((c) => c.value === value)?.label ?? value;
}

export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia","Mexico","Moldova","Mongolia","Morocco","Myanmar","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

export const LANGUAGES = [
  "English","Spanish","Mandarin","Hindi","Arabic","Portuguese","Bengali","Russian","Japanese","German","French","Urdu","Indonesian","Turkish","Italian","Korean","Vietnamese","Polish","Ukrainian","Dutch","Thai","Persian","Swahili","Tagalog","Romanian","Greek","Czech","Hebrew","Swedish","Hungarian","Norwegian","Danish","Finnish","Malay","Nepali","Sinhala","Amharic","Somali","Zulu","Serbian","Croatian","Bulgarian","Slovak","Lithuanian","Latvian","Estonian",
];
