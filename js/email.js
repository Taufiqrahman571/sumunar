$(function () {
  const MODAL_ID = "email-modal";
  const MODAL_URL = "contents/modal.html";
  const $root = $("#modals-root");

  $("#contactBtn").on("click", function (e) {
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