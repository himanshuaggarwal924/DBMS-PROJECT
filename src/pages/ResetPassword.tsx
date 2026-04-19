import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, Compass, Lock, Sparkles } from "lucide-react";
import type { AxiosError } from "axios";
import { useResetPassword, useValidateResetToken } from "@workspace/api-client-react";
import authBg from "@/assets/auth-bg.png";

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, label: "Weak", color: "bg-rose-500" };
  }
  if (score === 2) {
    return { score, label: "Fair", color: "bg-amber-500" };
  }
  if (score === 3) {
    return { score, label: "Good", color: "bg-sky-500" };
  }
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : "";
  const validationQuery = useValidateResetToken(token, { enabled: !!token });
  const resetPasswordMutation = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing a token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ token, password });
      setSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        setError(axiosErr.response?.data?.message || "Unable to reset password.");
      } else {
        setError("Unable to reset password.");
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <img src={authBg} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_34%),linear-gradient(140deg,rgba(2,6,23,0.92),rgba(15,23,42,0.82))]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="hidden border-r border-white/10 bg-white/6 lg:block">
              <div className="flex h-full flex-col justify-between p-10 text-white">
                <div>
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 shadow-lg shadow-emerald-950/30">
                    <Compass className="h-8 w-8" />
                  </div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/85">
                    <Sparkles className="h-4 w-4" />
                    Final step
                  </p>
                  <h1 className="text-4xl font-display font-bold leading-tight">Create a fresh password and get back to planning.</h1>
                  <p className="mt-5 text-base leading-7 text-white/75">
                    Pick a password you have not used before. Once saved, the reset token is immediately cleared.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-white/75">
                  <p className="font-semibold text-white">Password checklist</p>
                  <div className="mt-3 space-y-2">
                    <p>Use at least 8 characters.</p>
                    <p>Mix upper and lowercase letters.</p>
                    <p>Add at least one number and one symbol for a stronger score.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/94 p-6 text-slate-900 sm:p-8 lg:p-10">
              <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
                Back to sign in
              </Link>

              {success ? (
                <div className="flex min-h-[520px] flex-col justify-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    Password updated
                  </p>
                  <h2 className="text-3xl font-display font-bold text-slate-950">You can sign in now</h2>
                  <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                    Your new password is active and the reset link has been invalidated.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setLocation("/login")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Continue to sign in
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Start over
                    </Link>
                  </div>
                </div>
              ) : !token ? (
                <div className="flex min-h-[520px] flex-col justify-center">
                  <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                    Reset link missing
                  </p>
                  <h2 className="text-3xl font-display font-bold text-slate-950">This page needs a reset token.</h2>
                  <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                    Request a new password reset link and open it from the forgot-password flow.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Request new link
                    </Link>
                  </div>
                </div>
              ) : validationQuery.isLoading ? (
                <div className="flex min-h-[520px] flex-col justify-center">
                  <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    Checking link
                  </p>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
                    Validating reset token...
                  </div>
                </div>
              ) : validationQuery.isError ? (
                <div className="flex min-h-[520px] flex-col justify-center">
                  <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                    Link expired
                  </p>
                  <h2 className="text-3xl font-display font-bold text-slate-950">This reset link is no longer valid.</h2>
                  <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                    Request a fresh link to continue. Old reset links are cleared after use or when they expire.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Request new link
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                      <Lock className="h-4 w-4 text-primary" />
                      Choose a new password
                    </p>
                    <h1 className="text-3xl font-display font-bold text-slate-950">Reset password</h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                      {validationQuery.data?.email ? (
                        <>
                          Updating password for <span className="font-semibold text-slate-900">{validationQuery.data.email}</span>.
                        </>
                      ) : (
                        "Set a strong password to complete the recovery flow."
                      )}
                    </p>
                  </div>

                  {error ? (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                      <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                          New password
                        </label>
                        <div className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 ring-1 ring-transparent transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-300/60">
                          <Lock className="h-5 w-5 text-slate-400" />
                          <input
                            id="password"
                            required
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={resetPasswordMutation.isPending}
                            placeholder="At least 8 characters"
                            className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-700"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">Password strength</span>
                          <span className="font-medium text-slate-500">{password ? passwordStrength.label : "Not set"}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[0, 1, 2, 3].map((index) => (
                            <div
                              key={index}
                              className={`h-2 rounded-full ${
                                password && index < passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-800">
                          Confirm password
                        </label>
                        <div className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 ring-1 ring-transparent transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-300/60">
                          <Lock className="h-5 w-5 text-slate-400" />
                          <input
                            id="confirmPassword"
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            disabled={resetPasswordMutation.isPending}
                            placeholder="Re-enter your new password"
                            className="w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-700"
                          >
                            {showConfirmPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {passwordMismatch ? <p className="mt-2 text-sm font-medium text-rose-600">Passwords must match.</p> : null}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetPasswordMutation.isPending || password.length < 8 || passwordMismatch}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Saving new password
                        </>
                      ) : (
                        <>
                          Update password
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
