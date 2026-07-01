// ===================== Menú móvil =====================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
  }

  // ===================== FAQ accordion =====================
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ===================== Formularios de afiliación =====================
  // Conectado a Google Sheets vía Apps Script
  // Reemplaza APPS_SCRIPT_URL con la URL de tu web app desplegada
  const APPS_SCRIPT_URL = 'TU_URL_APPS_SCRIPT'; // ← pega aquí tu URL

  document.querySelectorAll('form[data-affiliation-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        // Usamos mode: 'no-cors' para evitar restricciones de CORS con Apps Script
        // El script igual recibe y procesa los datos aunque no podamos leer la respuesta
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(data)
        });
        // Mostramos éxito (el script procesó los datos en Google Sheets)
        const successBox = document.querySelector(form.dataset.successTarget);
        form.style.display = 'none';
        if (successBox) successBox.classList.add('show');
        window.scrollTo({ top: form.closest('section').offsetTop - 100, behavior: 'smooth' });
      } catch {
        alert('Sin conexión a internet. Por favor verifica tu red e intenta de nuevo.');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  });
});

// ===================== Calculadoras mini (index) =====================
function idxCalcCuota() {
  const sdi = parseFloat(document.getElementById('idx-cuota-sdi').value) || 0;
  const diaria = sdi * 0.02;
  const mensual = diaria * 30;
  document.getElementById('idx-cuota-resultado').innerHTML = sdi > 0
    ? `<div style="display:flex;flex-direction:column;gap:.3rem"><span>Cuota diaria: $${diaria.toLocaleString('es-MX',{minimumFractionDigits:2})}</span><strong style="color:var(--gold-bright);font-size:1.1rem">Mensual: $${mensual.toLocaleString('es-MX',{minimumFractionDigits:2})} MXN</strong></div>`
    : '—';
}
function idxCalcAguinaldo() {
  const salario = parseFloat(document.getElementById('idx-ag-salario').value) || 0;
  const resultado = (salario / 30) * 15;
  document.getElementById('idx-ag-resultado').textContent = resultado > 0
    ? `$${resultado.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN` : '—';
}

// ===================== Slider sync helpers =====================
function syncSlider(numId, rangeId, labelId, prefix, calcFn) {
  const val = parseFloat(document.getElementById(rangeId).value) || 0;
  document.getElementById(numId).value = val;
  document.getElementById(labelId).textContent = prefix ? `${prefix}${val.toLocaleString('es-MX')}` : val;
  updateSliderTrack(rangeId);
  calcFn();
}
function syncNumber(numId, rangeId, labelId, prefix, calcFn) {
  const val = parseFloat(document.getElementById(numId).value) || 0;
  const range = document.getElementById(rangeId);
  range.value = Math.min(Math.max(val, range.min), range.max);
  document.getElementById(labelId).textContent = prefix ? `${prefix}${val.toLocaleString('es-MX')}` : val;
  updateSliderTrack(rangeId);
  calcFn();
}
function updateSliderTrack(rangeId) {
  const r = document.getElementById(rangeId);
  const pct = ((r.value - r.min) / (r.max - r.min)) * 100;
  r.style.background = `linear-gradient(to right, var(--navy) ${pct}%, var(--border) ${pct}%)`;
}

// ===================== Calculadoras laborales =====================
function calcularCuota() {
  const sdi = parseFloat(document.getElementById('cuota-sdi').value) || 0;
  const cuotaDiaria = sdi * 0.02;
  const cuotaMensual = cuotaDiaria * 30;
  document.getElementById('cuota-resultado').innerHTML = sdi > 0 ? `
    <div style="display:flex;flex-direction:column;gap:.4rem">
      <span>Cuota diaria: $${cuotaDiaria.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <strong style="color:var(--navy-deep);font-size:1.1rem;margin-top:.4rem">Cuota mensual estimada: $${cuotaMensual.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</strong>
    </div>` : '—';
}

function calcularVacaciones() {
  const salarioDiario = parseFloat(document.getElementById('vac-salario').value) || 0;
  const anios = parseFloat(document.getElementById('vac-anios').value) || 0;
  let diasVacaciones = 12;
  if (anios >= 2) diasVacaciones = 14;
  if (anios >= 3) diasVacaciones = 16;
  if (anios >= 4) diasVacaciones = 18;
  if (anios >= 5) diasVacaciones = 20;
  if (anios >= 6) diasVacaciones = 22;

  const pagoVacaciones = salarioDiario * diasVacaciones;
  const primaVacacional = pagoVacaciones * 0.25;
  const total = pagoVacaciones + primaVacacional;

  document.getElementById('vac-resultado').innerHTML = salarioDiario > 0 ? `
    <div style="display:flex;flex-direction:column;gap:.4rem">
      <span>Días de vacaciones (Ley): ${diasVacaciones}</span>
      <span>Pago de vacaciones: $${pagoVacaciones.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <span>Prima vacacional (25%): $${primaVacacional.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <strong style="color:var(--navy-deep);font-size:1.1rem;margin-top:.4rem">Total estimado: $${total.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</strong>
    </div>` : '—';
}

function calcularHorasExtra() {
  const salarioDiario = parseFloat(document.getElementById('horas-salario').value) || 0;
  const horasExtra = parseFloat(document.getElementById('horas-cantidad').value) || 0;
  const salarioPorHora = salarioDiario / 8;
  const horasDobles = Math.min(horasExtra, 9);
  const horasTriples = Math.max(horasExtra - 9, 0);
  const pagoDoble = salarioPorHora * 2 * horasDobles;
  const pagoTriple = salarioPorHora * 3 * horasTriples;
  const total = pagoDoble + pagoTriple;

  document.getElementById('horas-resultado').innerHTML = salarioDiario > 0 ? `
    <div style="display:flex;flex-direction:column;gap:.4rem">
      <span>Primeras 9 hrs (doble): $${pagoDoble.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <span>Hrs adicionales (triple): $${pagoTriple.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <strong style="color:var(--navy-deep);font-size:1.1rem;margin-top:.4rem">Total semanal estimado: $${total.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</strong>
    </div>` : '—';
}

function calcularPrimaDominical() {
  const salarioDiario = parseFloat(document.getElementById('dominical-salario').value) || 0;
  const domingos = parseFloat(document.getElementById('dominical-dias').value) || 0;
  const resultado = salarioDiario * 0.25 * domingos;
  document.getElementById('dominical-resultado').textContent =
    resultado > 0 ? `$${resultado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—';
}

function calcularAguinaldo() {
  const salario = parseFloat(document.getElementById('aguinaldo-salario').value) || 0;
  const dias = parseFloat(document.getElementById('aguinaldo-dias').value) || 15;
  const resultado = (salario / 30) * dias;
  document.getElementById('aguinaldo-resultado').textContent =
    resultado > 0 ? `$${resultado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—';
}

function calcularFiniquito() {
  const salarioDiario = parseFloat(document.getElementById('finiquito-salario').value) || 0;
  const diasTrabajados = parseFloat(document.getElementById('finiquito-dias').value) || 0;
  const aniosAntiguedad = parseFloat(document.getElementById('finiquito-anios').value) || 0;

  const salarioPendiente = salarioDiario * diasTrabajados;
  const vacacionesProporcionales = salarioDiario * (aniosAntiguedad >= 1 ? 12 : 6) * (diasTrabajados / 365);
  const primaVacacional = vacacionesProporcionales * 0.25;
  const aguinaldoProporcional = (salarioDiario * 15) * (diasTrabajados / 365);

  const total = salarioPendiente + vacacionesProporcionales + primaVacacional + aguinaldoProporcional;

  document.getElementById('finiquito-resultado').innerHTML = `
    <div class="flex" style="display:flex;flex-direction:column;gap:.4rem">
      <span>Salario pendiente: $${salarioPendiente.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <span>Vacaciones proporcionales: $${vacacionesProporcionales.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <span>Prima vacacional: $${primaVacacional.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <span>Aguinaldo proporcional: $${aguinaldoProporcional.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
      <strong style="color:var(--navy-deep);font-size:1.1rem;margin-top:.4rem">Total estimado: $${total.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</strong>
    </div>`;
}
