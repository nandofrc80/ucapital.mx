/* U·Capital Inmobiliaria — interacciones del sitio (sin dependencias) */
(function () {
  "use strict";
  var EN = (document.documentElement.lang || "").indexOf("en") === 0;

  /* Medición en Google Analytics: clics a WhatsApp, formularios y asistente */
  var medir = function (evento, datos) {
    try { if (typeof window.gtag === "function") window.gtag("event", evento, datos || {}); } catch (e) {}
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (!a) return;
    var origen = a.hasAttribute("data-asis-lead") ? "asistente"
      : a.closest(".modelo") ? "modelo"
      : a.closest(".ficha__side, .ficha__movil") ? "ficha"
      : a.classList.contains("wa-float") ? "boton_flotante"
      : a.closest(".nav") ? "menu"
      : a.closest(".footer") ? "pie"
      : a.closest(".asis") ? "asistente_directo"
      : "otro";
    medir("generate_lead", { method: "whatsapp", origen: origen, idioma: EN ? "en" : "es" });
  }, true);
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
      if (out) out.textContent = EN ? (n === 1 ? "1 property" : n + " properties") : (n === 1 ? "1 propiedad" : n + " propiedades");
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

  /* Galería con visor (una galería general y una por modelo) */
  var lb = $("[data-lightbox]");
  if (lb) {
    var grupos = {};
    try { grupos = JSON.parse($("[data-lightbox-fotos]", lb).textContent); } catch (e) {}
    if (Array.isArray(grupos)) grupos = { general: grupos };
    var fotos = [], img = $("[data-lightbox-img]", lb), count = $("[data-lightbox-count]", lb), i = 0, last = null;
    var show = function (k) {
      if (!fotos.length) return;
      i = (k + fotos.length) % fotos.length;
      img.src = fotos[i];
      count.textContent = (i + 1) + " / " + fotos.length;
    };
    var open = function (grupo, k) {
      fotos = grupos[grupo] || grupos.general || [];
      if (!fotos.length) return;
      last = document.activeElement; show(k); lb.hidden = false; document.body.style.overflow = "hidden"; $("[data-lightbox-close]", lb).focus();
    };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; if (last) last.focus(); };
    $$("[data-lightbox-open]").forEach(function (b) {
      b.addEventListener("click", function () { open(b.dataset.lightboxOpen || "general", parseInt(b.dataset.index, 10) || 0); });
    });
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
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = EN ? "Sending…" : "Enviando…"; }
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.classList.add("is-sent");
          medir("generate_lead", { method: "formulario", origen: form.classList.contains("form--compacto") ? "ficha" : "contacto", idioma: EN ? "en" : "es" });
          if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
        })
        .catch(function () { if (err) err.hidden = false; })
        .then(function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; } });
    });
  });

  /* Asistente guiado: preguntas → desarrollos que coinciden → WhatsApp con resumen */
  var asis = $("[data-asis]");
  if (asis) (function () {
    var TX = {}, D = { props: [] };
    try { TX = JSON.parse($("[data-asis-txt]", asis).textContent); D = JSON.parse($("[data-asis-datos]", asis).textContent); } catch (e) { return; }
    var panel = $("[data-asis-panel]", asis), body = $("[data-asis-body]", asis), toggle = $("[data-asis-toggle]", asis);
    var teaser = $("[data-asis-teaser]", asis);
    $("[data-asis-directo-txt]", asis).textContent = TX.directo;
    toggle.setAttribute("aria-label", TX.abrir);
    $(".asis__teaser-txt", asis).textContent = TX.teaser;
    var resp = {}, paso = -1;
    var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                  set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
    var esc = function (t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; };
    var fmt = function (n) { return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
    var etiqueta = function (q, v) { for (var i = 0; i < q.o.length; i++) if (q.o[i][0] === v) return q.o[i][1]; return v; };

    var abrir = function () {
      panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); asis.classList.add("is-open");
      if (teaser) teaser.hidden = true; store.set("asis-visto", "1");
      if (paso === -1) inicio();
    };
    var cerrar = function () { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); asis.classList.remove("is-open"); };
    toggle.addEventListener("click", function () { panel.hidden ? abrir() : cerrar(); });
    $$("[data-asis-open]", asis).forEach(function (b) { b.addEventListener("click", abrir); });
    $("[data-asis-close]", asis).addEventListener("click", cerrar);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) cerrar(); });
    if (teaser) {
      $("[data-asis-teaser-x]", asis).addEventListener("click", function () { teaser.hidden = true; store.set("asis-visto", "1"); });
      if (!store.get("asis-visto")) setTimeout(function () { if (panel.hidden) teaser.hidden = false; }, 9000);
    }

    function inicio() {
      paso = -1; resp = {};
      body.innerHTML = '<p class="asis__msg">' + esc(TX.hola) + '</p><button type="button" class="btn btn--navy btn--block" data-a="start">' + esc(TX.empezar) + '</button>';
      $("[data-a=start]", body).addEventListener("click", function () { medir("asistente_inicio"); pregunta(0); });
    }
    function pregunta(i) {
      paso = i; var q = TX.q[i];
      var h = '<p class="asis__paso">' + (i + 1) + ' / ' + TX.q.length + '</p><p class="asis__msg">' + esc(q.t) + '</p><div class="asis__ops">';
      q.o.forEach(function (o) { h += '<button type="button" class="chip-btn" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; });
      h += '</div><button type="button" class="asis__link" data-a="back">← ' + esc(TX.atras) + '</button>';
      body.innerHTML = h;
      $$("[data-v]", body).forEach(function (b) {
        b.addEventListener("click", function () {
          resp[q.k] = b.getAttribute("data-v");
          if (i + 1 < TX.q.length) pregunta(i + 1); else resultados();
        });
      });
      $("[data-a=back]", body).addEventListener("click", function () { i > 0 ? pregunta(i - 1) : inicio(); });
      var first = $("[data-v]", body); if (first) first.focus();
    }
    function resultados() {
      paso = TX.q.length;
      var pr = (resp.pres || "0-0").split("-"), lo = +pr[0] || 0, hi = +pr[1] || 0, rec = +resp.rec || 0;
      var hits = [];
      D.props.forEach(function (p) {
        var ms = p.m.filter(function (m) {
          if (!(m.p > 0)) return false;
          if (hi && m.p > hi * 1.03) return false;
          if (lo && m.p < lo * 0.9) return false;
          if (rec && Math.max(m.rm, m.r) < rec) return false;
          return true;
        });
        if (ms.length) {
          var min = Math.min.apply(null, ms.map(function (m) { return m.p; }));
          hits.push({ p: p, ms: ms, min: min });
        }
      });
      hits.sort(function (a, b) { return a.min - b.min; });
      hits = hits.slice(0, 4);
      medir("asistente_resultados", { resultados: hits.length, presupuesto: resp.pres || "", recamaras: resp.rec || "" });
      var h = '<p class="asis__msg">' + esc(hits.length ? TX.res_si : TX.res_no) + '</p>';
      if (hits.length) {
        h += '<ul class="asis__res">';
        hits.forEach(function (x) {
          var nombres = x.ms.map(function (m) { return m.n; }).filter(Boolean).join(", ");
          h += '<li><a href="' + esc(x.p.u) + '"><img src="' + esc(x.p.img) + '" alt="" loading="lazy"><span><strong>' + esc(x.p.n) + '</strong><small>' + esc(TX.desde) + ' ' + fmt(x.min) + ' MXN · ' + esc(x.p.zona) + '</small>' + (nombres ? '<small>' + esc(TX.modelos) + ': ' + esc(nombres) + '</small>' : '') + '</span></a></li>';
        });
        h += '</ul>';
      }
      var q = TX.q, lineas = [TX.wa_ini,
        TX.wa_busco + ": " + etiqueta(q[0], resp.para),
        TX.wa_pres + ": " + etiqueta(q[1], resp.pres),
        TX.wa_rec + ": " + etiqueta(q[2], resp.rec),
        TX.wa_cuando + ": " + etiqueta(q[3], resp.cuando)];
      if (hits.length) lineas.push(TX.wa_interes + ": " + hits.map(function (x) { return x.p.n; }).join(", "));
      lineas.push(TX.wa_fin);
      var url = "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(lineas.join("\n"));
      h += '<a class="btn btn--wa btn--block" href="' + url + '" target="_blank" rel="noopener" data-asis-lead>' + esc(TX.cta) + '</a>';
      h += '<p class="asis__nota">' + esc(TX.nota) + '</p><button type="button" class="asis__link" data-a="again">↺ ' + esc(TX.reiniciar) + '</button>';
      body.innerHTML = h;
      $("[data-a=again]", body).addEventListener("click", function () { pregunta(0); });
    }
  })();

  /* Aparición suave al hacer scroll */
  if ("IntersectionObserver" in window) {
    var els = $$(".section__head, .card, .modelo, .steps li, .about__media img, .about__text, .mosaic img, .contacto__form");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();
