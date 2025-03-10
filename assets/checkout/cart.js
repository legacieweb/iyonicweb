document.addEventListener("DOMContentLoaded", loadCart);

function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartItems = document.getElementById("cart-items");
    let totalPrice = 0;

    cartItems.innerHTML = "";
    cart.forEach(item => {
        totalPrice += parseFloat(item.price);

        let cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <h3>${item.name}</h3>
            <p>Price: $${item.price}</p>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });

    document.getElementById("total-price").textContent = `$${totalPrice.toFixed(2)}`;
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

