/* CJM Baja California  |  main.js v5 */
(function () {
  'use strict';

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Entrada suave al hacer scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Formularios (Supabase, solo inserción) ---------- */
  // La llave publicable solo puede INSERTAR en estas dos tablas (RLS). No lee ni borra nada.
  var SUPABASE_URL = 'https://evkpjeggflbhxwmgopcu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_bJqA_WMQGRvBZEwbYZXrSw_4kbYwL_2';
  var TABLES = {
    problema: ['empresa', 'razon_social', 'municipio', 'puesto', 'num_trabajadores', 'hay_sindicato', 'tipo', 'cuando', 'mensaje', 'nombre', 'telefono', 'email'],
    afiliacion: ['nombre', 'curp', 'telefono', 'email', 'municipio', 'empresa', 'puesto']
  };
  var TABLE_NAME = { problema: 'casos', afiliacion: 'afiliaciones' };
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.status');
    var btn = form.querySelector('button[type="submit"]');

    function show(kind, msg) {
      if (!status) return;
      status.className = 'status show ' + kind;
      status.textContent = msg;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) status.className = 'status';

      // validación en línea
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (el) {
        var ok = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        var err = el.closest('.field') && el.closest('.field').querySelector('.err');
        if (err) err.textContent = ok ? '' : (el.dataset.msg || 'Completa este campo.');
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); show('error', 'Revisa los campos marcados.'); return; }

      // honeypot: si lo llenó un bot, fingimos éxito
      var trap = form.querySelector('input[name="botcheck"]');
      if (trap && trap.checked) { window.location.href = '/gracias'; return; }

      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Enviando…';

      var payload = {};
      TABLES[form.dataset.form].forEach(function (k) {
        var el = form.elements[k];
        var v = el && el.value ? el.value.trim() : '';
        payload[k] = v === '' ? null : v;
      });
      if (payload.curp) payload.curp = payload.curp.toUpperCase();

      fetch(SUPABASE_URL + '/rest/v1/' + TABLE_NAME[form.dataset.form], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          window.location.href = '/gracias?t=' + encodeURIComponent(form.dataset.form);
        })
        .catch(function (err) {
          console.warn('Form error:', err);
          btn.disabled = false; btn.textContent = label;
          show('error', 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.');
        });
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') {
        e.target.setAttribute('aria-invalid', 'false');
        var err = e.target.closest('.field') && e.target.closest('.field').querySelector('.err');
        if (err) err.textContent = '';
      }
    });
  });

  /* ---------- Calculadoras ---------- */
  var MXN = function (n) {
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };
  var line = function (k, v) { return '<div class="line"><span>' + k + '</span><span>' + v + '</span></div>'; };
  var total = function (k, v) { return '<div class="line total-row"><span>' + k + '</span><span class="total">' + v + '</span></div>'; };
  var DAY = 86400000;

  // LFT art. 76 (reforma 2023): 12, 14, 16, 18, 20 y después +2 días por cada 5 años
  function vacDias(n) {
    if (n < 1) return 12;
    if (n <= 5) return 10 + 2 * n;
    return 22 + 2 * Math.floor((n - 6) / 5);
  }

  // Aguinaldo y vacaciones proporcionales a una fecha de salida
  function finiquitoBase(salMensual, vacTomadas, ingreso, salida) {
    var sd = salMensual / 30;
    var inicioAnio = new Date(salida.getFullYear(), 0, 1);
    var desde = ingreso > inicioAnio ? ingreso : inicioAnio;
    var diasAnio = Math.max(0, Math.round((salida - desde) / DAY) + 1);
    var aguinaldo = sd * 15 * (diasAnio / 365);

    var anios = Math.floor((salida - ingreso) / DAY / 365.25);
    var aniv = new Date(ingreso);
    aniv.setFullYear(ingreso.getFullYear() + anios);
    var diasServ = Math.max(0, Math.round((salida - aniv) / DAY) + 1);
    var diasVac = vacDias(anios + 1) * (diasServ / 365);
    var vacPago = Math.max(0, diasVac - Math.max(0, vacTomadas)) * sd;
    return { sd: sd, diasAnio: diasAnio, aguinaldo: aguinaldo, vacPago: vacPago, prima: vacPago * 0.25 };
  }

  var CALCS = {
    cuota: function (v) {
      if (!v.sdi) return null;
      var d = v.sdi * 0.02;
      return line('Cuota diaria', MXN(d)) + total('Cuota mensual aprox.', MXN(d * 30));
    },
    aguinaldo: function (v) {
      if (!v.salario) return null;
      var t = (v.salario / 30) * (v.dias || 15);
      return line('Salario diario', MXN(v.salario / 30)) + total('Aguinaldo estimado', MXN(t));
    },
    vacaciones: function (v) {
      if (!v.salario || !v.anios) return null;
      var dias = vacDias(v.anios), pago = v.salario * dias;
      return line('Días de vacaciones', dias) + line('Pago de vacaciones', MXN(pago)) +
        line('Prima vacacional (25%)', MXN(pago * 0.25)) + total('Total estimado', MXN(pago * 1.25));
    },
    horas: function (v) {
      if (!v.salario || !v.horas) return null;
      var h = v.salario / 8, dobles = Math.min(v.horas, 9), triples = Math.max(v.horas - 9, 0);
      return line('Horas al doble (hasta 9 por semana)', MXN(h * 2 * dobles)) +
        line('Horas al triple (después de 9)', MXN(h * 3 * triples)) +
        total('Total por semana', MXN(h * 2 * dobles + h * 3 * triples));
    },
    dominical: function (v) {
      if (!v.salario || !v.domingos) return null;
      return total('Prima dominical del mes', MXN(v.salario * 0.25 * v.domingos));
    },
    finiquito: function (v) {
      var a = new Date(v.ingreso), b = new Date(v.salida);
      if (!v.salario || isNaN(a) || isNaN(b) || b <= a) return null;
      var d = finiquitoBase(v.salario, v.vacTomadas, a, b);
      return line('Días del año trabajados', d.diasAnio) + line('Aguinaldo proporcional', MXN(d.aguinaldo)) +
        line('Vacaciones proporcionales', MXN(d.vacPago)) + line('Prima vacacional (25%)', MXN(d.prima)) +
        total('Finiquito estimado', MXN(d.aguinaldo + d.vacPago + d.prima));
    },
    liquidacion: function (v) {
      if (!v.salario) return null;
      var sd = v.salario / 30, anios = (v.anios || 0) + (v.meses || 0) / 12;
      var base = v.salmin > 0 ? Math.min(sd, 2 * v.salmin) : sd;
      var tres = sd * 90, veinte = sd * 20 * anios, prima = base * 12 * anios;
      return line('3 meses de salario', MXN(tres)) + line('20 días por año (' + anios.toFixed(1) + ' años)', MXN(veinte)) +
        line('Prima de antigüedad', MXN(prima)) + total('Indemnización estimada', MXN(tres + veinte + prima));
    }
  };

  document.querySelectorAll('.calc[data-calc]').forEach(function (card) {
    var fn = CALCS[card.dataset.calc];
    var out = card.querySelector('.result .body');

    function values() {
      var v = {};
      card.querySelectorAll('input[name]').forEach(function (el) {
        v[el.name] = el.type === 'date' ? el.value : parseFloat(el.value) || 0;
      });
      return v;
    }
    function run() {
      var html = fn(values());
      out.innerHTML = html || '<span class="empty">Llena los datos y verás el resultado aquí.</span>';
    }

    card.addEventListener('input', function (e) {
      var el = e.target;
      if (el.type === 'range') {
        var num = card.querySelector('input[type=number][name="' + el.dataset.for + '"]');
        if (num) num.value = el.value;
      } else if (el.type === 'number') {
        var rg = card.querySelector('input[type=range][data-for="' + el.name + '"]');
        if (rg) rg.value = Math.min(Math.max(el.value, rg.min), rg.max);
      }
      run();
    });
    run();
  });
})();
