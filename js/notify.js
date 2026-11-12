/* FoodFever - Email notifications (EmailJS, works from the browser, no backend) */
/* Used by the vendor dashboard when an order is marked Delivered. */

window.FoodFeverNotify = (() => {
  // 1. Create a free account at https://www.emailjs.com
  // 2. Add an email service (for example Gmail), then create a template (see the steps in the chat)
  // 3. Paste your three values here:
  const EMAILJS = {
    publicKey: "YOUR_PUBLIC_KEY",
    serviceId: "YOUR_SERVICE_ID",
    templateId: "YOUR_TEMPLATE_ID"
  };

  const SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

  const isConfigured = () =>
    !Object.values(EMAILJS).some(value => !value || /^YOUR_/.test(value));

  // Small message at the bottom of the screen.
  function toast(message, kind) {
    const old = document.querySelector(".ff-toast");
    if (old) old.remove();

    const box = document.createElement("div");
    box.className = "ff-toast" + (kind ? " is-" + kind : "");
    box.setAttribute("role", "status");
    box.textContent = message;
    document.body.appendChild(box);

    setTimeout(() => box.remove(), 4500);
  }

  function describePayment(order) {
    const p = order.payment;
    if (!p) return "";
    if (p.method === "Pay on delivery") {
      return p.status === "Paid" ? "Payment received on delivery. Thank you!" : "";
    }
    return p.receipt ? "Paid with M-Pesa. Receipt: " + p.receipt : "";
  }

  async function orderDelivered(order) {
    const email = order && order.customer && order.customer.email;

    if (!email) {
      toast("This order has no email address, so no email was sent.", "warn");
      return { ok: false, reason: "no-email" };
    }

    if (!isConfigured()) {
      console.warn("FoodFeverNotify: add your EmailJS keys in js/notify.js to send emails.");
      toast("Email isn't set up yet. Add your EmailJS keys in js/notify.js.", "warn");
      return { ok: false, reason: "not-configured" };
    }

    const params = {
      to_email: email,
      to_name: (order.customer.name || "there").split(" ")[0],
      order_id: order.id,
      location: order.location,
      items: order.items.map(item => item.qty + " × " + item.name).join(", "),
      total: "KES " + order.total.toLocaleString(),
      payment_note: describePayment(order)
    };

    try {
      const response = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.serviceId,
          template_id: EMAILJS.templateId,
          user_id: EMAILJS.publicKey,
          template_params: params
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast("Email sent to " + email, "ok");
      return { ok: true };
    } catch (error) {
      console.error("FoodFeverNotify: could not send the email:", error);
      toast("Could not send the email. Check your EmailJS keys and template.", "error");
      return { ok: false, reason: "send-failed" };
    }
  }

  return { orderDelivered, toast };
})();