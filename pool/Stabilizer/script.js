// script.js — clean output version
const WORKER_URL = "https://cyanuric-acid-calculator.clip-devious-turf.workers.dev"; // <-- Replace with your deployed Worker URL

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calcForm');
  const errorEl = document.getElementById('error');
  const resultBox = document.getElementById('resultBox');
  const ozEl = document.getElementById('oz');
  const lbsEl = document.getElementById('lbs');
  const cupsEl = document.getElementById('cups');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    resultBox.style.display = 'none';

    const volume = Number(document.getElementById('volume').value);
    const ppm = Number(document.getElementById('ppm').value);

    if (!isFinite(volume) || volume <= 0) {
      return showError("Please enter a valid pool volume (in gallons).");
    }

    const payload = { volume_gallons: volume, desired_ppm: ppm };

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Worker error: ${res.status}`);
      }

      const data = await res.json();
      if (!data.results) throw new Error("Unexpected Worker response.");

      ozEl.textContent = `${data.results.ounces} oz`;
      lbsEl.textContent = `${data.results.pounds} lbs`;
      cupsEl.textContent = `${data.results.cups} cups`;

      resultBox.style.display = 'block';
    } catch (err) {
      console.error(err);
      showError("Could not calculate. Check console or Worker URL.");
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
});
