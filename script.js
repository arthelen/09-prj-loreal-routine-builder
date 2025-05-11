const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const chatSound = document.getElementById("chatSound");

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  renderProducts();
  renderSelectedProducts();
}

function renderProducts() {
  const selectedCategory = categoryFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  if (!selectedCategory && !query) {
    productsContainer.innerHTML = `<div class="placeholder-message">Search or choose a category to view products.</div>`;
    return;
  }

  const filtered = allProducts.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.brand.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  if (filtered.length === 0) {
    productsContainer.innerHTML = `<div class="placeholder-message">No matching products found.</div>`;
    return;
  }

  productsContainer.innerHTML = filtered.map((product) => {
    const isSelected = selectedProducts.some((p) => p.id === product.id);
    return `
      <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <div class="product-buttons">
          <button class="desc-btn">Description</button>
          <button class="select-btn">${isSelected ? "Remove" : "Select"}</button>
        </div>
        <div class="product-overlay hidden">
          <div class="overlay-content">
            <p>${product.description}</p>
            <button class="close-overlay">Close</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

productsContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const id = parseInt(card.dataset.id);
  const product = allProducts.find((p) => p.id === id);

  if (e.target.classList.contains("select-btn")) {
    const index = selectedProducts.findIndex((p) => p.id === id);
    if (index > -1) {
      selectedProducts.splice(index, 1);
    } else {
      selectedProducts.push(product);
    }
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    renderProducts();
    renderSelectedProducts();
  }

  if (e.target.classList.contains("desc-btn")) {
    const overlay = card.querySelector(".product-overlay");
    overlay.classList.remove("hidden");
    overlay.classList.add("show");
  }

  if (e.target.classList.contains("close-overlay")) {
    const overlay = card.querySelector(".product-overlay");
    overlay.classList.remove("show");
    overlay.classList.add("hidden");
  }
});

function renderSelectedProducts() {
  const clearBtn = document.getElementById("clearSelectedBtn");

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p><span>No products selected yet.</span></p>`;
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

  selectedProductsList.innerHTML = selectedProducts.map((product) => `
    <div class="product-card small" data-id="${product.id}">
      <button class="remove-btn" title="Remove">×</button>
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `).join("");

  selectedProductsList.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".product-card");
      const id = parseInt(card.dataset.id);
      selectedProducts = selectedProducts.filter((p) => p.id !== id);
      localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
      renderProducts();
      renderSelectedProducts();
    });
  });

  if (clearBtn) clearBtn.style.display = "block";
}

document.getElementById("clearSelectedBtn").addEventListener("click", () => {
  selectedProducts = [];
  localStorage.removeItem("selectedProducts");
  renderProducts();
  renderSelectedProducts();
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

/* ========== Chatbot ========== */
const messages = [
  {
    role: "system",
    content: "You are a helpful and friendly L’Oréal beauty assistant that knows everything about the brand's products. Only answer questions related to beauty, skincare, haircare, cosmetics, and L’Oréal routines.",
  }
];

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  messages.push({ role: "user", content: message });
  userInput.value = "";

  const funMessages = [
  "💄 Swatching some shades",
  "🧴 Rummaging through the skincare shelf",
  "🌟 Mixing up some magic",
  "💋 Pouting for science",
  "⏳ Waiting for the serum to sink in",
  "📦 Unboxing the glam stash",
  ];

  const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

  const typingBubble = document.createElement("div");
  typingBubble.classList.add("msg", "ai");
  typingBubble.innerHTML = `<div class="bubble"><span class="typing-dots">${randomMessage}</span></div>`;
  chatWindow.appendChild(typingBubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (chatSound) {
    chatSound.currentTime = 0;
    chatSound.play();
  }

  try {
    const response = await fetch("https://loreal-routine-builder-chatbot.allisonrthelen.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    const reply = data.reply || "⚠️ Sorry, I didn’t catch that.";
    messages.push({ role: "assistant", content: reply });

    // Build reply with citations if available
    let replyHTML = `<p>${reply}</p>`;
    if (data.sources && data.sources.length > 0) {
      replyHTML += `<div class="sources"><strong>Sources:</strong><ul>`;
      data.sources.forEach(source => {
        replyHTML += `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a></li>`;
      });
      replyHTML += `</ul></div>`;
    }

    chatWindow.lastChild.querySelector(".bubble").innerHTML = replyHTML;

    if (chatSound) {
      chatSound.currentTime = 0;
      chatSound.play();
    }
  } catch (error) {
    chatWindow.lastChild.querySelector(".bubble").textContent = "❌ Error retrieving response.";
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

document.addEventListener("DOMContentLoaded", function () {
  new Choices(categoryFilter, {
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: 'Choose a Category',
  });

  appendMessage("ai", "👋 Hi there! I'm your personal L’Oréal beauty advisor. Ask me anything or select products to start building your perfect routine.");
  loadProducts();
});