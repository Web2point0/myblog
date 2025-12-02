document.getElementById('calcForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const volume = parseFloat(document.getElementById('volume').value);
  const change = parseFloat(document.getElementById('change').value);
  const unit = document.getElementById('unit').value;

  const response = await fetch('https://acid-demand-calculator-trial.clip-devious-turf.workers.dev/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume, change, unit })
  });

  const data = await response.json();
  if (data.error) {
    document.getElementById('result').innerHTML = `<strong>Error:</strong> ${data.error}`;
  } else {
    document.getElementById('result').innerHTML = `
      <strong>Result:</strong> ${data.result.toFixed(2)} ${data.unit}
    `;
  }
});
