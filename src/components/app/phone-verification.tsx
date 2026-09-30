"use client";

import * as React from "react";
import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Phone } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { OtpInput } from "@/components/ui/misc";
import { AuthAlert } from "@/components/auth/auth-alert";

/**
 * Two-stage phone verification. Supabase sends the SMS, so this needs an SMS
 * provider configured on the project; without one the send step reports the
 * provider error rather than failing silently.
 */
export function PhoneVerification({
  currentPhone,
  onVerified,
}: {
  currentPhone: string | null;
  onVerified: () => void;
}) {
  const [sendState, sendAction, sending] = useActionState(sendPhoneOtp, null);
  const [verifyState, verifyAction, verifying] = useActionState(verifyPhoneOtp, null);
  const [code, setCode] = React.useState("");

  const sentTo = sendState?.ok ? sendState.data?.phone : undefined;

  React.useEffect(() => {
    if (verifyState?.ok) {
      const t = setTimeout(onVerified, 1100);
      return () => clearTimeout(t);
    }
  }, [verifyState, onVerified]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!sentTo ? (
        <motion.form
          key="send"
          action={sendAction}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="space-y-4"
        >
          <AuthAlert>{sendState && !sendState.ok ? sendState.error : undefined}</AuthAlert>

          <Input
            name="phone"
            label="Phone number"
            icon={<Phone />}
            type="tel"
            autoComplete="tel"
            defaultValue={currentPhone ?? ""}
            placeholder="+14155552671"
            error={sendState && !sendState.ok ? sendState.fieldErrors?.phone : undefined}
            hint="Include your country code."
            required
          />

          <Button type="submit" size="lg" fullWidth loading={sending}>
            Send me a code
          </Button>
        </motion.form>
      ) : (
        <motion.form
          key="verify"
          action={verifyAction}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="space-y-5"
        >
          <input type="hidden" name="phone" value={sentTo} />
          <input type="hidden" name="token" value={code} />

          {verifyState?.ok ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="grid size-14 place-items-center rounded-full bg-positive/15 text-positive"
              >
                <BadgeCheck className="size-7" />
              </motion.span>
              <p className="text-[14px] font-medium text-positive">{verifyState.message}</p>
            </div>
          ) : (
            <>
              <p className="text-center text-[13.5px] text-ink/62">
                We sent a code to <span className="font-medium text-ink/85">{sentTo}</span>
              </p>

              <AuthAlert>{verifyState && !verifyState.ok ? verifyState.error : undefined}</AuthAlert>

              <OtpInput value={code} onChange={setCode} disabled={verifying} />

              <Button type="submit" size="lg" fullWidth loading={verifying} disabled={code.length !== 6}>
                Verify
              </Button>
            </>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
