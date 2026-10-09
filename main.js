// iCreateMasterminds — page behavior
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  // Footer year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Calculator
  const members = $("#members");
  const dues = $("#dues");
  const update = () => {
    $("#members-out").textContent = members.value;
    $("#dues-out").textContent = money(dues.value);
    $("#total").textContent = money(members.value * dues.value);
  };
  if (members && dues) {
    members.addEventListener("input", update);
    dues.addEventListener("input", update);
    update();
  }

  // "Join a circle" buttons preselect the member role
  document.querySelectorAll('[data-role="member"]').forEach((el) =>
    el.addEventListener("click", () => {
      const radio = document.querySelector('input[name="role"][value="member"]');
      if (radio) radio.checked = true;
    })
  );

  // Application form
  const form = $("#apply-form");
  if (!form) return;
  const status = $(".form__status", form);
  const button = $("button[type=submit]", form);

  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = "form__status" + (kind ? " is-" + kind : "");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    // Client-side checks
    let firstBad = null;
    form.querySelectorAll("[required]").forEach((field) => {
      const ok = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !firstBad) firstBad = field;
    });
    if (firstBad) {
      setStatus(
        firstBad.name === "smsConsent"
          ? "Check the consent box so we can contact you about your application."
          : "Fill in the highlighted fields, then send again.",
        "error"
      );
      firstBad.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    data.swatMember = form.swatMember.checked;
    data.smsConsent = form.smsConsent.checked;
    data.page = location.href;
    const params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"].forEach((k) => {
      if (params.get(k)) data[k] = params.get(k);
    });

    button.disabled = true;
    button.textContent = "Sending...";
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "The application didn't go through.");
      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
      setStatus("Application sent. We'll be in touch by text or email within two business days.", "ok");
      button.textContent = "Application sent";
    } catch (err) {
      setStatus(err.message + " Try again, or email hello@automateyourjourney.com.", "error");
      button.disabled = false;
      button.textContent = "Send my application";
    }
  });
})();
