
/* =======================
   Products
   ======================= */
const products = [
  { name: "Cherry", price: 2, quantity: 0, productId: 1, image: "images/cherry.jpg" },
  { name: "Orange", price: 3, quantity: 0, productId: 2, image: "images/orange.jpg" },
  { name: "Strawberry", price: 4, quantity: 0, productId: 3, image: "images/strawberry.jpg" },
];

/* =======================
   Cart State
   ======================= */
let cart = [];
let totalPaid = 0;

/* =======================
   Helpers (logic-only)
   ======================= */
function getProductById(productId, fromCart = false) {
  return (fromCart ? cart : products).find((p) => p.productId === productId);
}
function cartTotal() {
  return cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
}

// Logic-safe UI refresher (no-op in tests)
function refreshUI() {
  if (typeof window !== "undefined") {
    if (typeof window.renderCart === "function") window.renderCart();
    if (typeof window.updateCheckout === "function") window.updateCheckout();
  }
}

/* =======================
   Cart Functions (required)
   ======================= */
function addProductToCart(productId) {
  const existing = getProductById(productId, true);
  if (existing) {
    existing.quantity++;
  } else {
    const product = getProductById(productId);
    if (!product) return;
    cart.push({ ...product, quantity: 1 }); // copy with own quantity
  }
  refreshUI();
}

function increaseQuantity(productId) {
  const item = getProductById(productId, true);
  if (!item) return;
  item.quantity++;
  refreshUI();
}

function decreaseQuantity(productId) {
  const item = getProductById(productId, true);
  if (!item) return;
  item.quantity--;
  if (item.quantity === 0) return removeProductFromCart(productId);
  refreshUI();
}

function removeProductFromCart(productId) {
  cart = cart.filter((i) => i.productId !== productId);
  refreshUI();
}

function emptyCart() {
  cart = [];
  refreshUI();
}

/* =======================
   Checkout (required)
   ======================= */
function pay(amount) {
  totalPaid += amount;
  const diff = totalPaid - cartTotal();
  if (diff >= 0) {
    totalPaid = 0;
    emptyCart(); // clear after successful pay
  }
  return diff; // +change / -balance
}

/* =======================
   DOM / UI (browser-only)
   ======================= */
if (typeof document !== "undefined") {
  const toMoney = (n) => `$${Number(n).toFixed(2)}`;

  const productListEl = document.getElementById("products");
  const cartListEl    = document.getElementById("cart-items");
  const totalEl       = document.getElementById("cart-total") ||
                        document.querySelector("[data-cart-total]") ||
                        document.getElementById("total");
  const payForm       = document.getElementById("pay-form") ||
                        document.querySelector("form[data-pay-form]");
  const payInput      = document.getElementById("cash-received") ||
                        document.querySelector("#cashReceived, [name='cash']");
  const receiptEl     = document.getElementById("receipt") ||
                        document.querySelector("[data-receipt]");

  function renderProducts() {
    if (!productListEl) return;
    productListEl.innerHTML = "";
    products.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("product");
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>${toMoney(p.price)}</p>
        <button onclick="addProductToCart(${p.productId})">Add to Cart</button>
      `;
      productListEl.appendChild(div);
    });
  }

  function updateCheckout() {
    if (!totalEl) return;
    totalEl.textContent = `Total: ${toMoney(cartTotal())}`;
  }

  function renderCart() {
    if (!cartListEl) return;
    cartListEl.innerHTML = "";
    cart.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.name}" width="50" />
        <span>${item.name} - ${toMoney(item.price)} x ${item.quantity}</span>
        <button onclick="increaseQuantity(${item.productId})">+</button>
        <button onclick="decreaseQuantity(${item.productId})">-</button>
        <button onclick="removeProductFromCart(${item.productId})">Remove</button>
      `;
      cartListEl.appendChild(li);
    });
    updateCheckout();
  }

  function wireCheckoutForm() {
    if (!payForm) return;
    payForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const amount = Number(payInput ? payInput.value : 0);
      const result = pay(amount);

      if (receiptEl) {
        if (result > 0) {
          receiptEl.textContent = `Payment successful! Change due: ${toMoney(result)}`;
        } else if (result < 0) {
          receiptEl.textContent = `Remaining balance: ${toMoney(Math.abs(result))}`;
        } else {
          receiptEl.textContent = "Payment successful! No change due.";
        }
      }

      if (payInput) payInput.value = "";
      updateCheckout();
    });
  }

  function init() {
    renderProducts();
    renderCart();
    updateCheckout();
    wireCheckoutForm();
    // expose for refreshUI
    window.renderCart = renderCart;
    window.updateCheckout = updateCheckout;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

/* =======================
   Exports for Tests
   ======================= */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    products,
    cart,
    addProductToCart,
    increaseQuantity,
    decreaseQuantity,
    removeProductFromCart,
    cartTotal,
    pay,
    emptyCart,
  };
}
