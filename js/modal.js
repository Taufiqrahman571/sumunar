// CLose-Open Modal (Preload + Cache Load)
$(function () {
  const MODAL_ID = "modal";
  const MODAL_URL = "../contents/modal.html";
  const $root = $("#modal-root");

  // Cached html string
  let cachedModalHtml = null;
  let preloadDone = false;

  // Start preloading right away (non-blocking)
  function preloadModal() {
    if (preloadDone) return;
    preloadDone = true;
    fetch(MODAL_URL, { cache: "force-cache" })
      .then(res => {
        if (!res.ok) throw new Error("failed to preload modal");
        return res.text();
      })
      .then(html => {
        cachedModalHtml = html;
        // warm images and decode them
        preloadImagesFromHtml(html);
        // insert modal DOM off the main interaction path so the browser does layout/paint early
        insertModalHidden();
      })
      .catch(() => { /* ignore preload failures; fallback to load on-demand */ });
  }

  // Call preload on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadModal);
  } else {
    preloadModal();
  }

  $("#contact-btn").on("click", function (e) {
    e.preventDefault();

    if ($root.children().length === 0) {
      if (cachedModalHtml) {
        // Insert cached html synchronously — instant
        $root.html(cachedModalHtml);
        bindModalEvents();
        openModal();
      } else {
        // Fallback to jQuery load if preload failed/hasn't finished yet
        $root.load(MODAL_URL, function () {
          bindModalEvents();
          openModal();
        });
      }
    } else {
      // If we pre-inserted with insertModalHidden, the modal element already exists in DOM:
      openModal();
    }
  });

  function openModal() {
    const $m = $("#" + MODAL_ID);
    // If we previously hid via inline style, clear that to make it visible
    $m.css({ visibility: "", pointerEvents: "" });
    $m.removeClass("hidden").addClass("flex");
    $("body").addClass("overflow-hidden");
  }

  function closeModal() {
    const $m = $("#" + MODAL_ID);
    $m.addClass("hidden").removeClass("flex");
    $("body").removeClass("overflow-hidden");
  }

  function bindModalEvents() {
    // Use delegated handler only once; it's safe even if called multiple times.
    $(document).on("click", `[data-modal-hide="${MODAL_ID}"]`, function () {
      closeModal();
    });
  }

  /* -------------------------
  Helper: preload images referenced inside the modal HTML
  ------------------------- */
  function preloadImagesFromHtml(html) {
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      // images and sources (picture)
      const imgs = tmp.querySelectorAll('img[src], source[srcset], img[data-src]');
      imgs.forEach(el => {
        const src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('srcset');
        if (!src) return;
        // simple preload: create Image to warm browser cache and decoding
        const img = new Image();
        img.src = src;
        // don't append anywhere — browser will fetch/cache/decoder
      });

      // If modal uses large CSS background images, optionally prefetch via link rel=preload (not implemented here)
    } catch (e) {
      // ignore parse errors
    }
  }

  /* Helper: insert modal DOM during idle time but keep it visually hidden
   This warms parsing, CSS calculations, image decoding, and paints before user clicks.
*/
function insertModalHidden() {
  if (!cachedModalHtml) return;
  if ($root.children().length > 0) return;

  // schedule work in idle time if available
  const schedule = window.requestIdleCallback || function (cb) { return setTimeout(cb, 200); };

  schedule(() => {
    // create a container and parse HTML
    const container = document.createElement('div');
    // trim to avoid accidental text nodes
    container.innerHTML = cachedModalHtml.trim();

    // find the modal element inside the fragment
    const modalEl = container.querySelector('#' + MODAL_ID);
    if (!modalEl) {
      // nothing found, append whole fragment but keep it display:none
      container.style.display = 'none';
      $root.append(container);
      bindModalEvents();
      // Execute any scripts in the fragment, to match jQuery .load() behavior
      executeAndAttachScripts(container);
      // notify listeners
      document.dispatchEvent(new CustomEvent('modal:inserted', { detail: { insertedHidden: true } }));
      return;
    }

    // keep existing class logic consistent: ensure it's not "open"
    modalEl.classList.remove('flex');
    modalEl.classList.add('hidden');

    // trick: keep element in DOM but invisible so that browser performs layout and decodes images.
    // visibility:hidden still allows images to load and layout to happen (display:none would block image loading)
    modalEl.style.visibility = 'hidden';
    modalEl.style.pointerEvents = 'none';

    // Append the element (not the whole container) so queries by ID still work
    $root.append(modalEl);

    // bind events now that DOM exists
    bindModalEvents();

    // Execute inline/external scripts found inside the cached HTML fragment.
    // This ensures any initialization code inside modal.html runs (validators, event listeners, etc.)
    executeAndAttachScripts(container);

    // Notify any consumer code that modal has been inserted so they can initialize too
    document.dispatchEvent(new CustomEvent('modal:inserted', { detail: { insertedHidden: true } }));

    // let the browser finish layout/paint on the hidden modal; then keep it hidden until open
    setTimeout(() => {
      // no-op placeholder — we intentionally keep it hidden. This is a good place to log if needed.
      // console.debug('modal pre-inserted and warmed');
    }, 150);
  });
}

/* Helper: Execute inline and external scripts found in a document fragment/container.
   This version loads external scripts sequentially to preserve ordering.
*/
function executeAndAttachScripts(container) {
  try {
    const scripts = Array.from(container.querySelectorAll('script'));

    // First, execute inline scripts immediately (but after we schedule external scripts to load)
    // We'll collect external script descriptors to load in order.
    const externals = [];

    scripts.forEach(oldScript => {
      if (oldScript.hasAttribute('data-no-exec')) {
        oldScript.remove();
        return;
      }

      if (oldScript.src) {
        // preserve attributes we care about
        externals.push({
          src: oldScript.src,
          type: oldScript.type || null,
          defer: oldScript.defer || false,
          async: oldScript.async || false,
          crossOrigin: oldScript.crossOrigin || null,
          noModule: oldScript.noModule || false
        });
        // remove placeholder
        oldScript.remove();
      } else {
        // Inline script: create new script and run immediately
        const newScript = document.createElement('script');
        if (oldScript.type) newScript.type = oldScript.type;
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        oldScript.remove();
      }
    });

    // Helper to load a single external script and wait for it to finish.
    function loadExternal(desc) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        if (desc.type) s.type = desc.type;
        if (desc.defer) s.defer = true;
        // ensure deterministic execution: do not set async unless explicitly requested.
        if (desc.async) s.async = true;

        if (desc.crossOrigin) s.crossOrigin = desc.crossOrigin;
        if (desc.noModule) s.noModule = true;

        s.onload = () => resolve();
        s.onerror = (e) => {
          console.warn('Failed to load script:', desc.src, e);
          // resolve anyway to continue load sequence — you may choose to reject if you prefer
          resolve();
        };

        // Use absolute/relative src as provided in the fragment
        s.src = desc.src;
        document.head.appendChild(s);
      });
    }

    // Load externals sequentially (preserves order)
    (async function loadAll() {
      for (const desc of externals) {
        // If script was marked async in original, we still await it here to preserve order,
        // but setting desc.async will allow browsers to execute it asynchronously if allowed.
        await loadExternal(desc);
      }
    })();
  } catch (e) {
    console.error('executeAndAttachScripts error', e);
  }
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
      return null;
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
    if (mx === null) { setInvalid(false); return true; }
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
  const cta = document.getElementById("cta-send");

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
      v.validateEmail ? v.validateEmail() : Promise.resolve(false),
    ]);

    const allOk = results.every(Boolean);
    if (!allOk) {
      const bad = firstInvalidEl();
      if (bad) {
        bad.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = bad.querySelector("input, textarea, button[aria-pressed]");
        if (focusable) focusable.focus({ preventScroll: true });
      }
    }
    return allOk;
  }

  window.validateAll = validateAll;
})();
