// Open dribbble.com
(function () {
  function openDribbble() {
    const dribbbleBtn = document.getElementById("dribbble");
    if (!dribbbleBtn) return;

    dribbbleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open("https://dribbble.com/sumunar", "_blank", "noopener,noreferrer");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", openDribbble);
  } else {
    openDribbble();
  }
})();