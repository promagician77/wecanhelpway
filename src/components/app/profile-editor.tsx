"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { motion } from "framer-motion";
import {
  AtSign,
  BadgeCheck,
  Camera,
  Globe2,
  HandHeart,
  Heart,
  Home,
  Languages,
  LifeBuoy,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { updateProfile, uploadAvatar } from "@/actions/profile";
import { Avatar, Modal } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select, TagInput, Textarea } from "@/components/ui/field";
import { Badge, SpotlightCard, useToast } from "@/components/ui/feedback";
import { AuthAlert } from "@/components/auth/auth-alert";
import { PhoneVerification } from "./phone-verification";
import { COUNTRIES, IMAGES, LANGUAGES } from "@/lib/constants";
import type { Profile } from "@/lib/types";

const INTEREST_SUGGESTIONS = [
  "Technology", "Startups", "Education", "Health", "Climate", "Design", "Music", "Writing",
  "Sports", "Travel", "Cooking", "Photography", "Finance", "Science", "Volunteering", "Languages",
];

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Python", "Design", "UX", "Product", "Marketing", "Sales", "Data",
  "Teaching", "Writing", "Public speaking", "Mentoring", "Accounting", "Law", "Medicine",
];

export function ProfileEditor({ profile, providers }: { profile: Profile; providers: string[] }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const [languages, setLanguages] = React.useState<string[]>(profile.languages);
  const [skills, setSkills] = React.useState<string[]>(profile.skills);
  const [interests, setInterests] = React.useState<string[]>(profile.interests);
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
  const [uploading, setUploading] = React.useState(false);
  const [phoneModal, setPhoneModal] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { push } = useToast();
  const router = useRouter();

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  React.useEffect(() => {
    if (state?.ok) {
      push({ tone: "success", title: state.message ?? "Profile saved" });
      router.refresh();
    }
  }, [state, push, router]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAvatar(formData);
    setUploading(false);
    URL.revokeObjectURL(preview);

    if (result.ok && result.data) {
      setAvatarUrl(result.data.url);
      push({ tone: "success", title: "Photo updated" });
      router.refresh();
    } else {
      setAvatarUrl(profile.avatar_url);
      push({ tone: "danger", title: "Upload failed", description: result.ok ? undefined : result.error });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <SpotlightCard className="overflow-hidden">
        <div className="relative h-36 overflow-hidden">
          <Image src={IMAGES.earthOrbit} alt="" fill sizes="900px" className="object-cover object-[center_35%]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(247_245_240/0.1),rgb(13_13_16/0.95))]" />
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-end gap-5">
              <div className="relative">
                <Avatar src={avatarUrl} name={profile.full_name} size={104} ring />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-2 border-[#ffffff] skin-chrome transition-transform hover:scale-110 disabled:opacity-60"
                >
                  <Camera className="size-4" />
                </button>
                {uploading && (
                  <span className="absolute inset-0 grid place-items-center rounded-full bg-void/70 backdrop-blur-sm">
                    <span className="size-6 animate-spin rounded-full border-2 border-ink/20 border-t-brand-400" />
                  </span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
              </div>

              <div className="pb-1">
                <h1 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-ink">
                  {profile.full_name ?? "Your profile"}
                </h1>
                <p className="mt-1 text-[13px] text-ink/58">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              <Badge tone={profile.account_status === "active" ? "success" : "warn"}>
                {profile.account_status === "active" ? "Active" : profile.account_status}
              </Badge>
              {profile.role === "admin" && (
                <Badge tone="progress" icon={<ShieldCheck />}>
                  Team
                </Badge>
              )}
              {profile.phone_verified && (
                <Badge tone="info" icon={<BadgeCheck />}>
                  Phone verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Form ------------------------------------------------------------- */}
      <form action={action} className="mt-6 space-y-6">
        <input type="hidden" name="languages" value={languages.join(",")} />
        <input type="hidden" name="skills" value={skills.join(",")} />
        <input type="hidden" name="interests" value={interests.join(",")} />

        <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

        <Section title="Who you are" description="Only people you agree to connect with ever see this.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="full_name"
              label="Full name"
              icon={<UserRound />}
              defaultValue={profile.full_name ?? ""}
              error={fieldErrors?.full_name}
              required
            />
            <Input
              label="Email"
              icon={<AtSign />}
              defaultValue={profile.email ?? ""}
              disabled
              hint={`Signed in with ${providers.join(", ")}.`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="phone"
              label="Phone number"
              icon={<Phone />}
              defaultValue={profile.phone ?? ""}
              error={fieldErrors?.phone}
              hint={profile.phone_verified ? "Verified." : "Add it, then verify to unlock account recovery."}
              trailing={
                <button
                  type="button"
                  onClick={() => setPhoneModal(true)}
                  className="mr-1 rounded-2xs px-2.5 py-1.5 text-[11.5px] font-medium text-brand-700 transition-colors hover:bg-brand-500/15"
                >
                  {profile.phone_verified ? "Change" : "Verify"}
                </button>
              }
            />
            <Select
              name="country"
              label="Country"
              icon={<Globe2 />}
              placeholder="Choose your country"
              defaultValue={profile.country ?? ""}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <Input
            name="address"
            label="Address or city (optional)"
            icon={<Home />}
            defaultValue={profile.address ?? ""}
            hint="Only useful if you'd like to be matched with someone nearby."
          />

          <Textarea
            name="bio"
            label="Short bio"
            icon={<Heart />}
            rows={4}
            maxChars={600}
            defaultValue={profile.bio ?? ""}
            error={fieldErrors?.bio}
            hint="A few honest lines. This is what someone reads before deciding to help you."
          />
        </Section>

        <Section title="What you bring" description="The more specific, the better we can match you.">
          <TagInput
            label="Languages you speak"
            icon={<Languages />}
            value={languages}
            onChange={setLanguages}
            suggestions={LANGUAGES}
          />
          <TagInput
            label="Skills"
            icon={<Wrench />}
            value={skills}
            onChange={setSkills}
            suggestions={SKILL_SUGGESTIONS}
          />
          <TagInput
            label="Interests"
            icon={<Sparkles />}
            value={interests}
            onChange={setInterests}
            suggestions={INTEREST_SUGGESTIONS}
          />
        </Section>

        <Section
          title="What you need, and what you can offer"
          description="A quick summary. Your detailed requests and offers live on their own pages."
        >
          <Textarea
            name="what_they_need"
            label="What do you need right now?"
            icon={<LifeBuoy />}
            rows={3}
            maxChars={400}
            defaultValue={profile.what_they_need ?? ""}
            hint="One or two lines is plenty. “I'm not sure yet” is a valid answer."
          />
          <Textarea
            name="what_they_offer"
            label="What could you offer someone else?"
            icon={<HandHeart />}
            rows={3}
            maxChars={400}
            defaultValue={profile.what_they_offer ?? ""}
            hint="Everyone knows something that would help somebody."
          />
        </Section>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <motion.div layout className="rounded-md glass-strong p-2">
            <Button type="submit" size="lg" loading={pending} icon={<Save />}>
              Save profile
            </Button>
          </motion.div>
        </div>
      </form>

      <Modal
        open={phoneModal}
        onClose={() => setPhoneModal(false)}
        title="Verify your phone number"
        description="We'll text you a 6-digit code. This is only used for account recovery — never for marketing."
        size="sm"
      >
        <PhoneVerification
          currentPhone={profile.phone}
          onVerified={() => {
            setPhoneModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <SpotlightCard className="p-6 sm:p-7">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink/90">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink/58">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </SpotlightCard>
  );
}
