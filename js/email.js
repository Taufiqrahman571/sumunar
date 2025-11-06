// Direct Email
(function () {
  const to = window.__ENV__.EMAIL;
  const subject = "New Project Inquiry";
  const body = window.__TEMPLATE__.EMAIL_MESSAGE

  const enc = encodeURIComponent;
  const mailtoUrl = `mailto:${enc(to)}?subject=${enc(subject)}&body=${enc(body)}`;

  function openDefaultEmailApp() {
    window.location.href = mailtoUrl;
  }

  function init() {
    const btn = document.getElementById("direct-email");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDefaultEmailApp();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// Send Email With Form (EmailJS send -> then log to Google Form)
(function () {
  const SERVICE_ID  = window.__ENV__.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = window.__ENV__.EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY  = window.__ENV__.EMAILJS_PUBLIC_KEY;

  emailjs.init({
    publicKey: PUBLIC_KEY,
  });

  function emailJsAvailable() {
    console.log(window.emailjs)
    return typeof window.emailjs !== 'undefined' && SERVICE_ID && TEMPLATE_ID;
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

  function sendEmailViaEmailJS({ name, email, details, budget }) {
    if (!emailJsAvailable()) {
      return Promise.reject(new Error('EmailJS not configured or loaded'));
    }

    const templateParams = {
      to_email: window.__ENV__.EMAIL,
      from_name: name,
      from_email: email,
      budget: budget,
      details: details,
      subject: `New Project Inquiry ${name || '[Client Name]'}`,
    };

    return window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
  }

  // UI helpers (minimal)
  function showToast(message, isError = false) {
    // minimal toast — replace with your UI if you already have one
    const existing = document.getElementById('inquiry-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'inquiry-toast';
    t.textContent = message;
    t.style.position = 'fixed';
    t.style.right = '20px';
    t.style.bottom = '20px';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '10px';
    t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    t.style.background = isError ? '#FEE2E2' : '#ECFCCB';
    t.style.color = isError ? '#991B1B' : '#163616';
    t.style.zIndex = 9999;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  async function handleCTA() {
    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const details = document.getElementById("project-details")?.value.trim() || "";
    const budget = getSelectedBudget();

    if (!isFormValid()) return;

    // 1) Send email via EmailJS
    try {
      showToast('Sending message…');
      await sendEmailViaEmailJS({ name, email, details, budget }); // promise resolves on success
      showToast('Message sent!');

      // 2) After successful send, store to Google Form -> Sheets
      try {
        // call your existing logger (which sends to Google Form)
        window.sendInquiry?.({ name, email, details, budget });
        // showToast('Saved to spreadsheet.');
      } catch (e) {
        // logging failed but email already sent
        showToast('Email sent but saving to sheet failed.', true);
        console.error('Save to sheet failed', e);
      }

      // optional: reset fields or close modal
      // document.getElementById('name').value = '';
      // ... etc.

    } catch (err) {
      console.error('Email send failed', err);
      showToast('Sending failed. Please try again.', true);
    }
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

// Google Form Logging Only (no email sending here)
window.sendInquiry = function ({ name, email, details, budget }) {
  const FORM_ACTION = window.__ENV__.FORM_ACTION;
  const FIELDS = window.__ENV__.FIELDS;

  const params = new URLSearchParams();
  params.set(FIELDS.name, name || "");
  params.set(FIELDS.email, email || "");
  params.set(FIELDS.details, details || "");
  params.set(FIELDS.budget, budget || "");

  const body = params.toString();

  // Prefer sendBeacon when user is navigating away
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
};
