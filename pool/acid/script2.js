document.getElementById("calc-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const gallons = parseFloat(document.getElementById("gallons").value);
  const resultsDiv = document.getElementById("results");

  if (isNaN(gallons) || gallons <= 0) {
    alert("Please enter a valid number of gallons.");
    return;
  }

  try {
    const response = await fetch("https://pool-calculator.yourname.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gallons }),
    });

    // Check HTTP status first
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    // Try parsing JSON safely
    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("Invalid JSON response. Raw text:", text);
      throw new Error("The server returned invalid JSON.");
    }

    console.log("Worker response:", data);

    // Validate data fields before using
    if (!data || typeof data.totalGallons !== "number") {
      throw new Error("Malformed data from server.");
    }

    // ✅ Update UI safely
    document.getElementById("totalGallons").textContent = data.totalGallons.toLocaleString();
    document.getElementById("ozNeeded").textContent = data.ozNeeded.toFixed(2);
    document.getElementById("galNeeded").textContent = data.galNeeded.toFixed(3);

  } catch (err) {
    console.error("Error:", err);
    resultsDiv.innerHTML = `<p style="color:red;">⚠️ Error: ${err.message}</p>`;
  }
});
