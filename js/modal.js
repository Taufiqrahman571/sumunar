// CLose-Open Modal
$(function () {
  const MODAL_ID = "modal";
  const MODAL_URL = "../contents/modal.html";
  const $root = $("#modal-root");

  $("#contact-btn").on("click", function (e) {
    e.preventDefault();

    if ($root.children().length === 0) {
      $root.load(MODAL_URL, function () {
        bindModalEvents();
        openModal();
      });
    } else {
      openModal();
    }
  });

  function openModal() {
    const $m = $("#" + MODAL_ID);
    $m.removeClass("hidden").addClass("flex");
    $("body").addClass("overflow-hidden");
  }

  function closeModal() {
    const $m = $("#" + MODAL_ID);
    $m.addClass("hidden").removeClass("flex");
    $("body").removeClass("overflow-hidden");
  }

  function bindModalEvents() {
    $(document).on("click", `[data-modal-hide="${MODAL_ID}"]`, function () {
      closeModal();
    });
  }
});

// Cal.com
(function () {
  function initCalButton() {
    const calButton = document.getElementById("direct-cal");
    if (!calButton) return;

    calButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.open("https://cal.com/taufiq-sumunar", "_blank", "noopener,noreferrer");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalButton);
  } else {
    initCalButton();
  }
})();

// Name Form
(function () {
  const formEl  = document.getElementById('name-form');
  const inputEl = document.getElementById('name');

  formEl.addEventListener('submit', e => e.preventDefault());
  const NAME_RE = /^[A-Za-z\s]+$/;

  function setInvalid(on) {
    formEl.dataset.invalid = on ? 'true' : 'false';
    inputEl.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function isNameValid(value) {
    return NAME_RE.test(String(value).trim());
  }

  function validate() {
    const value = inputEl.value.trim();
    if (!value) { setInvalid(true); return false; }
    if (!isNameValid(value)) { setInvalid(true); return false; }
    setInvalid(false);
    return true;
  }

  // live feedback
  inputEl.addEventListener('input', () => {
    const trimmed = inputEl.value.trim();
    const valOk = trimmed !== '' && isNameValid(trimmed);
    setInvalid(!valOk && trimmed !== '');
  });

  inputEl.addEventListener('blur', validate);
  if (inputEl.value) validate();

  // expose
  window.validators = window.validators || {};
  window.validators.validateName = validate;
})();

// Email Form
(function () {
  const formEl  = document.getElementById('email-form');
  const inputEl = document.getElementById('email');

  formEl.addEventListener('submit', e => e.preventDefault());
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setInvalid(on) {
    formEl.dataset.invalid = on ? 'true' : 'false';
    inputEl.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function isFormatValid(value) {
    return EMAIL_RE.test(String(value).trim());
  }

  async function hasMxRecords(domain, signal) {
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
        { signal }
      );
      if (!res.ok) return false;
      const json = await res.json();
      return Array.isArray(json.Answer) && json.Answer.length > 0;
    } catch {
      return null; // network/CORS → don’t block
    }
  }

  let mxController = null;

  async function validate() {
    const value = inputEl.value.trim();
    if (!value) { setInvalid(true); return false; }

    if (!isFormatValid(value)) { setInvalid(true); return false; }

    const domain = value.split('@')[1];
    if (!domain) { setInvalid(true); return false; }

    if (mxController) mxController.abort();
    mxController = new AbortController();

    const mx = await hasMxRecords(domain, mxController.signal);
    if (mx === null) { setInvalid(false); return true; } // fallback to format-only
    setInvalid(!mx);
    return !!mx;
  }

  inputEl.addEventListener('input', () => {
    if (isFormatValid(inputEl.value)) setInvalid(false);
  });

  inputEl.addEventListener('blur', () => { validate(); });
  if (inputEl.value) validate();

  // expose
  window.validators = window.validators || {};
  window.validators.validateEmail = validate;
})();

// Project Details Form
(function () {
  const formEl  = document.getElementById('project-details-form');
  const inputEl = document.getElementById('project-details');

  formEl.addEventListener('submit', e => e.preventDefault());

  function setInvalid(on) {
    formEl.dataset.invalid = on ? 'true' : 'false';
    inputEl.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function validate() {
    const value = inputEl.value.trim();
    if (!value) { setInvalid(true); return false; }
    setInvalid(false);
    return true;
  }

  inputEl.addEventListener('input', () => {
    const hasValue = inputEl.value.trim() !== '';
    setInvalid(!hasValue);
  });

  inputEl.addEventListener('blur', validate);
  if (inputEl.value) validate();

  // expose
  window.validators = window.validators || {};
  window.validators.validateProject = validate;
})();

// Badges (budget)
(function () {
  const field = document.getElementById('budget-field');
  const badges = field.querySelectorAll('[data-badge]');

  function anySelected() {
    return Array.from(badges).some(b => b.getAttribute('aria-pressed') === 'true');
  }

  function updateValidity() {
    field.setAttribute('data-invalid', anySelected() ? 'false' : 'true');
  }

  badges.forEach(btn => {
    btn.addEventListener('click', () => {
      badges.forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      updateValidity();
    });
  });

  // expose
  window.validators = window.validators || {};
  window.validators.validateBudget = function validateBudget() {
    const ok = anySelected();
    field.setAttribute('data-invalid', ok ? 'false' : 'true');
    return ok;
  };

  // start neutral
  field.setAttribute('data-invalid', 'false');
})();

// CTA click: validate all fields at once
(function () {
  const cta = document.getElementById('cta-send');

  function firstInvalidEl() {
    return (
      document.querySelector('#name-form[data-invalid="true"]') ||
      document.querySelector('#email-form[data-invalid="true"]') ||
      document.querySelector('#project-details-form[data-invalid="true"]') ||
      document.querySelector('#budget-field[data-invalid="true"]')
    );
  }

  async function validateAll() {
    const v = window.validators || {};
    const results = await Promise.all([
      Promise.resolve(v.validateName?.() ?? false),
      Promise.resolve(v.validateProject?.() ?? false),
      Promise.resolve(v.validateBudget?.() ?? false),
      // run email last (async)
      v.validateEmail ? v.validateEmail() : Promise.resolve(false),
    ]);

    const allOk = results.every(Boolean);
    if (!allOk) {
      const bad = firstInvalidEl();
      if (bad) {
        bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // try focus the input/textarea if present
        const focusable = bad.querySelector('input, textarea, button[aria-pressed]');
        if (focusable) focusable.focus({ preventScroll: true });
      }
    }
    return allOk;
  }

  if (cta) {
    cta.addEventListener('click', async () => {
      const ok = await validateAll();
      if (!ok) return; // stop here; errors are visible

      // All good → proceed
      // submitForm();
    });
  }
})();
