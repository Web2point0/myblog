document.getElementById("estimateForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const customer_name = document.getElementById("customer_name").value.trim();
  const customer_email = document.getElementById("customer_email").value.trim();
  const pool_size = document.getElementById("pool_size").value.trim();
  const selected_tier = document.getElementById("selected_tier").value;
  const notes = document.getElementById("notes").value.trim();

  if (!customer_name || !customer_email || !pool_size) {
    alert("Please fill in all required fields.");
    return;
  }

  const WORKER_URL = "https://pool-estimator.clip-devious-turf.workers.dev";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name,
        customer_email,
        pool_size,
        selected_tier,
        notes
      }),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const result = await response.json();

    document.getElementById("results").innerHTML = `
      <h3>Estimate Summary</h3>
      <p><strong>Pool Type:</strong> ${result.pool_category}</p>
      <p><strong>Weekly Prices:</strong> ${JSON.stringify(result.weekly)}</p>
      <p><strong>Monthly Prices:</strong> ${JSON.stringify(result.monthly)}</p>
      <a href="data:application/pdf;base64,${result.pdf}" download="Pool_Estimate.pdf">Download PDF Estimate</a>
    `;
  } catch (err) {
    console.error("Error submitting estimate:", err);
    alert("Something went wrong while generating your estimate. Please try again.");
  }
});
