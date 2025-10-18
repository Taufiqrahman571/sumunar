// src/script.js
(function () {
  // --------------------
  // Email template & URLs
  // --------------------
  var to = "hello@sumunarstudio.com";
  var subject = "New Project Inquiry";
  var bodyLines = [
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
  ];
  var body = bodyLines.join("\r\n");
  var enc = encodeURIComponent;
  var gmailBase = "https://mail.google.com/mail/?fs=1&tf=cm";
  var gmailUrl = gmailBase + "&to=" + enc(to) + "&su=" + enc(subject) + "&body=" + enc(body);
  var accountChooserUrl = "https://accounts.google.com/AccountChooser?continue=" + encodeURIComponent(gmailUrl);
  var mailtoUrl = "mailto:" + to + "?subject=" + enc(subject) + "&body=" + enc(body);

  // -------------
  // Contact button
  // -------------
  var contactBtn = document.getElementById("contactBtn");
  if (contactBtn) {
    // ensure fallback href for no-js
    contactBtn.setAttribute("href", mailtoUrl);
    // click handler: try account chooser, then gmail, then mailto
    contactBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // try account chooser
      var w = window.open(accountChooserUrl, "_blank", "noopener,noreferrer");
      if (!w) {
        var w2 = window.open(gmailUrl, "_blank", "noopener,noreferrer");
        if (!w2) {
          // fallback to mail client
          window.location.href = mailtoUrl;
        }
      }
    });

    // Tooltip: show on hover/focus handled via CSS, but we also add a11y (aria-live for screen readers)
    // Add aria attributes for tooltip
    var tooltip = contactBtn.querySelector(".btn-tooltip");
    if (tooltip) {
      tooltip.setAttribute("role", "status");
      tooltip.setAttribute("aria-live", "polite");
    }

    // Optional: on long-press or on mobile tap show toast or copy email (lightweight)
    contactBtn.addEventListener("contextmenu", function (e) {
      // allow right-click default menu for copy if needed
    });
  }

  // -------------
  // Works button
  // -------------
  var worksBtn = document.getElementById("worksBtn");
  if (worksBtn) {
    // If there's a section with id="works", smooth scroll to it.
    worksBtn.addEventListener("click", function (e) {
      var target = document.querySelector(worksBtn.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Add small focus ring for accessibility
        target.setAttribute("tabindex", "-1"); // make focusable
        target.focus({ preventScroll: true });
      } else {
        // Fallback: navigate to /works page if present
        // If you have a separate works page, uncomment next line:
        // window.location.href = "/works";
      }
    });
  }

  // Accessibility: keyboard support (Enter/Space)
  document.addEventListener("keydown", function (e) {
    if (!e.target) return;
    // Activate button on Enter or Space for elements with role=button
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches('.btn[role="button"]')) {
      e.preventDefault();
      e.target.click();
    }
  });
})();
