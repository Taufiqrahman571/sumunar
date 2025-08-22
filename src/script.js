function openGmailWithAccountChooser() {
  const gmailUrl = 'https://mail.google.com/mail/?fs=1&to=yourmail@gmail.com&su=Hello%20Team&body=I%20would%20like%20to%20get%20in%20touch.&tf=cm';
  const accountChooserUrl = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(gmailUrl)}`;
  window.open(accountChooserUrl, '_blank', 'noopener,noreferrer');
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".contact-btn");
  if (btn) {
    btn.addEventListener("click", openGmailWithAccountChooser);
  }
});
