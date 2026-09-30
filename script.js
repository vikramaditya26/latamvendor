(function () {
  "use strict";

  var LANGS = ["pt", "es", "en"];
  var LANG_NAMES = { pt: ["Português", "PT"], es: ["Español", "ES"], en: ["English", "EN"] };
  var PAGE = document.body.getAttribute("data-page");

  // Every visit opens in Portuguese. A language picked with the toggle only
  // sticks for this tab, so it carries across pages but a fresh visit starts
  // in Portuguese again.
  var lang = null;
  try { lang = sessionStorage.getItem("awign_lang"); } catch (e) {}
  if (LANGS.indexOf(lang) === -1) lang = "pt";

  var answered = [];
  var revealObserver = null;
  var revealFallback = null;

  // Only opt into the hidden-then-reveal treatment when we can actually
  // drive it; otherwise the markup just renders as-is.
  var animEnabled =
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (animEnabled) document.documentElement.classList.add("anim");

  function t() {
    return I18N[lang];
  }

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function waUrl(text) {
    return (
      "https://wa.me/" +
      CONFIG.WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(text || CONFIG.WHATSAPP_MESSAGE[lang] || CONFIG.WHATSAPP_MESSAGE.en)
    );
  }

  var WA_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.35A10 10 0 1012 2zm0 1.9a8.1 8.1 0 11-4.2 15l-.3-.18-2.6.7.7-2.55-.2-.31A8.1 8.1 0 0112 3.9zm-3.6 3.7c-.17 0-.45.06-.68.31-.23.25-.9.87-.9 2.12s.92 2.46 1.05 2.63c.13.17 1.8 2.86 4.42 3.9 2.18.86 2.62.69 3.1.64.47-.04 1.5-.61 1.72-1.2.21-.6.21-1.1.15-1.2-.06-.11-.23-.17-.48-.3-.25-.12-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.12s-.65.82-.8.99c-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.66-1.25-1.48-1.4-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.38-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.77-1.87-.2-.49-.4-.42-.55-.43h-.47z"/></svg>';
  var CHECK =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var CROSS =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ---------------- nav + footer (shared by every page) ---------------- */

  function renderNav() {
    var seg = LANGS.map(function (l) {
      return '<button type="button" id="l-' + l + '" onclick="setLang(\'' + l + '\')" lang="' + l + '">' +
        '<span class="l-full">' + LANG_NAMES[l][0] + '</span><span class="l-short">' + LANG_NAMES[l][1] + "</span></button>";
    }).join("");

    $("nav").innerHTML =
      '<nav class="nav"><div class="shell nav__in">' +
      '<a class="brand" href="index.html"><img src="assets/logo.png" alt="Awign" /></a>' +
      '<div class="nav__links">' +
      '<a href="index.html#how" data-i18n="navHow"></a>' +
      '<a href="training.html" data-i18n="navTraining"></a>' +
      "</div>" +
      '<div class="nav__tools">' +
      '<div class="seg" role="group" aria-label="Language">' + seg + "</div>" +
      '<button type="button" class="iconbtn" id="theme-btn" onclick="toggleTheme()">' +
      '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>' +
      "</button>" +
      '<a class="btn btn--primary nav__cta" href="apply.html" data-i18n="navApply"></a>' +
      "</div></div></nav>";
  }

  function renderFoot() {
    $("foot").innerHTML =
      '<footer class="foot"><div class="shell"><div class="foot__top">' +
      '<div><a class="brand" href="index.html"><img src="assets/logo.png" alt="Awign" /></a>' +
      '<p class="foot__tag" data-i18n="footTag"></p><div class="foot__social" id="social"></div></div>' +
      '<div class="foot__col"><h4 data-i18n="footProgram"></h4><ul>' +
      '<li><a href="index.html#how" data-i18n="fHow"></a></li>' +
      '<li><a href="training.html" data-i18n="fTraining"></a></li>' +
      '<li><a href="apply.html" data-i18n="fApplyLink"></a></li></ul></div>' +
      '<div class="foot__col"><h4 data-i18n="footCompany"></h4><ul>' +
      '<li><a href="' + CONFIG.ABOUT_URL + '" target="_blank" rel="noopener" data-i18n="fAbout"></a></li>' +
      '<li><a href="' + CONFIG.OFFICIAL_PAGE_URL + '" target="_blank" rel="noopener" data-i18n="fOfficial"></a></li>' +
      '<li><a class="js-wa" target="_blank" rel="noopener" data-i18n="fContactLink"></a></li>' +
      '<li><a class="js-wa" target="_blank" rel="noopener">' + esc(CONFIG.WHATSAPP_DISPLAY) + "</a></li></ul></div>" +
      '<div class="foot__col"><h4 data-i18n="footSupport"></h4><ul>' +
      '<li><a href="privacy.html" data-i18n="fPrivacy"></a></li>' +
      '<li><a href="terms.html" data-i18n="fTerms"></a></li></ul></div>' +
      '</div></div><div class="foot__bar"><span data-i18n="footRights"></span></div></footer>';

    var icons = {
      instagram:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none"/></svg>',
      facebook:
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg>',
      twitter:
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.2L5.9 22H3.1l7-8L2 2h6.2l4.3 5.7L18.2 2zm-1 18h1.6L7.9 3.7H6.2L17.2 20z"/></svg>',
    };
    var host = $("social");
    Object.keys(icons).forEach(function (k) {
      if (!CONFIG.SOCIAL[k]) return;
      var a = document.createElement("a");
      a.href = CONFIG.SOCIAL[k];
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", k);
      a.innerHTML = icons[k];
      host.appendChild(a);
    });
  }

  /* ---------------- video ---------------- */

  function makeVideo(src, opts) {
    opts = opts || {};
    var v = document.createElement("video");
    v.src = src;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = "metadata";
    v.loop = !!opts.loop;
    if (opts.controls) v.controls = true;
    return v;
  }

  function muteButton(video) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "vid__mute";
    b.setAttribute("aria-label", "Toggle sound");
    b.innerHTML =
      '<svg class="i-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>' +
      '<svg class="i-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14"/></svg>';
    b.addEventListener("click", function (e) {
      e.preventDefault();
      video.muted = !video.muted;
      b.classList.toggle("unmuted", !video.muted);
      if (!video.muted) video.play().catch(function () {});
      track("video_mute_toggle", { muted: video.muted });
    });
    return b;
  }

  // Hero / app: autoplaying, looping, with our own mute control.
  function renderFeature(hostId, src) {
    var host = $(hostId);
    if (!host) return;
    host.innerHTML = "";
    if (!src) return;
    var v = makeVideo(src, { loop: true });
    v.autoplay = true;
    host.appendChild(v);
    host.appendChild(muteButton(v));
    v.play().catch(function () {});
  }

  // Example clips: controls, and they play while hovered on desktop.
  function renderClips(hostId, labels, sources, kind) {
    var host = $(hostId);
    if (!host) return;
    host.innerHTML = "";

    labels.forEach(function (label, i) {
      var wrap = document.createElement("div");
      wrap.className = "clip clip--" + kind;

      var box = document.createElement("div");
      box.className = "vid";
      // "#t=0.1" makes phones paint the first frame instead of a black box.
      var v = makeVideo(sources[i] + "#t=0.1", { loop: true, controls: true });
      box.appendChild(v);
      wrap.appendChild(box);

      var title = document.createElement("div");
      title.className = "clip__t";
      title.textContent = label;
      wrap.appendChild(title);

      wrap.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover: hover)").matches) v.play().catch(function () {});
      });
      wrap.addEventListener("mouseleave", function () {
        if (window.matchMedia("(hover: hover)").matches && !v.paused) v.pause();
      });

      host.appendChild(wrap);
    });
  }

  /* ---------------- shared renderers ---------------- */

  function renderText() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var v = t()[nodes[i].getAttribute("data-i18n")];
      if (typeof v === "string") nodes[i].textContent = v;
    }
    LANGS.forEach(function (l) {
      $("l-" + l).classList.toggle("on", l === lang);
    });
    $("theme-btn").setAttribute("aria-label", t().themeLabel);

    var was = document.querySelectorAll(".js-wa");
    for (var j = 0; j < was.length; j++) was[j].href = waUrl();
  }

  function renderPhones() {
    var hosts = document.querySelectorAll(".phones");
    for (var i = 0; i < hosts.length; i++) {
      hosts[i].innerHTML = CONFIG.PHONES.map(function (p) {
        return "<span>" + esc(p) + "</span>";
      }).join("");
    }
  }

  function renderList(hostId, items, icon) {
    var host = $(hostId);
    if (!host) return;
    host.innerHTML = items.map(function (item) {
      return "<li>" + icon + "<span>" + esc(item) + "</span></li>";
    }).join("");
  }

  function renderSteps(hostId, steps, extra) {
    var host = $(hostId);
    if (!host) return;
    host.innerHTML = steps.map(function (s, i) {
      return '<div class="stp"><div class="stp__n">' + (i + 1) + "</div><div><h3>" + esc(s.t) +
        "</h3><p>" + esc(s.d) + "</p>" + (extra ? extra(i) : "") + "</div></div>";
    }).join("");
  }

  function renderFaq() {
    var host = $("faq-list");
    if (!host) return;
    host.innerHTML = "";
    t().faq.forEach(function (item) {
      var d = document.createElement("details");
      d.className = "card rv";
      d.innerHTML = "<summary>" + esc(item.q) + "</summary><p>" + esc(item.a) + "</p>";
      host.appendChild(d);
    });
  }

  /* ---------------- training page ---------------- */

  function storeButtons() {
    var play =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d7fe" d="M3.6 1.8 13.8 12 3.6 22.2a1.2 1.2 0 0 1-.5-1V2.8c0-.4.2-.8.5-1z"/><path fill="#ffce00" d="m17.3 8.5 3.2 1.8c1 .6 1 2.8 0 3.4l-3.2 1.8L13.8 12z"/><path fill="#00f076" d="M3.6 1.8c.4-.3 1-.3 1.5 0l12.2 6.7-3.5 3.5z"/><path fill="#ff3a44" d="M13.8 12l3.5 3.5-12.2 6.7c-.5.3-1.1.3-1.5 0z"/></svg>';
    var apple =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.2zM13.9 5c.7-.8 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4z"/></svg>';
    function btn(href, icon, top, name, ev) {
      return '<a class="store" href="' + href + '" target="_blank" rel="noopener" onclick="track(\'' + ev + '\')">' +
        icon + "<span><small>" + esc(top) + "</small><b>" + name + "</b></span></a>";
    }
    var playUrl = CONFIG.PLAY_STORE_URL + "&hl=" + (CONFIG.PLAY_STORE_HL[lang] || "en");
    return '<div class="stp__extra stores">' +
      btn(playUrl, play, t().storePlayTop, "Google Play", "play_store") +
      btn(CONFIG.APP_STORE_URL, apple, t().storeAppTop, "App Store", "app_store") +
      "</div>";
  }

  function renderSetup() {
    var host = $("setup-list");
    if (!host) return;
    host.innerHTML = t().setupRows.map(function (r) {
      return '<div class="setup__row">' +
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        "<span><b>" + esc(r.t) + "</b> — " + esc(r.d) + "</span></div>";
    }).join("");
  }

  function renderQuiz() {
    var host = $("quiz");
    if (!host) return;
    host.innerHTML = "";
    answered = new Array(t().quiz.length).fill(false);

    t().quiz.forEach(function (item, qi) {
      var block = document.createElement("div");
      block.className = "qq card card--edge card--spot rv";

      var q = document.createElement("p");
      q.className = "qq__t";
      q.textContent = qi + 1 + ". " + item.q;
      block.appendChild(q);

      var opts = document.createElement("div");
      opts.className = "qq__opts";
      item.opts.forEach(function (label, oi) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "qq__opt";
        b.textContent = label;
        b.addEventListener("click", function () {
          answer(qi, oi, block);
        });
        opts.appendChild(b);
      });
      block.appendChild(opts);

      var fb = document.createElement("p");
      fb.className = "qq__fb";
      fb.textContent = item.feedback;
      block.appendChild(fb);

      host.appendChild(block);
    });

    meter();
  }

  function answer(qi, oi, block) {
    var item = t().quiz[qi];
    var btns = block.querySelectorAll(".qq__opt");
    var right = oi === item.correct;

    for (var i = 0; i < btns.length; i++) {
      btns[i].disabled = true;
      if (i === item.correct) btns[i].classList.add("ok");
      if (i === oi && !right) btns[i].classList.add("no");
    }
    block.querySelector(".qq__fb").classList.add("show");

    if (!answered[qi]) {
      answered[qi] = true;
      meter();
      track("quiz_answer", { q: qi + 1, first_try_correct: right });
    }

    if (!right) {
      setTimeout(function () {
        for (var i = 0; i < btns.length; i++) {
          btns[i].disabled = false;
          btns[i].classList.remove("ok", "no");
        }
      }, 1200);
    }
  }

  function meter() {
    var total = answered.length;
    var done = answered.filter(Boolean).length;
    $("q-count").textContent = done + "/" + total;
    $("q-fill").style.width = (total ? (done / total) * 100 : 0) + "%";
    if (total && done === total) track("quiz_complete");
  }

  function renderTraining() {
    renderFeature("v-hero", CONFIG.VIDEO.hero[lang]);
    renderFeature("v-app", CONFIG.VIDEO.app[lang]);
    renderSetup();
    renderClips("clips-good", t().goodClips, CONFIG.VIDEO.good, "good");
    renderClips("clips-bad", t().badClips, CONFIG.VIDEO.bad, "bad");
    renderList("do-list", t().do, CHECK);
    renderList("dont-list", t().dont, CROSS);
    renderSteps("app-steps", t().appSteps, function (i) {
      if (i === 0) return storeButtons();
      if (i === 2) return '<p class="stp__hint">' + esc(t().appStep3Hint) + "</p>";
      return "";
    });
    renderQuiz();
  }

  /* ---------------- vendor pitch page ---------------- */

  function renderHome() {
    renderFeature("v-hero", CONFIG.VIDEO.hero[lang]);
    renderSteps("how-steps", t().howSteps);
    renderList("you-list", t().you, CHECK);
    renderList("we-list", t().we, CHECK);
    renderFaq();
  }

  /* ---------------- legal pages ---------------- */

  function renderLegal() {
    var doc = t()[PAGE];
    $("legal").innerHTML =
      '<span class="eyebrow">Legal</span><h1>' + esc(doc.title) + '</h1><p class="meta">' + esc(doc.meta) + "</p>" +
      doc.sections.map(function (s) {
        return "<h2>" + esc(s.h) + "</h2><p>" + esc(s.p) + "</p>";
      }).join("");
  }

  /* ---------------- application form ---------------- */

  var FIELDS = [
    { id: "company", label: "fCompany", required: true, auto: "organization" },
    { id: "country", label: "fCountry", required: true, type: "select" },
    { id: "taxId", label: "fTaxId", hint: "fTaxIdHint", required: true },
    { id: "contact", label: "fContact", required: true, auto: "name" },
    { id: "whatsapp", label: "fWhatsapp", hint: "fWhatsappHint", required: true, type: "tel", auto: "tel" },
    { id: "email", label: "fEmail", required: true, type: "email", auto: "email" },
    { id: "city", label: "fCity", auto: "address-level2" },
    { id: "workers", label: "fWorkers", required: true, type: "number" },
    { id: "phones", label: "fPhones", hint: "fPhonesHint", type: "number" },
    { id: "message", label: "fMessage", type: "textarea", wide: true },
  ];

  // Re-rendering on a language switch must not wipe what was typed.
  function formValues() {
    var out = {};
    FIELDS.forEach(function (f) {
      var el = $("f-" + f.id);
      if (el) out[f.id] = el.value.trim();
    });
    return out;
  }

  function renderForm() {
    var form = $("apply-form");
    if (!form) return;
    var keep = formValues();
    var agreed = $("f-consent") && $("f-consent").checked;

    var html = FIELDS.map(function (f) {
      var id = "f-" + f.id;
      var attrs = ' id="' + id + '" name="' + f.id + '"' + (f.required ? " required" : "") +
        (f.auto ? ' autocomplete="' + f.auto + '"' : "");
      var input;
      if (f.type === "select") {
        input = "<select" + attrs + '><option value="">' + esc(t().fCountryPick) + "</option>" +
          t().fCountries.map(function (c, i) {
            // Value stays in English so the sheet is consistent across languages.
            return '<option value="' + esc(I18N.en.fCountries[i]) + '">' + esc(c) + "</option>";
          }).join("") + "</select>";
      } else if (f.type === "textarea") {
        input = "<textarea" + attrs + ' rows="3"></textarea>';
      } else if (f.type === "number") {
        input = "<input" + attrs + ' type="number" min="0" step="1" inputmode="numeric" />';
      } else {
        input = "<input" + attrs + ' type="' + (f.type || "text") + '" />';
      }
      return '<div class="field' + (f.wide ? " field--wide" : "") + '"><label for="' + id + '">' + esc(t()[f.label]) +
        (f.required ? "" : ' <em>(' + esc(t().fOptional) + ")</em>") + "</label>" + input +
        (f.hint ? '<small class="field__hint">' + esc(t()[f.hint]) + "</small>" : "") +
        '<small class="field__err"></small></div>';
    }).join("");

    html +=
      // Honeypot: hidden from people, tempting to bots.
      '<div class="field--hp" aria-hidden="true"><label>Website<input type="text" id="f-website" name="website" tabindex="-1" autocomplete="off" /></label></div>' +
      '<label class="check field--wide"><input type="checkbox" id="f-consent" required /><span>' + esc(t().fConsent) + "</span></label>" +
      '<p class="form__error field--wide" id="form-error" hidden></p>' +
      '<div class="field--wide"><button type="submit" class="btn btn--primary btn--lg" id="f-submit">' + esc(t().fSubmit) + "</button></div>";

    form.innerHTML = html;
    FIELDS.forEach(function (f) {
      if (keep[f.id]) $("f-" + f.id).value = keep[f.id];
    });
    if (agreed) $("f-consent").checked = true;
  }

  function validate() {
    var ok = true;
    var first = null;
    FIELDS.forEach(function (f) {
      var el = $("f-" + f.id);
      var wrap = el.closest(".field");
      var msg = "";
      var val = el.value.trim();
      if (f.required && !val) msg = t().fRequired;
      else if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = t().fBadEmail;
      wrap.classList.toggle("has-err", !!msg);
      wrap.querySelector(".field__err").textContent = msg;
      if (msg) {
        ok = false;
        if (!first) first = el;
      }
    });
    var consent = $("f-consent");
    consent.closest(".check").classList.toggle("has-err", !consent.checked);
    if (!consent.checked) {
      ok = false;
      if (!first) first = consent;
    }
    if (first) first.focus();
    return ok;
  }

  function showSuccess() {
    $("apply-form").hidden = true;
    $("apply-ok").hidden = false;
    $("apply-ok").scrollIntoView({ block: "center" });
  }

  function submitForm(e) {
    e.preventDefault();
    if (!validate()) return;

    var data = formValues();
    // A filled honeypot means a bot: pretend it worked and send nothing.
    if ($("f-website").value) return showSuccess();

    data.lang = lang;
    data.submittedAt = new Date().toISOString();

    if (!CONFIG.APPLY_ENDPOINT) {
      // No sheet connected yet: hand the application over on WhatsApp.
      var lines = [t().waFallbackIntro, ""];
      FIELDS.forEach(function (f) {
        if (data[f.id]) lines.push(t()[f.label] + ": " + data[f.id]);
      });
      window.open(waUrl(lines.join("\n")), "_blank", "noopener");
      track("apply_whatsapp");
      return showSuccess();
    }

    var btn = $("f-submit");
    var err = $("form-error");
    btn.disabled = true;
    btn.textContent = t().fSending;
    err.hidden = true;

    // Apps Script web apps don't answer CORS preflights, so this goes as a
    // "simple" request: text/plain body, opaque response.
    fetch(CONFIG.APPLY_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    })
      .then(function () {
        track("apply_submit", { country: data.country });
        showSuccess();
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = t().fSubmit;
        err.textContent = t().fError;
        err.hidden = false;
      });
  }

  /* ---------------- interaction polish ---------------- */

  // Glow that tracks the cursor across a card.
  function wireSpotlights() {
    document.querySelectorAll(".card--spot").forEach(function (card) {
      if (card.dataset.spotWired) return;
      card.dataset.spotWired = "1";
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  function wireReveals() {
    if (!animEnabled) return;

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
    }

    document.querySelectorAll(".rv:not(.in)").forEach(function (el) {
      revealObserver.observe(el);
    });

    // Safety net: if the observer hasn't reported anything — a background
    // tab never composites, so it doesn't fire — show everything anyway
    // rather than leave the page blank.
    clearTimeout(revealFallback);
    revealFallback = setTimeout(function () {
      if (!document.querySelector(".rv.in")) {
        document.querySelectorAll(".rv").forEach(function (el) {
          el.classList.add("in");
        });
      }
    }, 2000);
  }

  /* ---------------- orchestration ---------------- */

  function renderAll() {
    if (PAGE === "home") renderHome();
    if (PAGE === "training") renderTraining();
    if (PAGE === "apply") renderForm();
    if (PAGE === "privacy" || PAGE === "terms") renderLegal();
    renderPhones();
    renderText();
    wireSpotlights();
    wireReveals();
  }

  window.setLang = function (next) {
    if (next === lang) return;
    lang = next;
    try { sessionStorage.setItem("awign_lang", next); } catch (e) {}
    renderAll();
    track("lang_switch", { lang: next });
  };

  window.toggleTheme = function () {
    var root = document.documentElement;
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";

    // Suppress transitions for one frame, or colours that resolve from
    // custom properties get stuck on their old value.
    root.classList.add("theming");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("awign_theme", next); } catch (e) {}

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove("theming");
      });
    });

    track("theme_switch", { theme: next });
  };

  window.track = function (name, props) {
    var payload = Object.assign(
      { event: name, ts: Date.now(), lang: lang, page: PAGE },
      props || {}
    );
    if (CONFIG.ANALYTICS_ENDPOINT) {
      fetch(CONFIG.ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } else {
      console.log("[track]", payload);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    renderFoot();
    renderAll();
    var form = $("apply-form");
    if (form) form.addEventListener("submit", submitForm);
    track("page_view");
  });
})();
