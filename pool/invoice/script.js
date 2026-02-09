const productsDiv = document.getElementById("products");
const totalSpan = document.getElementById("total");

function addProduct() {
  const row = document.createElement("div");
  row.innerHTML = `
    <input type="text" placeholder="Product name" class="product-name" required />
    <input type="number" placeholder="Price" class="product-price" step="0.01" required />
  `;
  productsDiv.appendChild(row);

  row.querySelector(".product-price").addEventListener("input", updateTotal);
}

document.getElementById("add-product").addEventListener("click", addProduct);
addProduct();

function updateTotal() {
  let total = 0;
  document.querySelectorAll(".product-price").forEach(p => {
    total += parseFloat(p.value || 0);
  });
  totalSpan.textContent = total.toFixed(2);
}

document.getElementById("invoice-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const products = [...document.querySelectorAll("#products div")].map(row => ({
    name: row.querySelector(".product-name").value,
    price: row.querySelector(".product-price").value
  }));

  const logoFile = document.getElementById("logo").files[0];
  let logoBase64 = null;

  if (logoFile) {
    logoBase64 = await toBase64(logoFile);
  }

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const payload = {
  customer: {
    name: nameInput.value,
    email: emailInput.value,
    phone: phoneInput.value
  },
  products,
  notes: notes.value,
  logo: logoBase64
};


  const res = await fetch("https://invoice-pdf-worker.clip-devious-turf.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "invoice.pdf";
  a.click();
});

function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
