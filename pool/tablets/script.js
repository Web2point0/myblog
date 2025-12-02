document.getElementById("calcForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const resultDiv = document.getElementById("result");
  const v = parseFloat(document.getElementById("volume").value);
  const p = parseFloat(document.getElementById("ppm").value);

  // Default invalid/blank to zero
  const volume = !isNaN(v) && v > 0 ? v : 0;
  const ppm = !isNaN(p) && p > 0 ? p : 0;

  if (volume === 0 || ppm === 0) {
    resultDiv.textContent = "Please enter valid numbers for both fields.";
    return;
  }

  resultDiv.textContent = "Calculating...";

  try {
    const res = await fetch("https://trichlor.clip-devious-turf.workers.dev/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volume, ppm })
    });

    const data = await res.json();
    console.log("Worker response:", data);

    if (!res.ok) {
      resultDiv.textContent = data.error || "Worker returned an error.";
      return;
    }

    if (typeof data.trichlor_lbs === "number") {
      resultDiv.textContent = `You need approximately ${data.trichlor_lbs.toFixed(2)} lbs of Trichlor.`;
    } else {
      resultDiv.textContent = "Unexpected response from worker.";
    }
  } catch (err) {
    console.error(err);
    resultDiv.textContent = "Error contacting worker.";
  }
});
