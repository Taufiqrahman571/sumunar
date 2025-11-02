// TODO: Implement mailto: for sending email backups (?)

// Direct Email
// TODO: Need proper implementation to storing in spreadsheets
(function () {
  const to = window.__ENV__.EMAIL;
  const subject = "New Project Inquiry";

  const body = [
    "Hi Sumunar Studio,",
    "",
    "I would like to discuss a new project with you.",
    "",
    "Here are some details:",
    "- Project Type: [e.g. Website, UI/UX, Branding]",
    "- Timeline: [e.g. 2 months]",
    "- Budget: [e.g. $3000-$5000]",
    "- Project Brief: [Please write your brief here]",
    "",
    "Please let me know the next steps.",
    "",
    "Thanks,",
    "[Your Name]"
  ].join("\r\n");

  const enc = encodeURIComponent;
  const gmailUrl = `https://mail.google.com/mail/?fs=1&tf=cm&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
  const accountChooserUrl = `https://accounts.google.com/AccountChooser?continue=${enc(gmailUrl)}`;

  function openGmail() {
    window.open(accountChooserUrl, "_blank", "noopener,noreferrer");
  }

  function init() {
    const btn = document.getElementById("direct-email");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openGmail();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Send Email With Form
(function () {
  function openGmailWithChooser({ to, subject, body }) {
    const enc = encodeURIComponent;
    const gmailUrl = `https://mail.google.com/mail/?fs=1&tf=cm&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
    const chooserUrl = `https://accounts.google.com/AccountChooser?continue=${enc(gmailUrl)}`;
    window.open(chooserUrl, "_blank", "noopener,noreferrer");
  }

  function buildBody({ name, email, details, budget }) {
    return [
      "Hi Sumunar Studio,",
      "",
      "I would like to discuss a new project with you.",
      "",
      "Here are some details:",
      `- Name: ${name || "[Your Name]"}`,
      `- Email: ${email || "[Your Email]"}`,
      `- Budget: ${budget || "[Select Budget]"}`,
      "",
      "Project Brief:",
      details || "[Please write your brief here]",
      "",
      "Please let me know the next steps.",
      "",
      "Thanks,",
      name || "[Your Name]"
    ].join("\r\n");
  }

  function getSelectedBudget() {
    const active = document.querySelector('[data-badge][aria-pressed="true"] span');
    return active ? active.textContent.trim() : "";
  }

  function isFormValid() {
    if (typeof window.validateAll === "function") {
      return !!window.validateAll({ scrollToError: true });
    }

    const invalid = document.querySelector("[data-invalid='true']");
    if (invalid) return false;

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const details = document.getElementById("project-details")?.value.trim();
    const budget = getSelectedBudget();

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    return (
      name &&
      email &&
      emailPattern.test(email) &&
      details &&
      budget
    );
  }

  function handleCTA() {
    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const details = document.getElementById("project-details")?.value.trim() || "";
    const budget = getSelectedBudget();

    if (!isFormValid()) return;

    const subject = `New Project Inquiry ${name || "[Client Name]"}`;
    const body = buildBody({ name, email, details, budget });

    openGmailWithChooser({
      to: window.__ENV__.EMAIL,
      subject,
      body
    });
  }

  function init() {
    const btn = document.getElementById("cta-send");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleCTA();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Google Form Logging
window.sendInquiry = function ({ name, email, details, budget }) {
  const FORM_ACTION = window.__ENV__.FORM_ACTION;
  const FIELDS = window.__ENV__.FIELDS;

  function logToGoogleForm() {
    const params = new URLSearchParams();
    params.set(FIELDS.name, name || "");
    params.set(FIELDS.email, email || "");
    params.set(FIELDS.details, details || "");
    params.set(FIELDS.budget, budget || "");

    const body = params.toString();
    const blob = new Blob([body], {
      type: "application/x-www-form-urlencoded;charset=UTF-8",
    });

    const ok = navigator.sendBeacon?.(FORM_ACTION, blob);
    if (!ok) {
      fetch(FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      }).catch(() => {});
    }
  }

  function buildBody() {
    return [
      "Hi Sumunar Studio,",
      "",
      "I would like to discuss a new project with you.",
      "",
      "Here are some details:",
      `- Name: ${name || "[Your Name]"}`,
      `- Email: ${email || "[Your Email]"}`,
      `- Investment: ${budget || "[Select Range]"}`,
      "",
      "Project Brief:",
      details || "[Please write your brief here]",
      "",
      "Please let me know the next steps.",
      "",
      "Thanks,",
      name || "[Your Name]",
    ].join("\r\n");
  }

  function composeGmailUrl({ to, subject, body }) {
    const enc = encodeURIComponent;
    const gmailUrl = `https://mail.google.com/mail/?fs=1&tf=cm&to=${enc(
      to
    )}&su=${enc(subject)}&body=${enc(body)}`;
    return `https://accounts.google.com/AccountChooser?continue=${enc(
      gmailUrl
    )}`;
  }

  logToGoogleForm();

  const subject = `New Project Inquiry ${name ? `[${name}]` : ""}`;
  const body = buildBody();
  const chooserUrl = composeGmailUrl({
    to: window.__ENV__.EMAIL,
    subject,
    body,
  });

  window.open(chooserUrl, "_blank", "noopener,noreferrer");
};