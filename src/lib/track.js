export function trackLead(plan) {
  if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: plan || "waitlist" });
  if (typeof window.plausible === "function") window.plausible("Waitlist Signup", { props: { plan: plan || "general" } });
}