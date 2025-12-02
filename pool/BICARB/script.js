document.getElementById('alkalinityForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const volume = parseFloat(document.getElementById('volume').value);
  const ppm = parseFloat(document.getElementById('ppm').value);

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = "Calculating...";

  try {
    const response = await fetch('https://alkalinity-calculator.clip-devious-turf.workers.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume, ppm })
    });

    if (!response.ok) throw new Error(`Worker error: ${response.status}`);
    const data = await response.json();

    resultDiv.innerHTML = `
      <p><strong>Sodium Bicarbonate Needed:</strong> ${data.sodium_bicarb_lbs.toFixed(2)} lbs</p>
      <p><strong>Equivalent in Cups:</strong> ${data.sodium_bicarb_cups.toFixed(2)} cups</p>
      <p><small>Formula used: 1.4 × (volume / 10,000) × (ppm / 10)</small></p>
    `;
  } catch (error) {
    resultDiv.textContent = "Error: " + error.message;
  }
});
