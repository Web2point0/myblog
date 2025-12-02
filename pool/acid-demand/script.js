document.getElementById("acidForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const drops = document.getElementById("drops").value;
  const gallons = document.getElementById("gallons").value;
  const resultDiv = document.getElementById("result");

  // Clear old result
  resultDiv.innerHTML = "";

  if (!drops || !gallons) {
    resultDiv.textContent = "Please select both drop count and pool volume.";
    return;
  }

  try {
    const response = await fetch("https://acid-demand-calculator.clip-devious-turf.workers.dev/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drops, gallons })
    });

    const data = await response.json();

    if (data.error) {
      resultDiv.textContent = data.error;
      return;
    }

    // Build results display
    const base = data.base || "N/A";
    const conversions = data.conversions || {};

    let html = `<h3>Base Measurement:</h3>
                <p>${base}</p>
                <h4>Conversions:</h4>
                <ul style="list-style:none; padding:0;">`;

    for (const [unit, value] of Object.entries(conversions)) {
      html += `<li>${value} ${unit}</li>`;
    }

    html += "</ul>";

    resultDiv.innerHTML = html;

  } catch (err) {
    console.error("Error:", err);
    resultDiv.textContent = "Error communicating with the server.";
  }
});
