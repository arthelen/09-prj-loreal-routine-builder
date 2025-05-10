/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const chatSound = document.getElementById("chatSound");
const userInput = document.getElementById("userInput");
const resetBtn = document.getElementById("resetChat");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  const saved = JSON.parse(localStorage.getItem("selectedProducts")) || [];

  productsContainer.innerHTML = products
    .map(
      (product) => {
        const isSelected = saved.some(p => p.name === product.name);
        return `
        <div class="product-card ${isSelected ? 'selected' : ''}" data-name="${product.name}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
        </div>
      `;
      }
    )
    .join("");

  attachCardListeners(products);
}

/* Attach click event listeners to product cards */
function attachCardListeners(products) {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.dataset.name;
      const selected = JSON.parse(localStorage.getItem("selectedProducts")) || [];
      const product = products.find((p) => p.name === name);
      const index = selected.findIndex((p) => p.name === name);

      if (index > -1) {
        selected.splice(index, 1);
        card.classList.remove("selected");
      } else {
        selected.push(product);
        card.classList.add("selected");
      }

      localStorage.setItem("selectedProducts", JSON.stringify(selected));
      renderSelectedProducts(); // ✅ re-render list
    });
  });
}

function renderSelectedProducts() {
  const selected = JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const container = document.getElementById("selectedProductsList");

  if (selected.length === 0) {
    container.innerHTML = "<p style='opacity: 0.6;'>No products selected yet.</p>";
    return;
  }

  container.innerHTML = selected
    .map(
      (product) => `
      <div class="product-card selected small" data-name="${product.name}">
        <button class="remove-btn" data-name="${product.name}">✖</button>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `
    )
    .join("");

  attachRemoveListeners();
}

/* Attach click event listeners to remove buttons */
function attachRemoveListeners() {
  const buttons = document.querySelectorAll(".remove-btn");
  const cards = document.querySelectorAll(".product-card");

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent bubbling to card click
      const name = btn.dataset.name;

      let selected = JSON.parse(localStorage.getItem("selectedProducts")) || [];
      selected = selected.filter((p) => p.name !== name);
      localStorage.setItem("selectedProducts", JSON.stringify(selected));

      renderSelectedProducts();

      // Unselect in main grid (if visible)
      document
        .querySelectorAll(`.product-card[data-name="${name}"]`)
        .forEach((card) => card.classList.remove("selected"));
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* ----- CHATBOT FUNCTIONALITY ----- */

// Load or initialize messages
let messages = JSON.parse(localStorage.getItem("chatHistory")) || [
  {
    role: "system",
    content:
      "You are a helpful and friendly L’Oréal beauty assistant that knows everything about the brand's products. Your tone should be natural and reminiscent of a normal conversation, with a friendly demeanor that is detailed but concise. Only answer questions related to beauty, skincare, haircare, cosmetics, and L’Oréal routines. If asked unrelated questions, apologize and gently redirect the user back.",
  }
];

// Render previous messages
messages.forEach((msg) => {
  if (msg.role !== "system") appendMessage(msg.role, msg.content);
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  if (chatSound) {
    chatSound.currentTime = 0;
    chatSound.play();
  }

  userInput.value = "";
  messages.push({ role: "user", content: message });
  appendMessage("ai", "💬 Thinking...");

  try {
    const response = await fetch("https://loreal-chatbot.allisonrthelen.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    const reply = data.reply || "⚠️ Sorry, I didn’t catch that.";
    messages.push({ role: "assistant", content: reply });

    if (chatSound) {
    chatSound.currentTime = 0;
    chatSound.play();
  }


    chatWindow.lastChild.querySelector(".bubble").textContent = reply;
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  } catch (error) {
    chatWindow.lastChild.querySelector(".bubble").textContent =
      "❌ Error retrieving response.";
    console.error(error);
  }
});

function appendMessage(role, text) {
  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("msg", role);
  msgWrapper.innerHTML = `<div class="bubble">${text}</div>`;
  chatWindow.appendChild(msgWrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Clear Chat History Button */
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("chatHistory");
    messages = [messages[0]]; // Keep system message
    chatWindow.innerHTML = "";
    appendMessage("ai", "👋 Hi again! Ready to help with your L’Oréal routine.");
  });
}

/* Initialize Enhanced Dropdown */
document.addEventListener("DOMContentLoaded", function () {
  const categoryDropdown = document.getElementById("categoryFilter");
  const choices = new Choices(categoryDropdown, {
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: 'Choose a Category'
  });
});

document.addEventListener("DOMContentLoaded", function () {
  renderSelectedProducts();
});
