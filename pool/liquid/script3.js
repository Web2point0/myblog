document.addEventListener("DOMContentLoaded", () => {
  const rectangleBox = document.getElementById("rectanglePool");
  const circleBox = document.getElementById("circlePool");
  const knownBox = document.getElementById("knownVolume");
  const rectangleFields = document.getElementById("rectangleFields");
  const circleFields = document.getElementById("circleFields");
  const knownFields = document.getElementById("knownVolumeFields");
  const chlorineTypeSelect = document.getElementById("chlorineType");
  const form = document.getElementById("poolForm");
  const result = document.getElementById("result");

  // Toggle form sections
  rectangleBox.onchange = () =>
    (rectangleFields.style.display = rectangleBox.checked ? "block" : "none");
  circleBox.onchange = () =>
    (circleFields.style.display = circleBox.checked ? "block" : "none");
  knownBox.onchange = () =>
    (knownFields.style.display = knownBox.checked ? "block" : "none");

  form.onsubmit = (e) => {
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
      chlorineType: chlorineTypeSelect.value
    };

    // --- Calculate total gallons ---
    let totalGallons = 0;
    if (data.rectanglePool) {
      const avgDepth = (data.shallowDepth + data.deepDepth) / 2;
      totalGallons = data.length * data.width * avgDepth * 7.50;
    } else if (data.circlePool) {
      const radius = data.diameter / 2;
      const avgDepth = (data.circleShallow + data.circleDeep) / 2;
      const cubicFeet = Math.PI * radius * radius * avgDepth;
      totalGallons = cubicFeet * 7.50;
    } else if (data.knownVolume) {
      totalGallons = data.knownGallons;
    }

    // --- Chlorine calculations ---
    let ozNeeded = 0, galNeeded = 0, lbsNeeded = 0;

    if (data.chlorineType === "Sodium Hypochlorite") {
      // Liquid chlorine formula: 10.7 fl oz per 10,000 gal per 1 ppm
      ozNeeded = 10.7 * (totalGallons / 10000) * data.desiredPPM;
      galNeeded = ozNeeded / 128;
    } else if (data.chlorineType === "Trichlor (Tablets)") {
      // Tablet formula: (1.5 oz × (gal / 10,000) × ppm) ÷ 16 = lbs
      const dryOz = 1.5 * (totalGallons / 10000) * data.desiredPPM;
      lbsNeeded = dryOz / 16;
    }

    // --- Display results ---
    result.innerHTML = `
      <h2>Results</h2>
      <p><b>Total Volume:</b> ${totalGallons.toLocaleString(undefined, { maximumFractionDigits: 0 })} gallons</p>
      <p><b>Chlorine Type:</b> ${data.chlorineType}</p>
      ${
        data.chlorineType === "Sodium Hypochlorite"
          ? `
            <p><b>Liquid Needed:</b> ${ozNeeded.toFixed(2)} fl oz</p>
            <p><b>or</b> ${galNeeded.toFixed(3)} gallons</p>
          `
          : `
            <p><b>Trichlor Needed:</b> ${lbsNeeded.toFixed(2)} lbs</p>
          `
      }
    `;
  };
});
