const form = document.getElementById("si-form");
const resultEl = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    ph: parseFloat(document.getElementById("ph").value),
    temperature: parseFloat(document.getElementById("temperature").value),
    calcium: parseFloat(document.getElementById("calcium").value),
    alkalinity: parseFloat(document.getElementById("alkalinity").value),
    tds: parseFloat(document.getElementById("tds").value)
  };

  try {
    const response = await fetch("https://saturation-index-worker.clip-devious-turf.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    resultEl.textContent = `Saturation Index: ${result.saturationIndex.toFixed(2)}`;
  } catch (err) {
    resultEl.textContent = "Error calculating saturation index.";
  }
});
