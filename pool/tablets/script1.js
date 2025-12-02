document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const volume = parseFloat(document.getElementById("volume").value);
  const ppm = parseFloat(document.getElementById("ppm").value);
  const resultDiv = document.getElementById("result");

  resultDiv.textContent = "Calculating...";

  try {
    const response = await fetch("https://pool-calculator.clip-devious-turf.workers.dev/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volume, ppm }),
    });

    const data = await response.json();

    console.log("Worker response:", data);
    if (data.trichlor_lbs !== undefined) {
      resultDiv.textContent = `You need approximately ${data.trichlor_lbs.toFixed(2)} lbs of Trichlor.`;
    } else {
      resultDiv.textContent = "Error: Invalid response from worker.";
    }
  } catch (err) {
    resultDiv.textContent = "Error connecting to worker.";
  }
});
