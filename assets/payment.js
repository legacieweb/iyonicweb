function payWithPaystack() {
    let email = document.getElementById("buyer-email").value;
    if (!email) {
        alert("Please enter your email before proceeding.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

    let handler = PaystackPop.setup({
        key: 'your-paystack-public-key',
        email: email,
        amount: totalAmount * 100, // Convert to kobo
        currency: "USD",
        callback: function (response) {
            alert('Payment successful! Transaction ID: ' + response.reference);
            localStorage.removeItem("cart");
            window.location.href = "thankyou.html";
        },
        onClose: function () {
            alert('Payment canceled');
        }
    });
    handler.openIframe();
}

// Load PayPal Button
paypal.Buttons({
    createOrder: function (data, actions) {
        let email = document.getElementById("buyer-email").value;
        if (!email) {
            alert("Please enter your email before proceeding.");
            return;
        }

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        let totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: totalAmount.toFixed(2),
                    currency_code: "USD"
                }
            }]
        });
    },
    onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
            alert('Payment successful! Transaction ID: ' + details.id);
            localStorage.removeItem("cart");
            window.location.href = "thankyou.html";
        });
    },
    onError: function (err) {
        alert("Payment failed. Please try again.");
        console.error(err);
    }
}).render('#paypal-button-container');
