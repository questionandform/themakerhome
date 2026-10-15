(() => {
  "use strict";
  const form = document.querySelector("#question-form");
  const question = form.elements.question;
  const email = form.elements.email;
  const submit = document.querySelector("#submit-question");
  const feedback = document.querySelector("#form-error");
  const receipt = document.querySelector("#receipt");
  const title = document.querySelector("#receipt-title");
  const note = document.querySelector("#receipt-note");
  const answer = document.querySelector("#answer");
  const status = document.querySelector("#receipt-status");
  const idLabel = document.querySelector("#request-id");
  const check = document.querySelector("#check-answer");
  const copy = document.querySelector("#copy-receipt");
  const forget = document.querySelector("#forget-receipt");
  const counter = document.querySelector("#question-count");
  const agent = form.dataset.agent;
  const sourceSite = form.dataset.sourceSite;
  const settings = window.QF_ASK_CONFIG || {};
  let apiBase = "";
  try {
    const url = new URL(settings.apiBase);
    if (settings.submissionEnabled === true && location.protocol === "https:" && url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) apiBase = url.origin;
  } catch {}
  const communityChoice = document.querySelector("#community-consent");
  const humanChoice = document.querySelector("#human-help-consent");
  const contactChoice = document.querySelector("#contact-consent");
  const humanFields = document.querySelector("#human-help-fields");
  const contactEmail = document.querySelector("#contact-email");
  const ageBand = document.querySelector("#age-band");
  const versions = { community: "community-v1-2026-10-15", human_help: "human-help-v1-2026-10-15", contact: "contact-v1-2026-10-15" };
  function refreshHelp() {
    humanFields.hidden = !humanChoice.checked; humanFields.disabled = !humanChoice.checked;
    contactEmail.disabled = !(humanChoice.checked && apiBase && settings.contactCollectionEnabled === true);
    const minor = ageBand && ageBand.value !== "adult";
    if (ageBand) {
      document.querySelector("#minor-safety").hidden = !minor;
      document.querySelector("#contact-email-label").innerHTML = minor ? 'Adult / guardian contact email <span>— required before contact</span>' : 'Contact email <span>— required before contact</span>';
    }
    contactEmail.required = !contactEmail.disabled && contactChoice.checked;
  }
  function collectOptions() {
    const consents = {};
    for (const [scope, control] of Object.entries({ community: communityChoice, human_help: humanChoice, contact: contactChoice })) consents[scope] = { granted: scope === "contact" ? humanChoice.checked && control.checked : control.checked, version: versions[scope] };
    const options = { consents };
    if (!humanChoice.checked) return options;
    const h = { broad_location: form.elements.broad_location.value.trim(), language: form.elements.contact_language.value, timeline: form.elements.help_timeline.value };
    if (agent === "THINK") Object.assign(h, { age_band: ageBand.value, topic: form.elements.help_topic.value, help_type: form.elements.help_type.value, format: form.elements.help_format.value, guardian_contact: form.elements.guardian_contact.checked });
    if (agent === "SHAPE") Object.assign(h, { project_type: form.elements.project_type.value, project_size: form.elements.project_size.value.trim(), budget_band: form.elements.budget_band.value, wanted_help: form.elements.wanted_help.value });
    if (agent === "MAKE") Object.assign(h, { project_type: form.elements.project_type.value, project_size: form.elements.project_size.value, one_day: form.elements.one_day.value, materials: form.elements.materials.value.trim(), wanted_help: form.elements.wanted_help.value });
    options.help = h;
    if (consents.contact.granted && !contactEmail.disabled) options.contact_email = contactEmail.value.trim();
    return options;
  }
  for (const input of [humanChoice, contactChoice, ageBand].filter(Boolean)) input.addEventListener("change", refreshHelp);
  queueMicrotask(refreshHelp);
  for (const scope of ["community", "human_help"]) {
    const button = document.querySelector("#withdraw-" + scope);
    button.addEventListener("click", async () => {
      if (!apiBase || !activeReceipt) return;
      button.disabled = true;
      try {
        await callApi("/v1/requests/" + activeReceipt.request_id + "/consents", { method: "POST", headers: { "Content-Type": "application/json", "X-Request-Token": activeReceipt.token }, body: JSON.stringify({ operation_id: uuid(), withdraw: [scope] }) });
        document.querySelector("#consent-summary").textContent = scope === "community" ? "Community permission withdrawn. No automatic publication." : "Human-help and contact permission withdrawn. No automatic routing.";
      } catch { showError("We could not confirm withdrawal. Keep your receipt and try again later."); }
      finally { button.disabled = false; }
    });
  }

  const storageKey = "qf-receipt-" + agent;
  let activeReceipt = null;
  let attempted = null;
  let checking = false;

  function saveReceipt(value) {
    activeReceipt = value;
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch {}
  }
  function showError(message) { feedback.textContent = message; feedback.hidden = !message; }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const h = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function makeIdentity() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return { request_id: uuid(), token: Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("") };
  }
  function showReceipt(value, data) {
    receipt.hidden = false;
    status.textContent = data.status === "answered" ? "Answered" : "Pending";
    title.textContent = data.status === "answered" ? "Something you can use." : "Your question is in the queue.";
    note.textContent = data.status === "answered" ? "Your answer is ready below. Keep it with your project notes." : "Answers arrive later, rather than in a live chat. Save this receipt and return to check. We can’t promise a response time.";
    idLabel.textContent = value.request_id;
    answer.textContent = data.answer || "";
    answer.hidden = data.status !== "answered";
    check.hidden = data.status === "answered";
    copy.hidden = false;
    forget.hidden = false;
    for (const scope of ["community", "human_help"]) document.querySelector("#withdraw-" + scope).hidden = !apiBase;
  }
  function receiptLink(value) {
    // A fragment stays in the browser: it is not sent to the site host or a referrer.
    const url = new URL(location.pathname, location.origin);
    url.hash = new URLSearchParams({ request: value.request_id, token: value.token }).toString();
    return url.href;
  }
  async function callApi(path, options) {
    const response = await fetch(apiBase + path, { ...options, cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(15000) });
    let data;
    try { data = await response.json(); } catch { throw new Error("The service returned an unexpected response. Please try again later."); }
    if (!response.ok) {
      if (response.status === 503) throw new Error("Answer delivery isn’t open yet. Your question has not been submitted.");
      if (response.status === 429) throw new Error("Too many requests. Please wait a minute and try again.");
      if (response.status === 410) throw new Error("This receipt has expired. You can prepare a new question.");
      if (response.status === 404) throw new Error("We couldn’t find that receipt. Check that you’re on the same tool.");
      throw new Error("We couldn’t complete this request. Keep your question and try again later.");
    }
    return data;
  }
  async function checkAnswer() {
    if (!apiBase || !activeReceipt || checking) return;
    checking = true; check.disabled = true; showError("");
    try {
      const data = await callApi("/v1/requests/" + activeReceipt.request_id, { headers: { "X-Request-Token": activeReceipt.token } });
      showReceipt(activeReceipt, data);
      if (data.status === "pending") note.textContent = "We’ve checked: your question is still pending. Please come back later. Your receipt is saved on this device.";
    } catch (error) { showError(error.name === "TimeoutError" ? "The check took too long. Your receipt is safe; try again later." : error.message); }
    finally { checking = false; check.disabled = false; }
  }
  const updateCount = () => { counter.textContent = question.value.length + " / 6000"; };
  question.addEventListener("input", updateCount);
  for (const prompt of document.querySelectorAll("[data-prompt]")) {
    prompt.addEventListener("click", () => { question.value = prompt.dataset.prompt; attempted = null; updateCount(); question.focus(); });
  }
  submit.innerHTML = apiBase ? 'Send question <span aria-hidden="true">↗</span>' : 'Prepare question <span aria-hidden="true">↗</span>';
  if (apiBase) document.querySelector("#delivery-note").textContent = "An early, delayed-answer experience. Send your question, keep your receipt, and return to check the answer.";
  if (apiBase && settings.emailDeliveryEnabled === true) {
    email.disabled = false;
    document.querySelector("#email-help").textContent = "Optional. Only used to send the answer you requested.";
  } else {
    email.disabled = true;
    document.querySelector("#email-help").textContent = "Email delivery is being prepared. No email address is collected in this preview.";
  }
  for (const field of [question, email]) field.addEventListener("input", () => { attempted = null; });
  form.addEventListener("submit", async event => {
    event.preventDefault(); showError("");
    if (!form.reportValidity()) return;
    const text = question.value.trim();
    if (text.length < 10) { showError("Add a little more detail — at least 10 characters."); question.focus(); return; }
    if (form.elements.website.value) return;
    if (!apiBase) {
      receipt.hidden = false; status.textContent = "Draft · not submitted";
      title.textContent = "A clear question is a good start.";
      note.textContent = "Your question is prepared in this tab. Answer delivery isn’t connected yet, so nothing has been sent. You can copy your question to keep it.";
      idLabel.textContent = uuid();
      answer.hidden = true; check.hidden = true; copy.hidden = false; forget.hidden = true;
      document.querySelector("#consent-summary").textContent = "Community sharing: " + (communityChoice.checked ? "permission noted in this draft; still private and subject to moderation." : "not selected.") + "\nHuman help: " + (humanChoice.checked ? "interest noted in this draft; no contact details collected, nobody contacted." : "not selected.") + "\nNothing is submitted, saved as a lead, or published.";
      activeReceipt = null;
      receipt.scrollIntoView({ block: "nearest", behavior: "auto" });
      return;
    }
    const identity = attempted || makeIdentity(); attempted = identity;
    submit.disabled = true;
    try {
      const data = await callApi("/v1/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Request-Token": identity.token },
        body: JSON.stringify({ request_id: identity.request_id, agent, source_site: sourceSite, question: text, email: email.disabled ? "" : email.value.trim(), website: form.elements.website.value, options: collectOptions() })
      });
      if (data.request_id !== identity.request_id || !["pending", "answered"].includes(data.status)) throw new Error("The service returned an unexpected receipt. Keep your question and try again later.");
      saveReceipt(identity); attempted = null; email.value = "";
      showReceipt(identity, data);
      receipt.scrollIntoView({ block: "nearest", behavior: "auto" });
    } catch (error) { showError(error.name === "TimeoutError" ? "The connection took too long. Try again with the same question; we’ll avoid a duplicate request." : error.message); }
    finally { submit.disabled = false; }
  });
  check.addEventListener("click", checkAnswer);
  copy.addEventListener("click", async () => {
    const text = activeReceipt ? receiptLink(activeReceipt) : question.value.trim();
    try { await navigator.clipboard.writeText(text); copy.textContent = activeReceipt ? "Receipt link copied" : "Question copied"; }
    catch { showError("Copy isn’t available here. You can select and copy the question or request ID manually."); }
  });
  forget.addEventListener("click", () => {
    try { localStorage.removeItem(storageKey); } catch {}
    activeReceipt = null; receipt.hidden = true; showError(""); question.focus();
  });
  if (apiBase) {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const fromLink = { request_id: fragment.get("request"), token: fragment.get("token") };
    const valid = value => value && /^[0-9a-f-]{36}$/i.test(value.request_id) && /^[0-9a-f]{64}$/i.test(value.token);
    if (valid(fromLink)) {
      saveReceipt(fromLink);
      history.replaceState(null, "", location.pathname + location.search);
    } else {
      try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (valid(saved)) activeReceipt = saved; } catch {}
    }
    if (activeReceipt) { showReceipt(activeReceipt, { status: "pending" }); checkAnswer(); }
  }
  updateCount();
})();
