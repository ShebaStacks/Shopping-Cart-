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
   Helpers
   ======================= */

/** Return product by id from products or cart. */
function getProductById(productId, fromCart = false) {
  return (fromCart ? cart : products).find((p) => p.productId === productId);
}

/** Format number as money string. */
function toMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

/** Safely refresh UI in browser only. */
function refreshUI() {
  if (typeof document === "undefined") return;
  if (typeof renderCart === "function") renderCart();
  if (typeof updateCheckout === "function") updateCheckout();
}

/* =======================
   Cart Functions
   ======================= */

/** Add a product; ensure it exists in cart; increase quantity. */
function addProductToCart(productId) {
  const product = getProductById(productId);
  if (!product) return;

  product.quantity += 1;
  if (!getProductById(productId, true)) cart.push(product);

  refreshUI();
}

/** Increase quantity for a product in cart. */
function increaseQuantity(productId) {
  const product = getProductById(productId);
  if (!product) return;

  product.quantity += 1;
  if (!getProductById(productId, true)) cart.push(product);

  refreshUI();
}

/** Decrease quantity; remove from cart if it reaches zero. */
function decreaseQuantity(productId) {
  const product = getProductById(productId);
  if (!product) return;

  if (product.quantity > 0) product.quantity -= 1;
  if (product.quantity === 0) cart = cart.filter((i) => i.productId !== productId);

  refreshUI();
}

/** Remove a product entirely from the cart. */
function removeProductFromCart(productId) {
  const product = getProductById(productId);
  if (!product) return;

  product.quantity = 0;
  cart = cart.filter((i) => i.productId !== productId);

  refreshUI();
}

/** Empty the cart and reset product quantities. */
function emptyCart() {
  cart.forEach((p) => { p.quantity = 0; });
  cart = [];
  refreshUI();
}

/* =======================
   Checkout
   ======================= */

/** Return the total cost of items in the cart. */
function cartTotal() {
  return cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
}

/** Process a payment; return change (positive) or balance due (negative). */
function pay(amount) {
  totalPaid += amount;
  const diff = totalPaid - cartTotal();
  if (diff >= 0) totalPaid = 0;
  return diff;
}

/* =======================
   DOM / UI (browser only)
   ======================= */
let productListEl, cartListEl, totalEl, payForm, payInput, receiptEl;

/** Cache DOM elements. */
function bindUI() {
  if (typeof document === "undefined") return;

  productListEl = document.getElementById("products");
  cartListEl    = document.getElementById("cart-items");
  totalEl       = document.getElementById("cart-total")
               || document.querySelector("[data-cart-total]")
               || document.getElementById("total");
  payForm       = document.getElementById("pay-form")
               || document.querySelector("form[data-pay-form]");
  payInput      = document.getElementById("cash-received")
               || document.querySelector("#cashReceived, [name='cash']");
  receiptEl     = document.getElementById("receipt")
               || document.querySelector("[data-receipt]");
}

/** Render storefront products. */
function renderProducts() {
  if (typeof document === "undefined" || !productListEl) return;

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

/** Render cart items and controls. */
function renderCart() {
  if (typeof document === "undefined" || !cartListEl) return;

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

/** Update checkout total display. */
function updateCheckout() {
  if (typeof document === "undefined" || !totalEl) return;
  totalEl.textContent = `Total: ${toMoney(cartTotal())}`;
}

/** Wire up the payment form submit behavior. */
function wireCheckoutForm() {
  if (typeof document === "undefined" || !payForm) return;

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

/** Initialize UI on DOM ready. */
function init() {
  bindUI();
  renderProducts();
  renderCart();
  updateCheckout();
  wireCheckoutForm();
}

if (typeof document !== "undefined") {
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
