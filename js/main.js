/* Tech Paradise Hub — cinematic variant */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = window.innerHeight, vw = window.innerWidth;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- Load-in ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add("is-loaded"); });
  });

  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Hero orb (3D point sphere on canvas) ---------- */
  var canvas = document.getElementById("orb");
  var hero = document.querySelector(".hero");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var heroP = 0;          // hero scroll progress 0..1
  var mx = 0, my = 0;     // mouse -1..1
  var rot = 0.6;
  var pts = [], links = [];
  var W = 0, H = 0, dpr = 1;
  var N = 380;

  function buildOrb() {
    var golden = Math.PI * (3 - Math.sqrt(5));
    pts = [];
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var t = golden * i;
      pts.push({ x: Math.cos(t) * r, y: y, z: Math.sin(t) * r });
    }
    links = [];
    for (var a = 0; a < N; a++) {
      var best = [];
      for (var b = 0; b < N; b++) {
        if (a === b) continue;
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, dz = pts[a].z - pts[b].z;
        best.push([dx * dx + dy * dy + dz * dz, b]);
      }
      best.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < 2; k++) if (a < best[k][1]) links.push([a, best[k][1]]);
    }
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawOrb() {
    ctx.clearRect(0, 0, W, H);
    var scale = Math.min(W, H) * (vw < 800 ? 0.34 : 0.4) * (1 - heroP * 0.45);
    var cx = W * (vw < 800 ? 0.5 : 0.68);
    var cy = H * (vw < 800 ? 0.34 : 0.46) - heroP * H * 0.18;
    var ry = rot + mx * 0.5, rx = -0.35 + my * 0.25;
    var cyaw = Math.cos(ry), syaw = Math.sin(ry), cp = Math.cos(rx), sp = Math.sin(rx);
    var proj = new Array(N);
    for (var i = 0; i < N; i++) {
      var p = pts[i];
      var x = p.x * cyaw + p.z * syaw;
      var z = -p.x * syaw + p.z * cyaw;
      var y = p.y * cp - z * sp;
      z = p.y * sp + z * cp;
      var persp = 1 / (1.9 - z * 0.55);
      proj[i] = { x: cx + x * scale * persp * 1.9, y: cy + y * scale * persp * 1.9, z: z };
    }
    ctx.lineWidth = 1;
    for (var l = 0; l < links.length; l++) {
      var A = proj[links[l][0]], B = proj[links[l][1]];
      var depth = (A.z + B.z) * 0.5;
      if (depth < -0.2) continue;
      ctx.strokeStyle = "rgba(47,179,163," + (0.08 + depth * 0.22).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    for (var j = 0; j < N; j++) {
      var q = proj[j];
      var a = 0.25 + (q.z + 1) * 0.375;
      ctx.fillStyle = q.z > 0.35 ? "rgba(242,176,30," + a.toFixed(2) + ")" : "rgba(127,200,192," + (a * 0.8).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(q.x, q.y, 1.2 + (q.z + 1) * 1.3, 0, 6.2832);
      ctx.fill();
    }
    canvas.style.opacity = String(1 - heroP * 0.9);
  }

  var orbVisible = true;
  function orbLoop() {
    if (orbVisible) {
      if (!reduce) rot += 0.0035;
      drawOrb();
    }
    requestAnimationFrame(orbLoop);
  }

  if (canvas && ctx) {
    buildOrb();
    sizeCanvas();
    drawOrb();
    if (!reduce) {
      window.addEventListener("pointermove", function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { orbVisible = en[0].isIntersecting; }).observe(hero);
      }
      orbLoop();
    }
  }

  /* ---------- Word-by-word statements ---------- */
  var statements = Array.prototype.slice.call(document.querySelectorAll(".statement"));
  statements.forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    el._words = el.querySelectorAll(".w");
    if (reduce) el._words.forEach(function (s) { s.classList.add("lit"); });
  });

  function updateStatements() {
    if (reduce) return;
    statements.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = clamp((vh * 0.88 - r.top) / (vh * 0.5), 0, 1);
      var n = Math.round(p * el._words.length);
      for (var i = 0; i < el._words.length; i++) {
        el._words[i].classList.toggle("lit", i < n);
      }
    });
  }

  /* ---------- Pinned sections ---------- */
  var hscroll = document.querySelector(".hscroll");
  var htrack = document.querySelector(".htrack");
  var hbar = document.querySelector(".hprogress i");
  var crash = document.querySelector(".crash");
  var dayItems = crash ? crash.querySelectorAll(".day-item") : [];
  var dayBig = document.getElementById("day-big");
  var dots = crash ? crash.querySelectorAll(".day-dots i") : [];
  var pinned = false;
  var activeDay = -1;

  function setupPinned() {
    vh = window.innerHeight; vw = window.innerWidth;
    var want = !reduce && vw >= 900 && vh >= 560;
    pinned = want;
    if (hscroll) {
      hscroll.classList.toggle("is-pinned", want);
      if (want) {
        hscroll.style.height = (htrack.scrollWidth - vw + vh) + "px";
      } else {
        hscroll.style.height = "";
        htrack.style.transform = "";
      }
    }
    if (crash) {
      crash.classList.toggle("is-pinned", want);
      activeDay = -1;
      if (!want) dayItems.forEach(function (d) { d.classList.remove("is-active"); });
    }
    if (canvas && ctx) { sizeCanvas(); if (reduce) drawOrb(); }
  }

  function updatePinned() {
    if (!pinned) return;
    if (hscroll) {
      var r = hscroll.getBoundingClientRect();
      var total = hscroll.offsetHeight - vh;
      var p = clamp(-r.top / total, 0, 1);
      var dist = htrack.scrollWidth - vw;
      htrack.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
      if (hbar) hbar.style.width = (p * 100).toFixed(1) + "%";
    }
    if (crash) {
      var cr = crash.getBoundingClientRect();
      var cp = clamp(-cr.top / (crash.offsetHeight - vh), 0, 0.9999);
      var idx = Math.floor(cp * dayItems.length);
      if (idx !== activeDay) {
        activeDay = idx;
        dayItems.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
        dots.forEach(function (d, i) { d.classList.toggle("on", i <= idx); });
        if (dayBig) dayBig.textContent = String(idx + 1);
      }
    }
  }

  /* ---------- Scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      heroP = clamp(window.scrollY / window.innerHeight, 0, 1);
      if (reduce && canvas && ctx) drawOrb();
      updateStatements();
      updatePinned();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var rz;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(function () { setupPinned(); onScroll(); }, 150);
  });
  window.addEventListener("load", function () { setupPinned(); onScroll(); });
  setupPinned();
  onScroll();

  /* ---------- Cursor glow ---------- */
  var cursor = document.querySelector(".cursor");
  if (cursor && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    root.classList.add("has-cursor");
    var tx = vw / 2, ty = vh / 2, cx = tx, cy = ty;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;
  var statusEl = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function setError(field, msg) {
    var wrap = field.closest(".field");
    var out = wrap.querySelector(".error-msg");
    wrap.classList.toggle("has-error", !!msg);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (out) out.textContent = msg || "";
  }

  function validate() {
    var ok = true;
    var f = form.elements;
    var nameOk = f["name"].value.trim().length >= 2;
    setError(f["name"], nameOk ? "" : "Enter your full name."); if (!nameOk) ok = false;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f["email"].value.trim());
    setError(f["email"], emailOk ? "" : "Enter a valid email address, like name@example.com."); if (!emailOk) ok = false;
    var ph = f["phone"].value.replace(/[\s()+-]/g, "");
    var phOk = ph === "" || /^\d{10,13}$/.test(ph);
    setError(f["phone"], phOk ? "" : "Enter a phone number with 10 to 13 digits, or leave it blank."); if (!phOk) ok = false;
    setError(f["course"], f["course"].value ? "" : "Choose the course you are asking about."); if (!f["course"].value) ok = false;
    var mOk = f["message"].value.trim().length >= 10;
    setError(f["message"], mOk ? "" : "Write at least 10 characters so we can answer properly."); if (!mOk) ok = false;
    setError(f["consent"], f["consent"].checked ? "" : "Tick this box so we can reply to you."); if (!f["consent"].checked) ok = false;
    return ok;
  }

  function showStatus(kind, text) { statusEl.className = "form-status " + kind; statusEl.textContent = text; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.className = "form-status";
    if (!validate()) {
      showStatus("is-err", "Fix the highlighted fields and send again.");
      var bad = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      if (bad) bad.focus();
      return;
    }
    if (form.elements["botcheck"] && form.elements["botcheck"].checked) return;
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    submitBtn.disabled = true; submitBtn.textContent = "Sending…";
    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
      .then(function (r) {
        if (r.ok && r.body.success) {
          form.reset();
          showStatus("is-ok", "Message sent. We will reply to your email within one working day.");
        } else { throw new Error("failed"); }
      })
      .catch(function () {
        showStatus("is-err", "Your message was not sent. Check your connection and try again, or email us directly at the address on this page.");
      })
      .finally(function () { submitBtn.disabled = false; submitBtn.textContent = "Send message"; });
  });
})();
