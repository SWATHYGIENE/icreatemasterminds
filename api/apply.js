// Vercel serverless function: POST /api/apply
// Validates the application and forwards it to a GoHighLevel inbound webhook.
// Set GHL_WEBHOOK_URL in Vercel → Project → Settings → Environment Variables.

const REQUIRED = ["role", "firstName", "lastName", "email", "phone", "business", "industry", "location", "years"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : v);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "The form data couldn't be read." }); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({error:"Invalid application."});
  if (Buffer.byteLength(JSON.stringify(body)) > 16000) return res.status(413).json({error:"Application too large."});
  const allowed=new Set([...REQUIRED,"website","smsConsent","swatMember","goals","page","utm_source","utm_medium","utm_campaign","utm_content","ref"]);
  if(Object.keys(body).some(k=>!allowed.has(k)))return res.status(400).json({error:"Unknown application field."});
  if(Object.entries(body).some(([k,v])=>!["smsConsent","swatMember"].includes(k)&&typeof v!=="string"))return res.status(400).json({error:"Invalid application field."});
  if(Object.entries(body).some(([k,v])=>["smsConsent","swatMember"].includes(k)&&typeof v!=="boolean"))return res.status(400).json({error:"Invalid consent field."});

  // Honeypot: bots fill the hidden "website" field. Pretend success.
  if (body.website) return res.status(200).json({ ok: true });

  const missing = REQUIRED.filter((k) => !clean(body[k]));
  if (missing.length) return res.status(400).json({ error: "Some required fields are empty." });
  if (!EMAIL.test(clean(body.email))) return res.status(400).json({ error: "That email address doesn't look right." });
  if (clean(body.phone).replace(/\D/g, "").length < 10) return res.status(400).json({ error: "Enter a 10-digit phone number." });
  if (body.smsConsent !== true) return res.status(400).json({ error: "Consent is required so we can contact you." });
  if (!["leader", "member"].includes(body.role)) return res.status(400).json({ error: "Choose lead or join." });

  const payload = {
    first_name: clean(body.firstName, 80),
    last_name: clean(body.lastName, 80),
    email: clean(body.email, 200).toLowerCase(),
    phone: clean(body.phone, 30),
    company_name: clean(body.business, 150),
    industry: clean(body.industry, 100),
    location: clean(body.location, 100),
    years_in_business: clean(body.years, 30),
    circle_role: body.role,
    swat_network_member: body.swatMember === true,
    goals: clean(body.goals || "", 2000),
    sms_consent: true,
    consent_timestamp: new Date().toISOString(),
    consent_ip: (req.headers["x-forwarded-for"] || "").split(",")[0].trim(),
    page: clean(body.page || "", 300),
    utm_source: clean(body.utm_source || "", 100),
    utm_medium: clean(body.utm_medium || "", 100),
    utm_campaign: clean(body.utm_campaign || "", 100),
    utm_content: clean(body.utm_content || "", 100),
    ref: clean(body.ref || "", 100),
    tags: ["icreatemasterminds", body.role === "leader" ? "jc-leader-applicant" : "jc-member-applicant"]
      .concat(body.swatMember === true ? ["swat-network-member"] : []),
    source: "iCreateMasterminds landing page",
  };

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    console.error("GHL_WEBHOOK_URL is not set");
    return res.status(500).json({ error: "Applications aren't connected yet." });
  }

  let destination;
  try { destination=new URL(url); if(destination.protocol!=="https:"||destination.username||destination.password)throw Error(); }
  catch { return res.status(503).json({error:"Applications are temporarily unavailable."}); }
  try {
    const r = await fetch(destination.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!r.ok) {
      console.error("Application delivery rejected");
      return res.status(502).json({ error: "The application didn't go through." });
    }
    return res.status(200).json({ ok: true });
  } catch {
    console.error("Application delivery unavailable");
    return res.status(502).json({ error: "The application didn't go through." });
  }
}
