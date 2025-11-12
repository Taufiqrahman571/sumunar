// Direct Email
(function () {
  const to = window.__ENV__.EMAIL;
  const subject = "New Project Inquiry";
  const body = window.__TEMPLATE__.EMAIL_MESSAGE;

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

  // initialize EmailJS (safe to call even if already inited)
  if (window.emailjs && typeof window.emailjs.init === 'function') {
    try { emailjs.init({ publicKey: PUBLIC_KEY }); } catch (e) { /* ignore */ }
  }

  function emailJsAvailable() {
    return typeof window.emailjs !== 'undefined' && SERVICE_ID && TEMPLATE_ID;
  }

  function getSelectedBudget() {
    const active = document.querySelector('[data-badge][aria-pressed="true"] span');
    return active ? active.textContent.trim() : "";
  }

  // --- make this async and await window.validateAll() when present ---
  async function isFormValid() {
    // If your modal exposes an async validateAll(), await it.
    if (typeof window.validateAll === "function") {
      try {
        // validateAll returns a Promise<boolean> (in your modal.js)
        const ok = await window.validateAll({ scrollToError: true });
        return !!ok;
      } catch (e) {
        // in case validateAll throws, treat as invalid
        return false;
      }
    }

    // fallback synchronous checks
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

  // disable/enable CTA to avoid double submit
  function setCTADisabled(state) {
    const btn = document.getElementById("cta-send");
    if (!btn) return;
    btn.disabled = !!state;
    if (state) {
      btn.classList.add('opacity-60', 'pointer-events-none');
    } else {
      btn.classList.remove('opacity-60', 'pointer-events-none');
    }
  }

  async function handleCTA() {
    // Await validation correctly
    const valid = await isFormValid();
    if (!valid) {
      // showToast optional
      return;
    }

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const details = document.getElementById("project-details")?.value.trim() || "";
    const budget = getSelectedBudget();

    // disable button while sending
    setCTADisabled(true);

    try {
      showToast('Sending message…');
      await sendEmailViaEmailJS({ name, email, details, budget });
      showToast('Message sent!');

      // After successful send, log to Google Form -> Sheets
      try {
        window.sendInquiry?.({ name, email, details, budget });
      } catch (e) {
        showToast('Email sent but saving to sheet failed.', true);
        console.error('Save to sheet failed', e);
      }

      // reset fields
      const nameEl = document.getElementById("name");
      const emailEl = document.getElementById("email");
      const detailsEl = document.getElementById("project-details");
      if (nameEl) nameEl.value = "";
      if (emailEl) emailEl.value = "";
      if (detailsEl) detailsEl.value = "";

      const pressed = document.querySelector('[data-badge][aria-pressed="true"]');
      if (pressed) pressed.setAttribute("aria-pressed", "false");

    } catch (err) {
      console.error('Email send failed', err);
      showToast('Sending failed. Please try again.', true);
    } finally {
      // re-enable CTA
      setCTADisabled(false);
    }
  }

  function init() {
    const btn = document.getElementById("cta-send");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // handleCTA is async but we don't need to await here
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
