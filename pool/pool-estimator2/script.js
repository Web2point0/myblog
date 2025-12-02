// script.js
const WORKER_URL = "https://pool-service-estimator.clip-devious-turf.workers.dev/calculate"; // <- REPLACE this

const form = document.getElementById('estimateForm');
const resultsArea = document.getElementById('resultsArea');
const downloadBtn = document.getElementById('downloadPdf');

let lastResponse = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultsArea.innerHTML = '<p>Estimating...</p>';
  downloadBtn.disabled = true;

  const data = Object.fromEntries(new FormData(form).entries());

  // Normalize numeric fields
  data.featureCount = Math.max(0, parseInt(data.featureCount || '0', 10));
  data.hourlyWage = Number(data.hourlyWage) || 25;

  try {
    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'cors'
    });

    const json = await resp.json();
    if (!resp.ok) {
      resultsArea.innerHTML = `<pre>Error: ${JSON.stringify(json, null, 2)}</pre>`;
      return;
    }
    lastResponse = json;
    renderResults(json);
    downloadBtn.disabled = false;
  } catch (err) {
    resultsArea.innerHTML = `<pre>Network error: ${err.message}</pre>`;
  }
});

downloadBtn.addEventListener('click', () => {
  if (!lastResponse) return;
  createPdf(lastResponse);
});

function renderResults(data) {
  // Summary at top
  const header = `
    <div class="summary">
      <strong>Input summary:</strong>
      <div class="muted">Pool size: ${data.inputs.poolSize} | Water: ${data.inputs.waterType} | Filter: ${data.inputs.filterType} | Clarity: ${data.inputs.clarity}</div>
    </div>
  `;

  // Build a table comparing every service tier (the worker returns results.tiers array)
  let table = `<table><thead><tr>
    <th>Service Tier</th>
    <th>Base Price</th>
    <th>Chemicals / month</th>
    <th>Filter Cost / month</th>
    <th>Labor & extras</th>
    <th>One-time correction</th>
    <th><strong>Total monthly</strong></th>
  </tr></thead><tbody>`;

  for (const tier of data.tiers) {
    table += `<tr>
      <td>${tier.name}</td>
      <td>$${tier.base_price.toFixed(2)}</td>
      <td>$${tier.chemicals_cost.toFixed(2)}</td>
      <td>$${tier.filter_cost.toFixed(2)}</td>
      <td>$${tier.labor_and_extras.toFixed(2)}</td>
      <td>$${tier.one_time_correction.toFixed(2)}</td>
      <td><strong>$${tier.total.toFixed(2)}</strong></td>
    </tr>`;
  }
  table += `</tbody></table>`;

  // Full breakdown (first tier as example)
  const breakdown = `<pre style="margin-top:12px;">${JSON.stringify(data, null, 2)}</pre>`;

  resultsArea.innerHTML = header + table + breakdown;
}

function createPdf(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(14);
  doc.text("Pool Monthly Service Estimate", 40, 50);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, 40, 68);
  doc.text(`Inputs: Pool size: ${data.inputs.poolSize} | Water: ${data.inputs.waterType} | Filter: ${data.inputs.filterType} | Clarity: ${data.inputs.clarity}`, 40, 86);
  let y = 110;
  doc.setFontSize(11);
  for (const tier of data.tiers) {
    doc.text(`${tier.name}: Total monthly: $${tier.total.toFixed(2)}`, 40, y);
    y += 16;
    doc.setFontSize(9);
    doc.text(`  breakdown: base $${tier.base_price.toFixed(2)}  chems $${tier.chemicals_cost.toFixed(2)}  filter $${tier.filter_cost.toFixed(2)}  labor/extras $${tier.labor_and_extras.toFixed(2)}  one-time $${tier.one_time_correction.toFixed(2)}`, 40, y);
    y += 20;
    doc.setFontSize(11);
    if (y > 700) { doc.addPage(); y = 60; }
  }

  const pdfName = `PoolEstimate_${Date.now()}.pdf`;
  doc.save(pdfName);
}
