function openGmailWithAccountChooser() {
  const gmailUrl = 'https://mail.google.com/mail/?fs=1&to=taufiq@sumunarstudio.com&su=New%20Project%20Inquiry&body=Hi%20Sumunar%20Studio,%0D%0A%0D%0AI%20would%20like%20to%20discuss%20a%20new%20project%20with%20you.%0D%0A%0D%0AHere%20are%20some%20details:%0D%0A-%20Project%20Type:%20%5Be.g.%20Website,%20UI%2FUX,%20Branding%5D%0D%0A-%20Timeline:%20%5Be.g.%202%20months%5D%0D%0A-%20Budget:%20%5Be.g.%20%243000-%245000%5D%0D%0A-%20Project%20Brief:%20%5BPlease%20write%20your%20brief%20here%5D%0D%0A%0D%0APlease%20let%20me%20know%20the%20next%20steps.%0D%0A%0D%0AThanks,%0D%0A%5BYour%20Name%5D&tf=cm';
  const accountChooserUrl = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(gmailUrl)}`;
  window.open(accountChooserUrl, '_blank', 'noopener,noreferrer');
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".contact-btn");
  if (btn) {
    btn.addEventListener("click", openGmailWithAccountChooser);
  }
});
