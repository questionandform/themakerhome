(() => {
  "use strict";

  // CONTACT CONFIGURATION: add the approved public HTTPS destination here.
  // Keep this empty until a business contact URL is approved; all CTAs stay hidden.
  const CONTACT_URL = "";

  if (!CONTACT_URL) {
    return;
  }

  let contactUrl;

  try {
    contactUrl = new URL(CONTACT_URL);
  } catch {
    return;
  }

  if (contactUrl.protocol !== "https:") {
    return;
  }

  document.querySelectorAll("[data-contact-cta]").forEach((group) => {
    const link = group.querySelector("[data-contact-link]");

    if (!link) {
      return;
    }

    link.href = contactUrl.href;
    link.rel = "noopener noreferrer";
    group.hidden = false;
  });
})();
