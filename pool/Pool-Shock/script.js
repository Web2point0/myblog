const form = document.getElementById("calcForm");
const resultEl = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const gallons = document.getElementById("gallons").value;
  const ppm = document.getElementById("ppm").value;

  try {
    const response = await fetch("https://breakpoint-chlorination-worker.clip-devious-turf.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gallons: Number(gallons),
        ppm: Number(ppm)
      })
    });

    const data = await response.json();

    resultEl.textContent = 
      `Ounces Required: ${data.ounces.toFixed(2)} oz\n` +
      `Pounds Required: ${data.pounds.toFixed(2)} lbs`;

  } catch (err) {
    resultEl.textContent = "Error calculating dosage.";
    console.error(err);
  }
});
