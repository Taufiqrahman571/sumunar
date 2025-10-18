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
    // Try AccountChooser first (helps if user has multiple accounts)
    var w = window.open(accountChooserUrl, "_blank", "noopener,noreferrer");
    if (!w) {
      // popup blocked — open direct gmail URL
      var w2 = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!w2) {
        // still blocked — fallback to mailto
        window.location.href = mailtoUrl;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Ensure contactBtn exists; set mailto as fallback href (for no-js)
    var btn = document.getElementById("contactBtn");
    if (!btn) return;
    btn.setAttribute("href", mailtoUrl);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openGmailPreferAccountChooser();
    });
  });
})();
