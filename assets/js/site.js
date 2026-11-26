/* U·Capital Inmobiliaria — interacciones del sitio (sin dependencias) */
(function () {
  "use strict";
  var EN = (document.documentElement.lang || "").indexOf("en") === 0;

  /* Medición en Google Analytics: clics a WhatsApp, formularios y asistente */
  /* Desarrollo y tipo (Casa / Departamento) de la ficha donde ocurre el lead; "General" fuera de las fichas */
  var contexto = function (datos) {
    var b = document.body.dataset || {};
    datos.desarrollo = b.desarrollo || "General";
    datos.tipo_propiedad = b.tipo || "General";
    return datos;
  };
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
    var mod = a.closest(".modelo"), mt = mod && mod.querySelector(".modelo__title");
    medir("generate_lead", contexto({ method: "whatsapp", origen: origen, idioma: EN ? "en" : "es", modelo: mt ? mt.textContent.trim() : "" }));
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

  /* Vitrina de la portada: pestañas Casas | Departamentos y 3 tarjetas sorteadas en cada visita */
  var vit = $("[data-vitrina]");
  if (vit) {
    var MAX = 3;
    $$("[data-panel]", vit).forEach(function (panel) {
      var cs = $$(".card", panel);
      for (var i = cs.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = cs[i]; cs[i] = cs[j]; cs[j] = t;
      }
      cs.forEach(function (c, k) { panel.appendChild(c); c.hidden = k >= MAX; });
      panel.classList.add("is-listo");
    });
    var tabs = $$("[data-tab]", vit), cta = $("[data-vit-cta]", vit);
    var activar = function (tab, foco) {
      var cual = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$("[data-panel]", vit).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== cual; });
      if (cta) {
        cta.href = cta.getAttribute("data-href-" + cual);
        var sp = $("span", cta); if (sp) sp.textContent = cta.getAttribute("data-txt-" + cual);
      }
      if (foco) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activar(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        activar(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
      });
    });
  }

  /* Buscador rápido de inicio: al elegir un nombre de la lista, busca de inmediato */
  $$(".buscar-rapido").forEach(function (fr) {
    var inp = $("input", fr), ops = $$("datalist option", fr).map(function (o) { return o.value; });
    inp.addEventListener("change", function () { if (ops.indexOf(inp.value) !== -1) fr.submit(); });
    fr.addEventListener("submit", function (e) { if (!inp.value.trim()) { e.preventDefault(); inp.focus(); } });
  });

  /* Filtros del catálogo */
  var filtros = $("[data-filtros]"), grid = $("[data-grid]");
  if (filtros && grid) {
    var cards = $$(".card", grid), out = $("[data-resultados]"), vacio = $("[data-vacio]");
    var params = new URLSearchParams(window.location.search);
    var CLAVES = ["q", "tipo", "zona", "estatus", "min", "max", "rec", "plantas", "alberca", "cochera", "terreno", "pb"];
    CLAVES.forEach(function (k) {
      var el = filtros.elements[k];
      if (!el || !params.get(k)) return;
      if (el.type === "checkbox") el.checked = params.get(k) === "1"; else el.value = params.get(k);
    });
    /* Búsqueda por nombre: sin acentos ni mayúsculas ("unica" encuentra "Única Living") */
    var norm = function (t) { return (t || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };
    /* Modelos de cada tarjeta: [[nombre normalizado, ancla], ...] */
    var modsDe = function (c) {
      if (!c._mods) c._mods = (c.dataset.mods || "").split("|").filter(Boolean).map(function (x) { var p = x.split("::"); return [norm(p[0]), p[1]]; });
      return c._mods;
    };
    /* Busca en nombre y zona; con 3+ letras también en los nombres de los modelos (ej. "kita" → Cumbres Novonorte) */
    var coincide = function (c, q) {
      if (norm(c.dataset.nombre + " " + c.dataset.zona).indexOf(q) !== -1) return true;
      return q.length >= 3 && modsDe(c).some(function (m) { return m[0].indexOf(q) !== -1; });
    };
    /* Destino al buscar: la página del desarrollo, o directo al modelo si se buscó un modelo */
    var destino = function (q) {
      var exacta = cards.filter(function (c) { return norm(c.dataset.nombre) === q; });
      if (exacta.length === 1) return $("a", exacta[0]).href;
      var vis = cards.filter(function (c) { return !c.hidden; });
      if (vis.length !== 1) return null;
      var c = vis[0], url = $("a", c).href;
      if (norm(c.dataset.nombre + " " + c.dataset.zona).indexOf(q) !== -1) return url;
      var ms = modsDe(c), m = ms.filter(function (x) { return x[0] === q; })[0] || (ms.filter(function (x) { return x[0].indexOf(q) !== -1; }).length === 1 ? ms.filter(function (x) { return x[0].indexOf(q) !== -1; })[0] : null);
      return m ? url + "#modelo-" + m[1] : url;
    };
    var mas = $("[data-filtros-mas]", filtros), masN = $("[data-mas-n]", filtros);
    var modelosDe = function (c) {
      if (!c._m) { try { c._m = JSON.parse(c.dataset.modelos || "[]"); } catch (e) { c._m = []; } }
      return c._m;
    };
    /* Rango del buscador de inicio (?pres=3500000-4000000) */
    if (params.get("pres")) {
      var pz = params.get("pres").split("-");
      if (filtros.elements.min && +pz[0]) filtros.elements.min.value = pz[0];
      if (filtros.elements.max && +pz[1]) filtros.elements.max.value = pz[1];
    }
    var aplicar = function () {
      var f = filtros.elements, n = 0;
      var q = f.q ? norm(f.q.value) : "";
      var tipo = f.tipo.value, zona = f.zona.value, est = f.estatus.value;
      var min = f.min ? parseFloat(f.min.value) || 0 : 0;
      var max = parseFloat(f.max.value) || 0, rec = parseFloat(f.rec.value) || 0;
      if (min && max && min > max) { var tmp = min; min = max; max = tmp; }
      var pl = f.plantas ? +f.plantas.value || 0 : 0, al = f.alberca ? f.alberca.value : "", co = f.cochera ? f.cochera.value : "";
      var te = f.terreno ? +f.terreno.value || 0 : 0, pb = f.pb ? f.pb.checked : false;
      var extras = (pl ? 1 : 0) + (al ? 1 : 0) + (co ? 1 : 0) + (te ? 1 : 0) + (pb ? 1 : 0);
      if (masN) masN.textContent = extras ? String(extras) : "";
      /* "si" = la incluye; "opc" = la incluye o se puede agregar. "Algunas casas" cuenta como incluida. */
      var cumple = function (v, quiere) {
        if (!quiere) return true;
        if (v === "si" || v === "algunas") return true;
        return quiere === "opc" && v === "opcional";
      };
      /* Un desarrollo aparece si al menos UNO de sus modelos cumple todo a la vez */
      var modeloOk = function (m) {
        return (!max || m.p <= max) && (!min || (m.pm || m.p) >= min) &&
               (!rec || (m.rm || m.r) >= rec) &&
               (!pl || (pl === 1 ? m.pl === 1 : m.pl >= 2)) &&
               (!pb || m.pb === "si" || m.pb === "opcional") &&
               cumple(m.al, al) && cumple(m.co, co) &&
               (!te || m.te >= te);
      };
      cards.forEach(function (c) {
        var ms = modelosDe(c);
        var porModelo = !ms.length ? !extras : ms.some(function (m) {
          /* Sin precio cargado no se descarta por precio */
          if (!m.p) m = Object.assign({}, m, { p: 0, pm: Infinity });
          return modeloOk(m);
        });
        var ok = (!q || coincide(c, q)) &&
                 (!tipo || c.dataset.tipo === tipo) &&
                 (!zona || c.dataset.zona === zona) &&
                 (!est || c.dataset.estatus === est) &&
                 porModelo;
        c.hidden = !ok;
        if (ok) n++;
      });
      if (out) out.textContent = EN ? (n === 1 ? "1 property" : n + " properties") : (n === 1 ? "1 propiedad" : n + " propiedades");
      if (vacio) vacio.hidden = n > 0;
      var q = new URLSearchParams();
      CLAVES.forEach(function (k) {
        if (!f[k]) return;
        if (f[k].type === "checkbox") { if (f[k].checked) q.set(k, "1"); } else if (f[k].value) q.set(k, f[k].value);
      });
      var url = window.location.pathname + (q.toString() ? "?" + q.toString() : "");
      window.history.replaceState(null, "", url);
    };
    /* Pestañas Todas | Casas | Departamentos (sincronizadas con el filtro Tipo) y orden por precio */
    var catTabs = $$("[data-cat]");
    var syncTabs = function () {
      catTabs.forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-cat") === filtros.elements.tipo.value); });
    };
    catTabs.forEach(function (t) {
      t.addEventListener("click", function () { filtros.elements.tipo.value = t.getAttribute("data-cat"); aplicar(); syncTabs(); });
    });
    var ordenar = $("[data-ordenar]");
    if (ordenar) ordenar.addEventListener("change", function () {
      var v = ordenar.value, lista = cards.slice();
      if (v === "az") lista.sort(function (a, b) { return norm(a.dataset.nombre).localeCompare(norm(b.dataset.nombre), "es"); });
      else if (v) lista.sort(function (a, b) {
        var pa = parseFloat(a.dataset.precio) || Infinity, pb = parseFloat(b.dataset.precio) || Infinity;
        return v === "asc" ? pa - pb : (pb === Infinity ? -1 : pb) - (pa === Infinity ? -1 : pa);
      });
      lista.forEach(function (c) { grid.appendChild(c); });
    });
    filtros.addEventListener("change", function () { aplicar(); syncTabs(); });
    if (filtros.elements.q) {
      filtros.elements.q.addEventListener("input", aplicar);
      var ir = function () {
        var d = destino(norm(filtros.elements.q.value));
        if (d) window.location.href = d;
      };
      filtros.elements.q.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aplicar(); ir(); } });
      /* Al elegir una sugerencia de la lista, abre el desarrollo */
      filtros.elements.q.addEventListener("change", function () { aplicar(); var v = norm(filtros.elements.q.value); if (cards.some(function (c) { return norm(c.dataset.nombre) === v; })) ir(); });
    }
    filtros.addEventListener("submit", function (e) { e.preventDefault(); });
    filtros.addEventListener("reset", function () { setTimeout(function () { aplicar(); syncTabs(); }, 0); });
    setTimeout(syncTabs, 0);
    aplicar();
    if (mas && masN && masN.textContent) mas.open = true;
    if (ordenar && ordenar.value) ordenar.dispatchEvent(new Event("change"));
    /* Llegó desde el buscador de inicio (?q=aldoria): si hay un solo desarrollo, ábrelo directo */
    if (params.get("q")) {
      var dq = destino(norm(params.get("q")));
      if (dq) window.location.replace(dq);
    }
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
  /* Anti-bots: la dirección de Formspree no está en el HTML (solo aquí), y se descartan en silencio
     los envíos que llenan un campo trampa, que llegan en menos de 3 s o sin que la persona toque el formulario */
  var FS = "https://formspree.io/f/" + "ebaedeem".split("").reverse().join("");
  var CRM = "https://crm.ucapital.mx/api/web.php";
  var T0 = Date.now();
  $$("[data-form]").forEach(function (form) {
    var tocado = false;
    ["keydown", "input", "pointerdown", "touchstart"].forEach(function (ev) {
      form.addEventListener(ev, function () { tocado = true; }, { passive: true });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("[data-submit]", form), err = $("[data-error]", form), ok = $("[data-ok]", form);
      var trampa = (form.elements.empresa && form.elements.empresa.value) || (form.elements._gotcha && form.elements._gotcha.value);
      if (trampa || !tocado || Date.now() - T0 < 3000) {
        form.classList.add("is-sent");
        if (ok) ok.hidden = false;
        return;
      }
      var nombre = form.elements.nombre ? form.elements.nombre.value.trim() : "";
      var subj = $("[data-subject]", form);
      if (subj && nombre && subj.value.indexOf(nombre) === -1) subj.value = subj.value + " · " + nombre;
      if (err) err.hidden = true;
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = EN ? "Sending…" : "Enviando…"; }
      var fd = new FormData(form);
      fd.delete("empresa");
      /* Copia al CRM propio (crm.ucapital.mx). Si falla, no afecta el envío normal. */
      try { fetch(CRM, { method: "POST", body: fd, keepalive: true }).catch(function () {}); } catch (e2) {}
      fetch(FS, { method: "POST", body: fd, headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.classList.add("is-sent");
          medir("generate_lead", contexto({ method: "formulario", origen: form.classList.contains("form--compacto") ? "ficha" : "contacto", idioma: EN ? "en" : "es" }));
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

  /* Ficha en celular: el formulario va al final de la información (después de los modelos y del esquema de compra) */
  var fSide = $(".ficha__side"), fMod = $("#como-comprar") || $("#modelos");
  if (fSide && fMod && window.matchMedia("(max-width: 860px)").matches) {
    var sec = document.createElement("section"), sh = document.createElement("div");
    sec.className = "section section--tight"; sh.className = "shell";
    sh.appendChild(fSide); sec.appendChild(sh);
    fMod.parentNode.insertBefore(sec, fMod.nextSibling);
  }

  /* Aparición suave al hacer scroll */
  if ("IntersectionObserver" in window) {
    var els = $$(".section__head, .card, .modelo, .steps li, .about__media img, .about__text, .mosaic img, .contacto__form");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }
})();

/* Promociones con fecha de vencimiento: se ocultan solas al día siguiente */
(function () {
  var d = new Date(), hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  document.querySelectorAll("[data-hasta]").forEach(function (el) { if (el.getAttribute("data-hasta") < hoy) el.hidden = true; });
  document.querySelectorAll(".promo").forEach(function (box) {
    if (!box.querySelector("p:not([hidden])")) box.hidden = true;
  });
})();

/* Tema claro / oscuro */
(function () {
  var b = document.querySelector('[data-tema]'); if (!b) return;
  var root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]');
  function pinta() { var osc = root.getAttribute('data-theme') === 'dark'; b.setAttribute('aria-pressed', osc ? 'true' : 'false'); if (meta) meta.setAttribute('content', osc ? '#0C1424' : '#FAF8F4'); }
  b.addEventListener('click', function () {
    var osc = root.getAttribute('data-theme') === 'dark';
    if (osc) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('tema', osc ? 'claro' : 'oscuro'); } catch (e) {}
    pinta();
  });
  pinta();
})();

/* Compartir un modelo: menú nativo en celular, copiar liga en computadora */
(function () {
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-compartir]"); if (!b) return;
    var url = location.origin + location.pathname + "#" + b.getAttribute("data-compartir");
    var titulo = b.getAttribute("data-titulo");
    if (navigator.share) { navigator.share({ title: titulo, text: titulo, url: url }).catch(function () {}); return; }
    function listo() {
      var s = b.querySelector("span"), t = s.textContent;
      s.textContent = b.getAttribute("data-ok"); b.classList.add("is-ok");
      setTimeout(function () { s.textContent = t; b.classList.remove("is-ok"); }, 2000);
    }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(listo, function () { prompt("", url); });
    else prompt("", url);
  });
  // Al abrir una liga compartida: llevar a la tarjeta y resaltarla
  var h = decodeURIComponent(location.hash.slice(1));
  if (h.indexOf("modelo-") !== 0) return;
  var el = document.getElementById(h); if (!el) return;
  el.classList.add("is-in", "is-compartido");
  window.addEventListener("load", function () { el.scrollIntoView({ block: "start" }); });
  setTimeout(function () { el.classList.remove("is-compartido"); }, 4000);
})();
