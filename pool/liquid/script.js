document.addEventListener("DOMContentLoaded", () => {
  const rectangleBox = document.getElementById("rectanglePool");
  const circleBox = document.getElementById("circlePool");
  const knownBox = document.getElementById("knownVolume");
  const rectangleFields = document.getElementById("rectangleFields");
  const circleFields = document.getElementById("circleFields");
  const knownFields = document.getElementById("knownVolumeFields");
  const form = document.getElementById("poolForm");
  const result = document.getElementById("result");

  rectangleBox.onchange = () =>
    (rectangleFields.style.display = rectangleBox.checked ? "block" : "none");
  circleBox.onchange = () =>
    (circleFields.style.display = circleBox.checked ? "block" : "none");
  knownBox.onchange = () =>
    (knownFields.style.display = knownBox.checked ? "block" : "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    result.innerHTML = `<p>Calculating...</p>`;

    const data = {
      rectanglePool: rectangleBox.checked,
      circlePool: circleBox.checked,
      knownVolume: knownBox.checked,
      length: parseFloat(document.getElementById("length")?.value || 0),
      width: parseFloat(document.getElementById("width")?.value || 0),
      shallowDepth: parseFloat(document.getElementById("shallowDepth")?.value || 0),
      deepDepth: parseFloat(document.getElementById("deepDepth")?.value || 0),
      diameter: parseFloat(document.getElementById("diameter")?.value || 0),
      circleShallow: parseFloat(document.getElementById("circleShallow")?.value || 0),
      circleDeep: parseFloat(document.getElementById("circleDeep")?.value || 0),
      knownGallons: parseFloat(document.getElementById("knownGallons")?.value || 0),
      desiredPPM: parseFloat(document.getElementById("desiredPPM")?.value || 0),
    };

    try {
      const res = await fetch("https://pool-calculator.clip-devious-turf.workers.dev/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      console.log("Worker Response:", json);

      // Defensive guards against missing or error fields
      if (json.error) {
        result.innerHTML = `<p style="color:red"><b>Error:</b> ${json.error}</p>`;
        return;
      }

      const totalGallons = json.totalGallons || 0;
      const ozNeeded = json.ozNeeded || 0;
      const galNeeded = json.galNeeded || 0;

      result.innerHTML = `
        <h2>Results</h2>
        <p><b>Total Volume:</b> ${totalGallons.toLocaleString()} gallons</p>
        <p><b>Sodium Hypochlorite Needed:</b> ${ozNeeded.toFixed(2)} fl oz</p>
        <p><b>or</b> ${galNeeded.toFixed(3)} gallons</p>
      `;
    } catch (err) {
      console.error("Worker fetch failed:", err);
      result.innerHTML = `<p style="color:red">Error connecting to calculator.</p>`;
    }
  };
});
