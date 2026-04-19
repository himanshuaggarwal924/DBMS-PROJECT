import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, Compass, Lock, Mail, Sparkles } from "lucide-react";
import type { AxiosError } from "axios";
import { useForgotPassword } from "@workspace/api-client-react";
import authBg from "@/assets/auth-bg.png";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    try {
      const response = await forgotPasswordMutation.mutateAsync({ email: normalizedEmail });
      setSubmittedEmail(normalizedEmail);
      setPreviewPath(response.previewPath || null);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        setError(axiosErr.response?.data?.message || "Unable to start password reset.");
      } else {
        setError("Unable to start password reset.");
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <img src={authBg} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.9),rgba(15,23,42,0.82))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(2,132,199,0.05))]" />
            <div className="relative flex h-full flex-col justify-between p-10 text-white">
              <div>
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 shadow-lg shadow-cyan-950/30">
                  <Compass className="h-8 w-8" />
                </div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/85">
                  <Sparkles className="h-4 w-4" />
                  Account recovery
                </p>
                <h1 className="max-w-md text-4xl font-display font-bold leading-tight">
                  Get back into your travel planner without the guesswork.
                </h1>
                <p className="mt-5 max-w-md text-base leading-7 text-white/75">
                  We will generate a secure reset link for the email attached to your account. In this local setup, you
                  can open the reset screen directly after submitting.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-cyan-300" />
                    <p className="font-semibold">What happens next</p>
                  </div>
                  <div className="space-y-3 text-sm text-white/75">
                    <p>We verify the email address and prepare a one-time reset token.</p>
                    <p>The link expires after 30 minutes and is cleared as soon as you update the password.</p>
                    <p>You will return to the sign-in flow with your new password immediately after reset.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/92 p-6 text-slate-900 sm:p-8 lg:p-10">
            <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
              Back to sign in
            </Link>

            {submittedEmail ? (
              <div className="flex min-h-full flex-col justify-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                  <Check className="h-8 w-8" />
                </div>
                <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  Reset prepared
                </p>
                <h2 className="text-3xl font-display font-bold text-slate-950">Check the next step</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  A password reset request was created for <span className="font-semibold text-slate-900">{submittedEmail}</span>.
                </p>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-slate-900">Email delivery note</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        This project does not send real email yet, so a local preview reset link is exposed when available.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-3">
                  {previewPath ? (
                    <button
                      type="button"
                      onClick={() => setLocation(previewPath)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Open Reset Form
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedEmail("");
                      setPreviewPath(null);
                      setEmail("");
                    }}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    Send another request
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    <Lock className="h-4 w-4 text-primary" />
                    Secure password recovery
                  </p>
                  <h1 className="text-3xl font-display font-bold text-slate-950">Reset your password</h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                    Enter the email linked to your account and we will prepare a secure reset flow for you.
                  </p>
                </div>

                {error ? (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                    <label
                      htmlFor="email"
                      className="mb-2 flex items-center gap-2 px-4 pt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400"
                    >
                      Recovery email
                    </label>
                    <div className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 ring-1 ring-transparent transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/30">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={forgotPasswordMutation.isPending}
                        placeholder="you@example.com"
                        className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Before you submit</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Use the same email you registered with. The reset link stays valid for 30 minutes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Preparing reset link
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-sm text-slate-500">
                  Remembered it?{" "}
                  <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                    Return to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
