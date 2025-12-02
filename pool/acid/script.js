document.getElementById("calc-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const gallons = parseFloat(document.getElementById("gallons").value);
  const resultsDiv = document.getElementById("results");

  if (isNaN(gallons) || gallons <= 0) {
    alert("Please enter a valid number of gallons.");
    return;
  }

  try {
    const response = await fetch("https://acid.clip-devious-turf.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gallons }),
    });

    const data = await response.json();

    document.getElementById("totalGallons").textContent = data.totalGallons.toLocaleString();
    document.getElementById("ozNeeded").textContent = data.ozNeeded.toFixed(2);
    document.getElementById("galNeeded").textContent = data.galNeeded.toFixed(3);
  } catch (err) {
    console.error("Error:", err);
    resultsDiv.innerHTML = `<p style="color:red;">Error: Could not retrieve calculation results.</p>`;
  }
});
