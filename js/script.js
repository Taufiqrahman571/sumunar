// src/script.js
// Gmail-first composer with mailto fallback and Account Chooser support
(function () {
  var to = "hello@sumunarstudio.com";
  var subject = "New Project Inquiry";

  var body = [
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

  var enc = encodeURIComponent;
  var gmailUrlBase = "https://mail.google.com/mail/?fs=1&tf=cm";
  var gmailUrl = gmailUrlBase + "&to=" + enc(to) + "&su=" + enc(subject) + "&body=" + enc(body);
  var accountChooserUrl = "https://accounts.google.com/AccountChooser?continue=" + encodeURIComponent(gmailUrl);

  var mailtoUrl = "mailto:" + to + "?subject=" + enc(subject) + "&body=" + enc(body);

  function openGmailPreferAccountChooser() {
    var w = window.open(accountChooserUrl, "_blank", "noopener,noreferrer");
    if (!w) {
      var w2 = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!w2) window.location.href = mailtoUrl;
    }
  }

  // Delegated click handler
  document.addEventListener("click", function (e) {
    const link = e.target.closest("#direct-email");
    if (!link) return;
    // Always provide a mailto fallback on the element
    link.setAttribute("href", mailtoUrl);
    e.preventDefault();
    openGmailPreferAccountChooser();
  }, { passive: false });

  function init() {
    var btn = document.getElementById("direct-email");
    if (!btn) return;

    // Always set mailto fallback
    btn.setAttribute("href", mailtoUrl);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openGmailPreferAccountChooser();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init(); // DOM already loaded
  }
})();
