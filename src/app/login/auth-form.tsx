"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
export function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "recovery">(
    params.get("recovery") === "1" ? "recovery" : "signin",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(
      params.get("error")
        ? "The verification link could not be completed. Request a new link or sign in again."
        : "",
    ),
    [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget),
      email = String(form.get("email") || "").trim(),
      password = String(form.get("password") || "");
    try {
      const client = createBrowserSupabase();
      if (mode === "signin") {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error)
          throw new Error(
            "Unable to sign in. Check your email and password, and confirm your email address.",
          );
        window.location.assign("/dashboard");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: String(form.get("display_name") || "").trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          window.location.assign("/dashboard");
          return;
        }
        setMessage(
          "Check your email to confirm your account, then sign in. New accounts start in the applicant / trainee workspace.",
        );
      }
      if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/login?recovery=1`,
        });
        if (error) throw new Error(error.message);
        setMessage(
          "If this address has an account, a password reset link will arrive by email.",
        );
      }
      if (mode === "recovery") {
        const { error } = await client.auth.updateUser({ password });
        if (error)
          throw new Error(
            "This recovery session has expired. Request a new password reset link.",
          );
        setMessage(
          "Your password has been updated. You can open your workspace.",
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Account access is temporarily unavailable. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function change(next: typeof mode) {
    setMode(next);
    setError("");
    setMessage("");
  }
  const title = {
    signin: "Welcome back",
    signup: "Start your Dialife journey",
    reset: "Reset your password",
    recovery: "Choose a new password",
  }[mode];
  return (
    <main className="content-page auth-page">
      <Link href="/">← Back to Dialife</Link>
      <div className="auth-layout">
        <section>
          <span className="content-kicker">YOUR DIALIFE WORKSPACE</span>
          <h1>
            One account.
            <br />
            Your next opportunity.
          </h1>
          <p className="lead">
            Access your learning, applications and work through a private
            workspace that follows your role.
          </p>
          <ul className="auth-benefits">
            <li>Learn, practise and track your progress.</li>
            <li>Manage cohorts, staffing and placements.</li>
            <li>Keep documents and records private.</li>
          </ul>
          <Link className="button ghost" href="/dashboard?mode=demo">
            Explore the sample dashboard →
          </Link>
        </section>
        <section className="auth-card">
          <h2>{title}</h2>
          <p>
            {mode === "signin"
              ? "Sign in to access your live records."
              : mode === "signup"
                ? "Create your account and verify your email to continue."
                : "Follow the steps below to recover access."}
          </p>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="auth-success" role="status">
              {message}
            </div>
          )}
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label>
                Full name
                <input
                  name="display_name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
            )}
            {mode !== "recovery" && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </label>
            )}
            {mode !== "reset" && (
              <label>
                {mode === "recovery" ? "New password" : "Password"}
                <input
                  name="password"
                  type="password"
                  required
                  minLength={mode === "signin" ? 6 : 12}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
                {mode !== "signin" && (
                  <small>Use at least 12 characters.</small>
                )}
              </label>
            )}
            <button type="submit" className="button solid" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send reset link"
                      : "Update password"}
            </button>
          </form>
          {mode === "signin" ? (
            <div className="auth-links">
              <button onClick={() => change("reset")}>
                Forgot your password?
              </button>
              <span>
                New to Dialife?{" "}
                <button onClick={() => change("signup")}>
                  Create an account
                </button>
              </span>
            </div>
          ) : (
            <div className="auth-links">
              <button onClick={() => change("signin")}>Back to sign in</button>
              {mode === "recovery" && message && (
                <Link href="/dashboard">Open your workspace →</Link>
              )}
            </div>
          )}
          <p className="auth-note">
            Employer, trainer and administrator access is assigned by Dialife.
            Account creation does not grant staff access.
          </p>
        </section>
      </div>
    </main>
  );
}
