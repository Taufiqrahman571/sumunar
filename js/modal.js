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

// Name Form
(function () {
  const formEl  = document.getElementById('name-form');
  const inputEl = document.getElementById('name');

  // Prevent pressing Enter from submitting the form
  formEl.addEventListener('submit', e => e.preventDefault());

  // Regex: allow only letters (A-Z, a-z) and spaces
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
    if (!value) { setInvalid(true); return; }       // empty → invalid
    if (!isNameValid(value)) { setInvalid(true); return; }
    setInvalid(false);                              // valid
  }

  // Live feedback while typing
  inputEl.addEventListener('input', () => {
    const valOk = isNameValid(inputEl.value);
    setInvalid(!valOk && inputEl.value.trim() !== '');
  });

  // Check on blur and on load if prefilled
  inputEl.addEventListener('blur', validate);
  if (inputEl.value) validate();
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
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, { signal });
      if (!res.ok) return false;
      const json = await res.json();
      // Consider MX valid if we have at least one answer
      return Array.isArray(json.Answer) && json.Answer.length > 0;
    } catch {
      // network/CORS/offline → treat as unknown (fallback to format only)
      return null;
    }
  }

  let mxController = null;

  async function validate() {
    const value = inputEl.value.trim();

    // empty → treat as invalid (or change to false if you want "untouched" state)
    if (!value) { setInvalid(true); return; }

    // 1) format
    if (!isFormatValid(value)) { setInvalid(true); return; }

    // 2) availability (domain MX)
    const domain = value.split('@')[1];
    if (!domain) { setInvalid(true); return; }

    // cancel previous MX request if any
    if (mxController) mxController.abort();
    mxController = new AbortController();

    const mx = await hasMxRecords(domain, mxController.signal);

    // If MX check failed (null), fallback to format-only result
    if (mx === null) { setInvalid(false); return; }

    // Valid only when MX exists
    setInvalid(!mx);
  }

  // Live feedback
  inputEl.addEventListener('input', () => {
    // clear error while typing if format looks ok
    const valOk = isFormatValid(inputEl.value);
    if (valOk) setInvalid(false);
  });

  // Check on blur and on load if prefilled
  inputEl.addEventListener('blur', validate);
  if (inputEl.value) validate();
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
    if (!value) { setInvalid(true); return; }       // empty → invalid
    setInvalid(false);                              // valid
  }

  // Live feedback while typing
  inputEl.addEventListener('input', () => {
    const hasValue = inputEl.value.trim() !== '';
    setInvalid(!hasValue); // mark invalid only when empty
  });

  inputEl.addEventListener('blur', validate);
  if (inputEl.value) validate();
})();

// Badges
document.querySelectorAll('[data-badge]').forEach(btn => {
  btn.addEventListener('click', () => {
    const pressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', (!pressed).toString());
  });
});