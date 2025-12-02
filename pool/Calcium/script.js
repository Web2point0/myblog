// Update this with your deployed worker URL
const WORKER_URL = 'https://calcium-increase-calculator.clip-devious-turf.workers.dev';

document.getElementById('calcForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const volume = Number(document.getElementById('volume').value);
  const desired_ppm = Number(document.getElementById('desired').value);
  const strength = document.querySelector('input[name="strength"]:checked').value;

  if (!volume || volume <= 0) {
    alert('Please enter a valid pool volume in gallons.');
    return;
  }

  const payload = { volume_gallons: volume, desired_ppm, strength };

  try {
    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error('Worker error: ' + resp.status);

    const data = await resp.json();
    const textResult = document.getElementById('textResult');

    textResult.innerHTML = `
      <div><strong>Calcium Strength:</strong> ${strength}%</div>
      <div><strong>Pool Volume:</strong> ${volume.toLocaleString()} gallons</div>
      <div><strong>Desired Increase:</strong> ${desired_ppm} ppm</div>
      <hr>
      <div><strong>Lbs of Calcium Flakes:</strong> ${data.lbs_required.toFixed(3)} lbs</div>
      <div><strong>Cups:</strong> ${data.cups.toFixed(2)} cups</div>
      <div><strong>Ounces:</strong> ${data.ounces.toFixed(2)} oz</div>
      <div><strong>Grams:</strong> ${data.grams.toFixed(1)} g</div>
    `;

    document.getElementById('results').hidden = false;

  } catch (err) {
    alert('Calculation failed: ' + err.message);
    console.error(err);
  }
});
