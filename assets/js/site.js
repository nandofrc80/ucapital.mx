/* U·Capital Inmobiliaria — interacciones del sitio (sin dependencias) */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Encabezado: sombra al hacer scroll + menú móvil */
  var nav = $("[data-nav]");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    var toggle = $("[data-nav-toggle]"), mobile = $("[data-nav-mobile]");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.hasAttribute("hidden");
        if (open) mobile.removeAttribute("hidden"); else mobile.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", String(open));
      });
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () { mobile.setAttribute("hidden", ""); toggle.setAttribute("aria-expanded", "false"); });
      });
    }
  }

  /* Carrusel de destacadas */
  var car = $("[data-carousel]");
  if (car) {
    var step = function (dir) {
      var card = car.querySelector(".card");
      var w = card ? card.getBoundingClientRect().width + 28 : car.clientWidth;
      car.scrollBy({ left: dir * w, behavior: "smooth" });
    };
    var prev = $("[data-carousel-prev]"), next = $("[data-carousel-next]");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  }

  /* Filtros del catálogo */
  var filtros = $("[data-filtros]"), grid = $("[data-grid]");
  if (filtros && grid) {
    var cards = $$(".card", grid), out = $("[data-resultados]"), vacio = $("[data-vacio]");
    var params = new URLSearchParams(window.location.search);
    ["tipo", "zona", "estatus", "max", "rec"].forEach(function (k) {
      var el = filtros.elements[k];
      if (el && params.get(k)) el.value = params.get(k);
    });
    var aplicar = function () {
      var f = filtros.elements, n = 0;
      var tipo = f.tipo.value, zona = f.zona.value, est = f.estatus.value;
      var max = parseFloat(f.max.value) || 0, rec = parseFloat(f.rec.value) || 0;
      cards.forEach(function (c) {
        var precio = parseFloat(c.dataset.precio) || 0, r = parseFloat(c.dataset.recamaras) || 0;
        var ok = (!tipo || c.dataset.tipo === tipo) &&
                 (!zona || c.dataset.zona === zona) &&
                 (!est || c.dataset.estatus === est) &&
                 (!max || (precio > 0 && precio <= max) || precio === 0) &&
                 (!rec || r >= rec);
        c.hidden = !ok;
        if (ok) n++;
      });
      if (out) out.textContent = n === 1 ? "1 propiedad" : n + " propiedades";
      if (vacio) vacio.hidden = n > 0;
      var q = new URLSearchParams();
      ["tipo", "zona", "estatus", "max", "rec"].forEach(function (k) { if (f[k].value) q.set(k, f[k].value); });
      var url = window.location.pathname + (q.toString() ? "?" + q.toString() : "");
      window.history.replaceState(null, "", url);
    };
    filtros.addEventListener("change", aplicar);
    filtros.addEventListener("reset", function () { setTimeout(aplicar, 0); });
    aplicar();
  }

  /* Galería con visor */
  var lb = $("[data-lightbox]");
  if (lb) {
    var fotos = [];
    try { fotos = JSON.parse($("[data-lightbox-fotos]", lb).textContent); } catch (e) {}
    var img = $("[data-lightbox-img]", lb), count = $("[data-lightbox-count]", lb), i = 0, last = null;
    var show = function (k) {
      if (!fotos.length) return;
      i = (k + fotos.length) % fotos.length;
      img.src = fotos[i];
      count.textContent = (i + 1) + " / " + fotos.length;
    };
    var open = function (k) { last = document.activeElement; show(k); lb.hidden = false; document.body.style.overflow = "hidden"; $("[data-lightbox-close]", lb).focus(); };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; if (last) last.focus(); };
    $$("[data-lightbox-open]").forEach(function (b) { b.addEventListener("click", function () { open(parseInt(b.dataset.lightboxOpen, 10) || 0); }); });
    $("[data-lightbox-close]", lb).addEventListener("click", close);
    $("[data-lightbox-prev]", lb).addEventListener("click", function () { show(i - 1); });
    $("[data-lightbox-next]", lb).addEventListener("click", function () { show(i + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* Formularios: envío a Formspree sin salir de la página */
  $$("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("[data-submit]", form), err = $("[data-error]", form), ok = $("[data-ok]", form);
      var nombre = form.elements.nombre ? form.elements.nombre.value.trim() : "";
      var subj = $("[data-subject]", form);
      if (subj && nombre && subj.value.indexOf(nombre) === -1) subj.value = subj.value + " · " + nombre;
      if (err) err.hidden = true;
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = "Enviando…"; }
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.classList.add("is-sent");
          if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
        })
        .catch(function () { if (err) err.hidden = false; })
        .then(function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; } });
    });
  });

  /* Aparición suave al hacer scroll */
  if ("IntersectionObserver" in window) {
    var els = $$(".section__head, .card, .steps li, .about__media img, .about__text, .mosaic img, .contacto__form");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
