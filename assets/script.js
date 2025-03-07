document.addEventListener("DOMContentLoaded", () => {
    loadFunctions();
    hideAdminButtons();
});


let currentCategory = window.location.pathname.split("/").pop().replace(".html", ""); 

async function loadFunctions() {
    let functionsList = document.getElementById('functions-list');
    functionsList.innerHTML = "";

    try {
        const response = await fetch(`http://localhost:5000/functions/${currentCategory}`);
        const functions = await response.json();

        functions.forEach(func => {
            let functionElement = document.createElement("div");
            functionElement.classList.add("function-item");
            functionElement.innerHTML = `
                <h3>${func.name}</h3>
                <iframe style="width: 100%; height: 200px; border: none;"></iframe>
                <p class="function-price">$${func.price}</p>
                <button class="view-btn" style="background-color: blue;" onclick="openViewPopup('${func._id}')">View Function</button>
                <button class="cart-btn" style="background-color: yellow;" onclick="addToCart('${func._id}', '${func.name}', '${func.price}')">Add to Cart</button>
                <button class="edit-btn admin-only" onclick="openUploadPopup('${func._id}')">Edit HTML</button>
            `;

            functionsList.appendChild(functionElement);

            setTimeout(() => {
                let iframe = functionElement.querySelector("iframe").contentWindow.document;
                iframe.open();
                iframe.write(func.code);
                iframe.close();
            }, 100);
        });
    } catch (error) {
        console.error("Error loading functions:", error);
    }
}

function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let newItem = { id, name, price };

    if (!cart.find(item => item.id === id)) {
        cart.push(newItem);
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    window.location.href = "../checkout.html";
}
async function openUploadPopup(id = null) {
    document.getElementById('upload-popup').style.display = 'flex';

    if (id) {
        const response = await fetch(`http://localhost:5000/function/${id}`);
        const func = await response.json();

        document.getElementById('function-id').value = func._id;
        document.getElementById('function-name').value = func.name;
        document.getElementById('function-price').value = func.price;
        document.getElementById('function-details').value = func.details;
        document.getElementById('function-code').value = func.code;
    } else {
        document.getElementById('function-id').value = "";
        document.getElementById('function-name').value = "";
        document.getElementById('function-price').value = "";
        document.getElementById('function-details').value = "";
        document.getElementById('function-code').value = "";
    }
}

async function saveOrUpdateFunction() {
    let id = document.getElementById('function-id').value;
    let name = document.getElementById('function-name').value;
    let price = document.getElementById('function-price').value;
    let details = document.getElementById('function-details').value;
    let code = document.getElementById('function-code').value;

    if (!name || !price || !details || !code) {
        alert("Please fill in all fields.");
        return;
    }

    let data = { name, price, details, code, category: currentCategory };

    try {
        let url = "http://localhost:5000/functions";
        let method = "POST";

        if (id) {
            url = `http://localhost:5000/function/${id}`;
            method = "PUT";
        }

        await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        closeUploadPopup();
        loadFunctions();
    } catch (error) {
        console.error("Error saving function:", error);
    }
}

async function openViewPopup(id) {
    const response = await fetch(`http://localhost:5000/function/${id}`);
    const func = await response.json();

    document.getElementById('view-title').textContent = func.name;
    document.getElementById('view-details').textContent = func.details;

    let previewContainer = document.getElementById('view-preview');
    previewContainer.innerHTML = "";

    let iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "200px";
    iframe.style.border = "none";
    previewContainer.appendChild(iframe);

    let iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(func.code);
    iframeDoc.close();

    document.getElementById('view-popup').style.display = 'flex';
}

function closeUploadPopup() {
    document.getElementById('upload-popup').style.display = 'none';
}

function closeViewPopup() {
    document.getElementById('view-popup').style.display = 'none';
}
function togglePasswordInput() {
    document.getElementById('admin-password').classList.toggle('hidden');
    document.getElementById('submit-password').classList.toggle('hidden');
}

function unlockAdminButtons() {
    let password = document.getElementById("admin-password").value;
    if (password === "7Switched") {
        document.querySelectorAll(".admin-only").forEach(btn => btn.style.display = "inline-block");
        document.getElementById("create-btn").style.display = "block";
        document.getElementById("admin-password").classList.add("hidden");
        document.getElementById("submit-password").classList.add("hidden");
    } else {
        alert("Unauthorized access.");
    }
}

function hideAdminButtons() {
    document.querySelectorAll(".admin-only").forEach(btn => btn.style.display = "none");
}