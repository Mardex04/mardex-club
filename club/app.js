(function () {
  var URL_ = "https://qgsbzgdvukbakcnccjxp.supabase.co";
  var KEY = "sb_publishable_v-3StvHQPsEnRQP7OuQNOw_YGa4Dpr7";
  var sb = window.supabase.createClient(URL_, KEY);
  var $ = function (id) { return document.getElementById(id); };
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function usd(n) { n = Number(n) || 0; return (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
  function pct(n) { return (n > 0 ? "+" : "") + n.toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%"; }
  function cls(n) { return n > 0 ? "up" : n < 0 ? "down" : ""; }

  var S = { uid: null, st: null, admin: false, rank: [], mats: [], quizzes: [], prog: { scores: {}, vistos: {} }, movs: [], premio: "", notas: {}, perfiles: [], allMovs: [] };
  var TABS = ["empezar", "material", "quizzes", "calculadora", "ranking", "sorteo", "perfil", "cuentas"];
  var NIVELES = [["mentoria", "Mentoría"], ["live", "Live"], ["comunidad", "Comunidad"]];
  var SECCIONES = ["Básico", "Avanzado", "Quizzes de los PDFs"];

  function go(name) {
    TABS.forEach(function (t) {
      $("p-" + t).hidden = t !== name;
      var b = $("t-" + t); if (b) b.setAttribute("aria-selected", t === name ? "true" : "false");
    });
    try { location.hash = name; } catch (e) {}
  }
  document.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-tab")); }); });
  document.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-go")); }); });

  /* ---------- AUTH ---------- */
  var mode = "in";
  function setMode(m) {
    mode = m;
    $("a-in").setAttribute("aria-selected", m === "in");
    $("a-up").setAttribute("aria-selected", m === "up");
    $("l-nombre").hidden = m !== "up"; $("l-code").hidden = m !== "up";
    $("a-nombre").required = m === "up"; $("a-code").required = m === "up";
    $("a-pass").autocomplete = m === "up" ? "new-password" : "current-password";
    $("a-go").textContent = m === "up" ? "Crear cuenta" : "Entrar";
    $("a-msg").textContent = "";
  }
  $("a-in").addEventListener("click", function () { setMode("in"); });
  $("a-up").addEventListener("click", function () { setMode("up"); });
  function showAuth(sub, form, seg, out) {
    $("app").hidden = true; $("auth").hidden = false;
    $("auth-sub").textContent = sub;
    $("aform").hidden = !form; $("auth-seg").hidden = !seg; $("a-out").hidden = !out;
  }
  function errTxt(e) {
    var m = (e && e.message) || "";
    if (/codigo_invalido/.test(m)) return "El código no es correcto. Pedíselo a Mardex.";
    if (/Invalid login/i.test(m)) return "Email o contraseña incorrectos.";
    if (/already registered/i.test(m)) return "Ese email ya tiene cuenta. Probá con “Entrar”.";
    if (/Password should/i.test(m)) return "La contraseña tiene que tener al menos 8 caracteres.";
    if (/^Te mandamos/.test(m)) return m;
    return "No se pudo: " + m;
  }
  $("aform").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = $("a-email").value.trim(), pass = $("a-pass").value, msg = $("a-msg");
    var btn = $("a-go"); btn.disabled = true; msg.textContent = "Un momento…";
    var p;
    if (S.needJoin) {
      p = sb.rpc("unirse", { p_codigo: $("a-code").value, p_nombre: $("a-nombre").value }).then(function (r) { if (r.error) throw r.error; });
    } else if (mode === "up") {
      p = sb.auth.signUp({ email: email, password: pass }).then(function (r) {
        if (r.error) throw r.error;
        if (!r.data.session) { setMode("in"); throw new Error("Te mandamos un mail: tocá el link para confirmar y después volvé a entrar acá. Ahí te pedimos tu nombre y el código del Club."); }
        return sb.rpc("unirse", { p_codigo: $("a-code").value, p_nombre: $("a-nombre").value }).then(function (j) { if (j.error) throw j.error; });
      });
    } else {
      p = sb.auth.signInWithPassword({ email: email, password: pass }).then(function (r) { if (r.error) throw r.error; });
    }
    p.then(function () { msg.textContent = ""; boot(); }).catch(function (e) { msg.textContent = errTxt(e); }).then(function () { btn.disabled = false; });
  });
  function logout() { sb.auth.signOut().then(function () { location.hash = ""; S.needJoin = false; boot(); }); }
  $("a-out").addEventListener("click", logout); $("out2").addEventListener("click", logout);

  function boot() {
    sb.auth.getSession().then(function (r) {
      var ses = r.data && r.data.session;
      if (!ses) { S.needJoin = false; $("a-email").readOnly = false; $("l-email").hidden = false; $("l-pass").hidden = false; $("a-pass").required = true; setMode("in"); showAuth("Entrá con tu cuenta o creá una con el código que te pasó Mardex.", true, true, false); return; }
      S.uid = ses.user.id;
      return sb.rpc("mi_estado").then(function (e) {
        var st = e.data || {}; S.st = st; S.admin = !!st.admin;
        if (!st.existe) {
          S.needJoin = true; setMode("up"); $("l-email").hidden = true; $("l-pass").hidden = true; $("a-email").required = false; $("a-pass").required = false;
          $("a-go").textContent = "Entrar al Club"; showAuth("Ya tenés cuenta. Poné tu nombre y el código del Club para entrar.", true, false, true); return;
        }
        if (!st.miembro) { showAuth("Tu acceso al Club está inactivo. Hablá con Mardex.", false, false, true); return; }
        startApp();
      });
    });
  }

  /* ---------- DATA ---------- */
  function load() {
    var jobs = [
      sb.from("material").select("*").order("orden"),
      sb.from("quizzes").select("*").order("orden"),
      sb.from("config").select("*").eq("key", "sorteo").maybeSingle(),
      sb.from("progreso").select("*").eq("user_id", S.uid).maybeSingle(),
      sb.from("movimientos").select("*").eq("user_id", S.uid).order("created_at", { ascending: false }),
      sb.rpc("ranking")
    ];
    if (S.admin) {
      jobs.push(sb.from("admin_notas").select("*"), sb.from("profiles").select("*"), sb.from("movimientos").select("*").order("created_at", { ascending: false }));
    }
    jobs.push(sb.from("cuentas").select("*").eq("user_id", S.uid).order("created_at", { ascending: false }));
    return Promise.all(jobs).then(function (r) {
      S.cuentas = r[r.length - 1].data || [];
      S.mats = r[0].data || []; S.quizzes = r[1].data || [];
      S.premio = (r[2].data && r[2].data.value && r[2].data.value.premio) || "";
      S.prog = r[3].data ? { scores: r[3].data.scores || {}, vistos: r[3].data.vistos || {} } : { scores: {}, vistos: {} };
      S.movs = r[4].data || []; S.rank = r[5].data || [];
      if (S.admin) { S.notas = {}; (r[6].data || []).forEach(function (n) { S.notas[n.user_id] = n; }); S.perfiles = r[7].data || []; S.allMovs = r[8].data || []; }
    });
  }
  function startApp() {
    $("auth").hidden = true; $("app").hidden = false;
    $("review").hidden = !S.admin; $("mat-admin").hidden = !S.admin; $("prize-form").hidden = !S.admin; $("draw").hidden = !S.admin;
    load().then(function () { renderAll(); var h = (location.hash || "").slice(1); go(TABS.indexOf(h) >= 0 ? h : "empezar"); });
  }
  function renderAll() { renderMe(); renderRanking(); renderPerfil(); renderCuentas(); renderMaterial(); renderQuizList(); renderPrize(); if (S.admin) renderAdmin(); }
  function reload() { return load().then(renderAll); }

  /* ---------- ME / PERFIL ---------- */
  function renderMe() {
    var nm = S.st.nombre || (S.admin ? "Mardex" : "Mi perfil");
    $("me-name").textContent = nm; $("me-av").textContent = nm.trim().charAt(0).toUpperCase() || "M";
  }
  function sums(list) { var i = 0, r = 0; list.forEach(function (m) { if (m.tipo === "inv") i += Number(m.monto); else r += Number(m.monto); }); return [i, r]; }
  function renderPerfil() {
    var s = sums(S.movs), inv = s[0], ret = s[1];
    $("my-inv").textContent = usd(inv); $("my-ret").textContent = usd(ret);
    var roi = inv > 0 ? ((ret - inv) / inv) * 100 : null;
    $("my-roi").textContent = roi == null ? "–" : pct(roi); $("my-roi").className = "v " + (roi == null ? "" : cls(roi));
    if (document.activeElement !== $("p-nombre")) $("p-nombre").value = S.st.nombre || "";
    $("p-publico").checked = !!S.st.publico;
    var box = $("m-list"); box.textContent = "";
    if (!S.movs.length) box.appendChild(el("p", "note", "Todavía no cargaste movimientos."));
    S.movs.forEach(function (m) { box.appendChild(movCard(m, true)); });
  }
  $("pform").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nombre = $("p-nombre").value.trim(); if (!nombre) return;
    sb.from("profiles").update({ nombre: nombre, publico: $("p-publico").checked }).eq("id", S.uid).then(function (r) {
      $("p-msg").textContent = r.error ? "No se pudo guardar." : "Guardado.";
      if (!r.error) { S.st.nombre = nombre; S.st.publico = $("p-publico").checked; reload(); }
    });
  });
  function movCard(m, mine) {
    var d = el("div", "mv");
    var l = el("div"); l.appendChild(el("div", "t", (m.tipo === "inv" ? "Compra: " : "Retiro: ") + usd(m.monto) + (m.nota ? " · " + m.nota : "")));
    l.appendChild(el("div", "s", m.fecha || (m.created_at || "").slice(0, 10))); d.appendChild(l);
    if (mine) {
      var x = el("button", "btn", "Borrar"); x.type = "button";
      x.addEventListener("click", function () { if (!confirm("¿Borrar este movimiento?")) return; x.disabled = true; sb.from("movimientos").delete().eq("id", m.id).then(reload); });
      d.appendChild(x);
    }
    if (m.comprobante_path) {
      var img = el("img", "thumb"); img.alt = "Comprobante"; d.appendChild(img);
      sb.storage.from("comprobantes").createSignedUrl(m.comprobante_path, 3600).then(function (r) { if (r.data) img.src = r.data.signedUrl; });
      img.addEventListener("click", function () { img.classList.toggle("big"); });
    }
    return d;
  }
  /* ---------- CUENTAS ---------- */
  S.cuentas = [];
  var CU = { per: "mes", ver: "eval" };
  function hoy() { return new Date().toISOString().slice(0, 10); }
  function perStart(p) {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    if (p === "semana") { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
    if (p === "mes") { d.setDate(1); return d; }
    if (p === "anio") { d.setMonth(0, 1); return d; }
    return null;
  }
  function mvFecha(m) { return new Date((m.fecha || (m.created_at || "").slice(0, 10)) + "T00:00:00"); }
  function chk(r) { if (r && r.error) throw r.error; return r; }
  function bad(t) { var e = new Error(t); e.mine = t; return Promise.reject(e); }
  function subir(f) {
    var ext = (f.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "jpg";
    var path = S.uid + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return sb.storage.from("comprobantes").upload(path, f, { contentType: f.type }).then(function (u) { if (u.error) throw u.error; return path; });
  }
  function miniForm(fields, submitTxt, onSubmit) {
    var f = el("form", "add cu-form"), refs = {};
    fields.forEach(function (x) {
      var l = el("label", "full", x.l), i = el("input"); i.type = x.t; if (x.req) i.required = true;
      if (x.step) { i.step = "any"; i.min = "0"; i.setAttribute("inputmode", "decimal"); }
      if (x.acc) i.accept = x.acc; if (x.v) i.value = x.v; l.appendChild(i); f.appendChild(l); refs[x.k] = i;
    });
    var a = el("div", "actions"), b = el("button", "btn primary", submitTxt), msg = el("span", "msg"); b.type = "submit"; a.appendChild(b); a.appendChild(msg); f.appendChild(a);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); b.disabled = true; msg.textContent = "Guardando…";
      onSubmit(refs).then(reload).catch(function (e) { msg.textContent = (e && e.mine) || "No se pudo guardar. Probá de nuevo."; b.disabled = false; });
    });
    return f;
  }
  function formFunded(c) {
    return miniForm([
      { k: "a", l: "Activación que pagaste en USD (dejalo vacío si no pagaste)", t: "number", step: 1 },
      { k: "d", l: "Fecha", t: "date", req: 1, v: hoy() },
      { k: "f", l: "Captura de la activación (solo si pagaste)", t: "file", acc: "image/*" }
    ], "Confirmar: pasó a funded", function (r) {
      var a = Number(r.a.value) || 0, f = r.f.files[0];
      if (a > 0 && !f) return bad("Si pagaste activación, subí la captura.");
      if (f && f.size > 8 * 1024 * 1024) return bad("La imagen pesa más de 8 MB.");
      var p = a > 0 ? subir(f).then(function (path) {
        return sb.from("movimientos").insert({ user_id: S.uid, tipo: "inv", monto: a, nota: "Activación · " + c.empresa + " " + usd(c.tamano), fecha: r.d.value, comprobante_path: path, cuenta_id: c.id });
      }).then(chk) : Promise.resolve();
      return p.then(function () { return sb.from("cuentas").update({ estado: "funded", funded_fecha: r.d.value }).eq("id", c.id); }).then(chk);
    });
  }
  function formRetiro(c) {
    return miniForm([
      { k: "m", l: "Monto retirado en USD", t: "number", step: 1, req: 1 },
      { k: "d", l: "Fecha", t: "date", req: 1, v: hoy() },
      { k: "f", l: "Captura del certificado del retiro", t: "file", acc: "image/*", req: 1 }
    ], "Guardar retiro", function (r) {
      var m = Number(r.m.value), f = r.f.files[0];
      if (!(m > 0)) return bad("Poné el monto del retiro.");
      if (!f) return bad("Subí la captura del certificado.");
      if (f.size > 8 * 1024 * 1024) return bad("La imagen pesa más de 8 MB.");
      return subir(f).then(function (path) {
        return sb.from("movimientos").insert({ user_id: S.uid, tipo: "ret", monto: m, nota: "Retiro · " + c.empresa + " " + usd(c.tamano), fecha: r.d.value, comprobante_path: path, cuenta_id: c.id });
      }).then(chk);
    });
  }
  function cuCard(c) {
    var d = el("div", "cu-card"), i = 0, r = 0;
    S.movs.forEach(function (x) { if (x.cuenta_id === c.id) { if (x.tipo === "inv") i += Number(x.monto); else r += Number(x.monto); } });
    d.appendChild(el("div", "t", c.empresa + " · " + usd(c.tamano)));
    d.appendChild(el("div", "s", "Comprada " + c.fecha + " · Invertido " + usd(i) + " · Retirado " + usd(r)));
    var act = el("div", "cu-act"), slot = el("div");
    function btn(txt, fn, prim) { var b = el("button", "btn" + (prim ? " primary" : ""), txt); b.type = "button"; b.addEventListener("click", fn); act.appendChild(b); }
    if (c.estado === "eval") btn("Pasar a funded", function () { slot.textContent = ""; slot.appendChild(formFunded(c)); }, true);
    if (c.estado === "funded") btn("Hice un retiro", function () { slot.textContent = ""; slot.appendChild(formRetiro(c)); }, true);
    if (c.estado !== "quemada") btn("La quemé", function () {
      if (!confirm("¿Marcar esta cuenta como quemada?")) return;
      sb.from("cuentas").update({ estado: "quemada", quemada_fecha: hoy() }).eq("id", c.id).then(reload);
    });
    btn("Borrar", function () {
      if (!confirm("¿Borrar esta cuenta y sus movimientos? Cambia tu inversión y tu ROI.")) return;
      sb.from("movimientos").delete().eq("cuenta_id", c.id).then(function () { return sb.from("cuentas").delete().eq("id", c.id); }).then(reload);
    });
    d.appendChild(act); d.appendChild(slot);
    return d;
  }
  function renderCuentas() {
    var by = { eval: [], funded: [], quemada: [] };
    S.cuentas.forEach(function (c) { (by[c.estado] || by.eval).push(c); });
    function cap(l) { var t = 0; l.forEach(function (c) { t += Number(c.tamano); }); return t; }
    $("cu-cap").textContent = usd(cap(by.eval) + cap(by.funded));
    ["eval", "funded", "quemada"].forEach(function (k) {
      $("cu-" + k).textContent = usd(cap(by[k]));
      $("cu-" + k + "-n").textContent = by[k].length + (by[k].length === 1 ? " cuenta" : " cuentas");
      $("cu-t-" + k).setAttribute("aria-pressed", CU.ver === k ? "true" : "false");
    });
    var st = perStart(CU.per), inv = 0, ret = 0;
    S.movs.forEach(function (m) { if (st && mvFecha(m) < st) return; if (m.tipo === "inv") inv += Number(m.monto); else ret += Number(m.monto); });
    $("cu-inv").textContent = usd(inv); $("cu-ret").textContent = usd(ret);
    $("cu-net").textContent = usd(ret - inv); $("cu-net").className = "v " + cls(ret - inv);
    $("cu-h").textContent = { eval: "Evals", funded: "Funded", quemada: "Quemadas" }[CU.ver];
    var box = $("cu-list"); box.textContent = "";
    if (!by[CU.ver].length) box.appendChild(el("p", "note", "No tenés cuentas acá todavía."));
    by[CU.ver].forEach(function (c) { box.appendChild(cuCard(c)); });
  }
  $("cu-per").addEventListener("change", function () { CU.per = $("cu-per").value; renderCuentas(); });
  ["eval", "funded", "quemada"].forEach(function (k) { $("cu-t-" + k).addEventListener("click", function () { CU.ver = k; renderCuentas(); }); });
  $("c-fecha").value = hoy();
  $("cform").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = $("c-file").files[0], msg = $("c-msg"), btn = $("c-save");
    if (!f) return; if (f.size > 8 * 1024 * 1024) { msg.textContent = "La imagen pesa más de 8 MB."; return; }
    btn.disabled = true; msg.textContent = "Subiendo…";
    var cuenta, emp = $("c-emp").value.trim(), tam = Number($("c-tam").value), costo = Number($("c-costo").value), fe = $("c-fecha").value;
    subir(f).then(function (path) {
      return sb.from("cuentas").insert({ user_id: S.uid, empresa: emp, tamano: tam, costo: costo, estado: "eval", fecha: fe }).select().single().then(function (r) {
        chk(r); cuenta = r.data;
        return sb.from("movimientos").insert({ user_id: S.uid, tipo: "inv", monto: costo, nota: "Eval · " + emp + " " + usd(tam), fecha: fe, comprobante_path: path, cuenta_id: cuenta.id });
      }).then(function (r) { if (r.error) { return sb.from("cuentas").delete().eq("id", cuenta.id).then(function () { throw r.error; }); } });
    }).then(function () {
      msg.textContent = "Listo, cuenta agregada."; $("cform").reset(); $("c-fecha").value = hoy(); CU.ver = "eval"; return reload();
    }).catch(function () { msg.textContent = "No se pudo guardar. Probá de nuevo."; }).then(function () { btn.disabled = false; });
  });
  /* ---------- RANKING ---------- */
  function renderRanking() {
    var pub = S.rank.filter(function (a) { return a.publico; }).sort(function (a, b) { return b.roi - a.roi; });
    var priv = S.rank.filter(function (a) { return !a.publico; });
    var inv = 0, ret = 0; S.rank.forEach(function (a) { inv += Number(a.inv); ret += Number(a.ret); });
    $("s-ret").textContent = S.rank.length ? usd(ret) : "–";
    var g = inv > 0 ? ((ret - inv) / inv) * 100 : null;
    $("s-roi").textContent = g == null ? "–" : pct(g); $("s-roi").className = "v " + (g == null ? "" : cls(g));
    $("s-cta").textContent = S.rank.length;
    $("empty").hidden = S.rank.length > 0;
    var b = $("board"); b.textContent = "";
    pub.forEach(function (a, i) {
      var li = el("li", "row" + (i === 0 ? " lead" : ""));
      li.appendChild(el("span", "pos", String(i + 1)));
      var w = el("div", "who"); var n = el("div", "name", a.nombre);
      if (S.admin && S.notas[a.user_id] && S.notas[a.user_id].apodo) n.appendChild(el("span", "nick", " “" + S.notas[a.user_id].apodo + "”"));
      w.appendChild(n); w.appendChild(el("div", "sub", "Invertido " + usd(a.inv) + " · Retirado " + usd(a.ret))); li.appendChild(w);
      var r = el("div", "res"); r.appendChild(el("span", "roi " + cls(a.roi), pct(Number(a.roi)))); r.appendChild(el("span", "net", usd(a.ret - a.inv))); li.appendChild(r);
      b.appendChild(li);
    });
    $("priv-wrap").hidden = !priv.length; $("priv-wrap").style.display = priv.length ? "flex" : "none";
    var p = $("priv"); p.textContent = "";
    priv.forEach(function (a) {
      var li = el("li", "row plain"); var n = el("div", "name", a.nombre); n.appendChild(el("span", "lock", "privado"));
      if (S.admin && S.notas[a.user_id] && S.notas[a.user_id].apodo) n.appendChild(el("span", "nick", " “" + S.notas[a.user_id].apodo + "”"));
      li.appendChild(n); p.appendChild(li);
    });
  }

  /* ---------- ADMIN ---------- */
  var reviewUid = null;
  function renderAdmin() {
    loadCode();
    var box = $("r-students"); box.textContent = "";
    S.perfiles.forEach(function (p) {
      var n = S.notas[p.id] || {};
      var d = el("div", "mv");
      var l = el("div"); l.appendChild(el("div", "t", p.nombre + (n.is_admin ? " (dueño)" : "") + (n.activo === false ? " · de baja" : "")));
      l.appendChild(el("div", "s", p.publico ? "público" : "privado")); d.appendChild(l);
      var acts = el("div", "acts");
      var ap = el("input", "field"); ap.type = "text"; ap.placeholder = "Apodo (solo vos)"; ap.value = n.apodo || ""; ap.maxLength = 40;
      ap.addEventListener("change", function () { sb.from("admin_notas").update({ apodo: ap.value.trim() || null }).eq("user_id", p.id).then(reload); });
      acts.appendChild(ap);
      var sel = el("select", "field");
      NIVELES.forEach(function (x) { var o = el("option", "", x[1]); o.value = x[0]; if ((n.plan || "comunidad") === x[0]) o.selected = true; sel.appendChild(o); });
      sel.addEventListener("change", function () { sb.from("admin_notas").update({ plan: sel.value }).eq("user_id", p.id).then(reload); });
      acts.appendChild(sel);
      var ver = el("button", "btn", "Ver comprobantes"); ver.type = "button"; ver.addEventListener("click", function () { reviewUid = p.id; renderItems(); }); acts.appendChild(ver);
      if (!n.is_admin) {
        var bj = el("button", "btn", n.activo === false ? "Reactivar" : "Dar de baja"); bj.type = "button";
        bj.addEventListener("click", function () { bj.disabled = true; sb.from("admin_notas").update({ activo: n.activo === false }).eq("user_id", p.id).then(reload); });
        acts.appendChild(bj);
      }
      d.appendChild(acts); box.appendChild(d);
    });
    var pl = $("r-plans"); pl.textContent = "";
    NIVELES.forEach(function (x) {
      var c = el("div", "plan-col"); c.appendChild(el("div", "plan-h", x[1]));
      var names = S.perfiles.filter(function (p) { var n = S.notas[p.id] || {}; return (n.plan || "comunidad") === x[0] && n.activo !== false && !n.is_admin; });
      if (!names.length) c.appendChild(el("div", "plan-i note", "—"));
      names.forEach(function (p) { c.appendChild(el("div", "plan-i", p.nombre)); });
      pl.appendChild(c);
    });
    renderItems();
  }
  function renderItems() {
    var box = $("r-items"); box.textContent = ""; if (!reviewUid) return;
    var p = S.perfiles.filter(function (x) { return x.id === reviewUid; })[0];
    box.appendChild(el("h3", "", "Movimientos de " + (p ? p.nombre : "")));
    var list = S.allMovs.filter(function (m) { return m.user_id === reviewUid; });
    if (!list.length) box.appendChild(el("p", "note", "Sin movimientos."));
    list.forEach(function (m) { box.appendChild(movCard(m, false)); });
  }

  /* ---------- MATERIAL ---------- */
  function saveProg() { return sb.from("progreso").upsert({ user_id: S.uid, scores: S.prog.scores, vistos: S.prog.vistos }); }
  function renderMaterial() {
    var root = $("mods"); root.textContent = "";
    var groups = [["video", "Videos"], ["pdf", "PDFs"], ["enlace", "Enlaces"]];
    groups.forEach(function (g) {
      var items = S.mats.filter(function (m) { return m.tipo === g[0]; });
      if (g[0] === "enlace" && !items.length) return;
      var det = el("details", "mod msec"); det.open = true;
      var sm = el("summary"); var seen = items.filter(function (m) { return S.prog.vistos[m.id]; }).length;
      sm.appendChild(el("span", "tag", items.length ? seen + "/" + items.length + " vistos" : "vacío")); sm.appendChild(el("span", "t", g[1])); sm.appendChild(el("span", "chev", "›"));
      det.appendChild(sm);
      if (!items.length) det.appendChild(el("p", "note", "Muy pronto vas a encontrar acá " + (g[0] === "video" ? "los videos." : "los PDFs.")));
      var ul = el("ul");
      items.forEach(function (m) {
        var li = el("li"); var a = el("a", "", m.titulo); a.href = m.url; a.target = "_blank"; a.rel = "noopener"; a.style.color = "var(--fg)"; li.appendChild(a);
        var r = el("span", "actions");
        var lb = el("label", "seen"); var cb = el("input"); cb.type = "checkbox"; cb.checked = !!S.prog.vistos[m.id]; lb.appendChild(cb); lb.appendChild(document.createTextNode(" Visto"));
        cb.addEventListener("change", function () { if (cb.checked) S.prog.vistos[m.id] = true; else delete S.prog.vistos[m.id]; saveProg().then(renderMaterial); });
        r.appendChild(lb);
        if (S.admin) { var x = el("button", "btn", "Quitar"); x.type = "button"; x.addEventListener("click", function () { if (confirm("¿Quitar este material?")) sb.from("material").delete().eq("id", m.id).then(reload); }); r.appendChild(x); }
        li.appendChild(r); ul.appendChild(li);
      });
      det.appendChild(ul); root.appendChild(det);
    });
  }
  $("mat-tipo").addEventListener("change", function () { var p = $("mat-tipo").value === "pdf"; $("mat-file-l").hidden = !p; $("mat-url-l").hidden = p; });
  $("matform").addEventListener("submit", function (ev) {
    ev.preventDefault(); if (!S.admin) return;
    var tipo = $("mat-tipo").value, msg = $("mat-msg"), f = $("mat-file").files[0], btn = $("mat-save"); btn.disabled = true; msg.textContent = "Guardando…";
    var urlP;
    if (tipo === "pdf" && f) {
      var path = Date.now() + "-" + f.name.replace(/[^a-z0-9.\-_]/gi, "_");
      urlP = sb.storage.from("material").upload(path, f, { contentType: "application/pdf" }).then(function (u) { if (u.error) throw u.error; return sb.storage.from("material").getPublicUrl(path).data.publicUrl; });
    } else { var u = $("mat-url").value.trim(); if (!/^https:\/\//.test(u)) { msg.textContent = "El link tiene que empezar con https://"; btn.disabled = false; return; } urlP = Promise.resolve(u); }
    urlP.then(function (url) { return sb.from("material").insert({ id: "m" + Date.now().toString(36), titulo: $("mat-titulo").value.trim(), tipo: tipo, url: url, orden: Date.now() / 1e9 }); })
      .then(function (r) { if (r.error) throw r.error; msg.textContent = "Agregado."; $("matform").reset(); return reload(); })
      .catch(function () { msg.textContent = "No se pudo agregar."; }).then(function () { btn.disabled = false; });
  });

  /* ---------- QUIZZES ---------- */
  function renderQuizList() {
    $("quiz-run").hidden = true; $("quiz-list").hidden = false; $("quiz-list").textContent = "";
    var list = $("quiz-list");
    var TEMAS = ["Metodología", "Gestión", "Psicotrading"];
    function item(q) {
      var it = el("div", "qitem"); var l = el("div"); l.appendChild(el("div", "t", q.data.titulo));
      var sc = S.prog.scores[q.id]; l.appendChild(el("div", "s", q.data.preguntas.length + " preguntas" + (sc ? " · mejor: " + sc.mejor + "/" + sc.total : ""))); it.appendChild(l);
      var b = el("button", "btn primary", sc ? "Repetir" : "Empezar"); b.type = "button"; b.addEventListener("click", function () { startQuiz(q); }); it.appendChild(b);
      return it;
    }
    SECCIONES.forEach(function (sec, si) {
      var qs = S.quizzes.filter(function (q) { return (q.data.seccion || SECCIONES[0]) === sec; });
      if (!qs.length) return;
      var det = el("details", "qdet"); det.open = si === 0; det.style.cssText = "border:1px solid var(--line);border-radius:12px;margin:12px 0;padding:0 14px;background:var(--surface)";
      var sm = el("summary", "subh", sec + " · " + qs.length + (qs.length === 1 ? " quiz" : " quizzes")); sm.style.cssText = "cursor:pointer;padding:14px 0;margin:0;list-style-position:inside";
      det.appendChild(sm);
      var tem = qs.some(function (q) { return q.data.tema; });
      if (!tem) { qs.forEach(function (q) { det.appendChild(item(q)); }); }
      else {
        TEMAS.forEach(function (t) {
          var ts = qs.filter(function (q) { return q.data.tema === t; });
          if (!ts.length) return;
          var h = el("div", "note", t); h.style.cssText = "margin:10px 0 4px;font-weight:600;color:var(--accent-text)"; det.appendChild(h);
          ts.forEach(function (q) { det.appendChild(item(q)); });
        });
      }
      list.appendChild(det);
    });
    if (!S.quizzes.length) list.appendChild(el("p", "note", "Todavía no hay quizzes."));
  }
  function startQuiz(q) {
    var run = $("quiz-run"); run.hidden = false; run.textContent = ""; $("quiz-list").hidden = true;
    var d = q.data, total = d.preguntas.length, answered = 0, ok = 0;
    var back = el("button", "btn", "← Volver"); back.type = "button"; back.addEventListener("click", renderQuizList); run.appendChild(back);
    run.appendChild(el("h3", "", d.titulo));
    if (d.repaso && d.repaso.url) { var p = el("p", "note", "Antes de empezar, mirá: "); var a = el("a", "", d.repaso.titulo); a.href = d.repaso.url; a.target = "_blank"; a.rel = "noopener"; a.style.color = "var(--accent-text)"; p.appendChild(a); run.appendChild(p); }
    var score = el("div", "qscore"); score.hidden = true;
    d.preguntas.forEach(function (pq, qi) {
      var box = el("div", "qq"); box.appendChild(el("div", "qt", (qi + 1) + ". " + pq.q));
      if (pq.media && pq.media.url) {
        if (pq.media.tipo === "video") { var v = el("video", "qmedia"); v.controls = true; v.src = pq.media.url; box.appendChild(v); }
        else { var im = el("img", "qmedia"); im.src = pq.media.url; im.alt = pq.media.alt || ""; box.appendChild(im); }
      }
      var fb = el("div", "qfb"); var done = false;
      pq.opciones.forEach(function (o, oi) {
        var lab = el("label", "qopt"); var inp = el("input"); inp.type = "radio"; inp.name = "q" + qi; lab.appendChild(inp); lab.appendChild(el("span", "", o));
        inp.addEventListener("change", function () {
          if (done) return; done = true; answered++;
          var good = oi === pq.correcta; if (good) ok++;
          lab.classList.add(good ? "ok" : "bad");
          box.querySelectorAll(".qopt").forEach(function (x, xi) { x.querySelector("input").disabled = true; if (xi === pq.correcta) x.classList.add("ok"); });
          fb.className = "qfb " + (good ? "good" : "nope"); fb.textContent = good ? "¡Correcto!" : "No era esa. La correcta está marcada en verde.";
          if (answered === total) {
            score.hidden = false; score.textContent = ok + " / " + total;
            var prev = S.prog.scores[q.id] || {}; S.prog.scores[q.id] = { mejor: Math.max(prev.mejor || 0, ok), ultimo: ok, total: total };
            saveProg();
          }
        });
        box.appendChild(lab);
      });
      box.appendChild(fb); run.appendChild(box);
    });
    run.appendChild(score); window.scrollTo(0, 0);
  }

  /* ---------- SORTEO ---------- */
  function renderPrize() {
    $("prize-t").textContent = S.premio || "Lo anuncia Mardex al inicio de cada mes";
    if (S.admin && document.activeElement !== $("prize-in")) $("prize-in").value = S.premio;
  }
  $("prize-form").addEventListener("submit", function (ev) {
    ev.preventDefault(); if (!S.admin) return;
    sb.from("config").upsert({ key: "sorteo", value: { premio: $("prize-in").value.trim() } }).then(function (r) {
      $("prize-msg").textContent = r.error ? "No se pudo guardar." : "Guardado."; reload();
    });
  });
  $("draw-go").addEventListener("click", function () {
    $("draw-out").textContent = "Sorteando…";
    sb.rpc("sortear").then(function (r) { $("draw-out").textContent = r.error ? "No se pudo sortear." : "Ganador: " + r.data; });
  });

  function loadCode() { sb.from("club_codigo").select("codigo").maybeSingle().then(function (r) { if (r.data && document.activeElement !== $("code-in")) $("code-in").value = r.data.codigo; }); }
  $("code-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var c = $("code-in").value.trim(), m = $("code-msg");
    if (c.length < 6) { m.textContent = "Mínimo 6 caracteres."; return; }
    m.textContent = "Guardando…";
    sb.from("club_codigo").upsert({ id: 1, codigo: c }).then(function (r) { m.textContent = r.error ? "No se pudo guardar." : "Código guardado."; });
  });
  $("bk-go").addEventListener("click", function () {
    var m = $("bk-msg"), tabs = ["admin_notas", "profiles", "movimientos", "material", "quizzes", "progreso", "config", "club_codigo"], out = { generado: new Date().toISOString(), nota: "Copia de Mardex Club. Los archivos (fotos y PDFs) se guardan aparte en Supabase Storage." };
    m.textContent = "Preparando…";
    Promise.all(tabs.map(function (t) { return sb.from(t).select("*").then(function (r) { if (r.error) throw r.error; out[t] = r.data; }); })).then(function () {
      var bl = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }), u = URL.createObjectURL(bl), l = document.createElement("a");
      l.href = u; l.download = "mardex-club-copia-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(l); l.click(); l.remove(); URL.revokeObjectURL(u);
      m.textContent = "Copia descargada.";
    }).catch(function () { m.textContent = "No se pudo crear la copia."; });
  });
  boot();
})();
