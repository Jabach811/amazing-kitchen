(function () {
  "use strict";

  // Hours in America/Los_Angeles, 24h. null = closed.
  // Index matches the weekday index below: 0 = Sunday.
  var HOURS = [
    { open: 11, close: 21 }, // Sun
    null,                    // Mon
    { open: 11, close: 21 }, // Tue
    { open: 11, close: 21 }, // Wed
    { open: 11, close: 21 }, // Thu
    { open: 11, close: 21 }, // Fri
    { open: 11, close: 21 }  // Sat
  ];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* ---------- Local time in Tracy ----------
     Read the parts straight out of Intl rather than formatting a date to a
     string and parsing it back. The round trip is not guaranteed by the spec
     and has broken in Safari before. */
  function tracyNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    var found = {};
    parts.forEach(function (p) { found[p.type] = p.value; });

    var shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      day: shortNames.indexOf(found.weekday),
      hour: parseInt(found.hour, 10) + parseInt(found.minute, 10) / 60
    };
  }

  var t = tracyNow();

  function clockLabel(h) {
    var suffix = h >= 12 ? "pm" : "am";
    var display = h > 12 ? h - 12 : h;
    return display + suffix;
  }

  var status = document.getElementById("open-status");
  if (status && t.day >= 0) {
    status.classList.remove("neutral");
    var today = HOURS[t.day];
    if (today && t.hour >= today.open && t.hour < today.close) {
      status.textContent = "Open now until " + clockLabel(today.close);
    } else if (today && t.hour < today.open) {
      status.textContent = "Opens at " + clockLabel(today.open) + " today";
      status.classList.add("closed");
    } else {
      var next = (t.day + 1) % 7;
      while (!HOURS[next]) next = (next + 1) % 7;
      status.textContent = "Closed — back " + DAY_NAMES[next] + " at " + clockLabel(HOURS[next].open);
      status.classList.add("closed");
    }
  }

  var todayRow = document.querySelector('#hours-table tr[data-day="' + t.day + '"]');
  if (todayRow) todayRow.classList.add("today");

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  function setNav(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      setNav(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setNav(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Give the header back on the way down (phones only) ---------- */
  var header = document.querySelector(".site-header");
  var lastY = window.pageYOffset;
  var ticking = false;

  function trackChrome() {
    var y = window.pageYOffset;
    var small = window.matchMedia("(max-width: 720px)").matches;
    if (header && small && !nav.classList.contains("open")) {
      if (y > 240 && y > lastY + 6) document.body.classList.add("chrome-up");
      else if (y < lastY - 6) document.body.classList.remove("chrome-up");
    } else {
      document.body.classList.remove("chrome-up");
    }
    lastY = y;
    ticking = false;
  }

  /* ---------- Which menu section am I in ---------- */
  var jumpLinks = Array.prototype.slice.call(document.querySelectorAll(".jump a"));
  var courses = jumpLinks.map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  });
  var jumpBar = document.querySelector(".jump");
  var current = -1;

  function trackSection() {
    if (!jumpBar) return;
    var line = jumpBar.getBoundingClientRect().bottom + 12;
    var found = 0;
    for (var i = 0; i < courses.length; i++) {
      if (courses[i] && !courses[i].classList.contains("is-filtered") &&
          courses[i].getBoundingClientRect().top <= line) found = i;
    }
    if (found === current) return;
    jumpLinks.forEach(function (a) { a.classList.remove("is-current"); });
    jumpLinks[found].classList.add("is-current");
    current = found;

    // Keep the live link inside the swipeable strip on a phone.
    var strip = jumpBar.querySelector("ul");
    if (strip.scrollWidth > strip.clientWidth) {
      var link = jumpLinks[found];
      strip.scrollTo({
        left: link.offsetLeft - strip.clientWidth / 2 + link.offsetWidth / 2,
        behavior: "smooth"
      });
    }
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      trackChrome();
      trackSection();
    });
  }, { passive: true });

  trackSection();

  /* ---------- Menu search ---------- */
  var search = document.getElementById("menu-search");
  var count = document.getElementById("search-count");

  if (search) {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".items li"));
    var haystack = rows.map(function (li) { return li.textContent.toLowerCase(); });
    var sections = Array.prototype.slice.call(document.querySelectorAll(".course"));

    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var hits = 0;

      rows.forEach(function (li, i) {
        var match = !q || haystack[i].indexOf(q) !== -1;
        li.classList.toggle("is-filtered", !match);
        if (match) hits++;
      });

      sections.forEach(function (sec) {
        var any = sec.querySelector(".items li:not(.is-filtered)");
        sec.classList.toggle("is-filtered", !any);
      });

      if (!q) count.textContent = "";
      else if (hits === 0) count.textContent = "Nothing matches “" + search.value.trim() + "”. Call and ask — we cook things that are not on the page.";
      else count.textContent = hits + (hits === 1 ? " dish" : " dishes") + " match.";

      current = -1;
      trackSection();
    });
  }

  /* ---------- Count the calls this site actually produces ---------- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!link) return;
    var detail = { number: link.getAttribute("href").replace("tel:", ""), place: link.dataset.place || "page" };
    if (window.dataLayer) window.dataLayer.push({ event: "call_click", call_number: detail.number, call_place: detail.place });
    document.dispatchEvent(new CustomEvent("call-click", { detail: detail }));
  });
})();
