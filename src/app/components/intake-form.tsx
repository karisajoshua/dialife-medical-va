"use client";
import { FormEvent, useState } from "react";

export default function IntakeForm({ type }: { type: "candidate" | "employer" }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setResult(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, type }) });
      const body = await response.json();
      setResult({ ok: response.ok, message: body.message || "Please try again." });
      if (response.ok) form.reset();
    } catch { setResult({ ok: false, message: "Network error. Please try again." }); }
    finally { setBusy(false); }
  }
  const candidate = type === "candidate";
  const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1px solid #b9c5d3", background: "#fff", color: "#152538", font: "inherit" };
  const field = { display: "grid", gap: 7, marginBottom: 17 } as const;
  return <form onSubmit={submit} style={{ maxWidth: 700, marginTop: 28 }}>
    <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div style={field}><label htmlFor="intake-name">{candidate ? "Full name" : "Contact name"}</label><input id="intake-name" style={inputStyle} name={candidate ? "full_name" : "contact_name"} maxLength={120} required autoComplete="name" /></div>
    {!candidate && <div style={field}><label htmlFor="intake-org">Organization name</label><input id="intake-org" style={inputStyle} name="organization" maxLength={160} required /></div>}
    <div style={field}><label htmlFor="intake-email">Email address</label><input id="intake-email" style={inputStyle} name="email" type="email" maxLength={254} required autoComplete="email" /></div>
    {candidate && <div style={field}><label htmlFor="intake-phone">Phone number (include country code)</label><input id="intake-phone" style={inputStyle} name="phone" type="tel" maxLength={60} required autoComplete="tel" /></div>}
    <div style={field}><label htmlFor="intake-country">Country</label><input id="intake-country" style={inputStyle} name="country" maxLength={100} required autoComplete="country-name" /></div>
    {candidate ? <>
      <div style={field}><label htmlFor="intake-background">Medical education or professional background</label><textarea id="intake-background" style={inputStyle} name="medical_background" maxLength={500} rows={3} required /></div>
      <div style={field}><label htmlFor="intake-experience">Years of relevant experience</label><select id="intake-experience" style={inputStyle} name="experience_years" required defaultValue=""><option value="" disabled>Select experience</option><option>Less than 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6+ years</option></select></div>
      <div style={field}><label htmlFor="intake-motivation">Why are you interested in medical virtual assistance? (minimum 20 characters)</label><textarea id="intake-motivation" style={inputStyle} name="motivation" rows={5} minLength={20} maxLength={3000} required /></div>
    </> : <>
      <div style={field}><label htmlFor="intake-headcount">Number of virtual assistants needed</label><input id="intake-headcount" style={inputStyle} name="expected_headcount" type="number" min={1} max={1000} defaultValue={1} required /></div>
      <div style={field}><label htmlFor="intake-requirements">Describe the roles, hours, time zone and software requirements (minimum 20 characters)</label><textarea id="intake-requirements" style={inputStyle} name="role_requirements" rows={5} minLength={20} maxLength={3000} required /></div>
    </>}
    <p style={{ fontSize: 13, opacity: .8 }}>Please do not include patient records, medical histories, passwords or other sensitive clinical information. We use your details to review and respond to this enquiry.</p>
    <button className="button bright" type="submit" disabled={busy} style={{ cursor: busy ? "wait" : "pointer", border: 0 }}>{busy ? "Submitting…" : candidate ? "Submit application" : "Send employer enquiry"}</button>
    {result && <p role="status" aria-live="polite" style={{ marginTop: 16, fontWeight: 600, color: result.ok ? "#116b4b" : "#b02a37" }}>{result.message}</p>}
  </form>;
}
