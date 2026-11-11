/* FoodFever - Login, Sign up and Profile page behaviour */
/* Developer: Keith */

(() => {
  const Auth = window.FoodFeverAuth;
  const $ = id => document.getElementById(id);

  function showMessage(element, text, type = "error") {
    element.textContent = text;
    element.className = `auth-message ${text ? type : ""}`;
  }

  // Disable a submit button while we wait on async work
  async function withBusy(form, work) {
    const button = form.querySelector(".auth-submit");
    button.disabled = true;
    try {
      await work();
    } finally {
      button.disabled = false;
    }
  }

  // Only allow redirects to a local .html file (blocks open-redirect tricks)
  function getNextPage() {
    const next = new URLSearchParams(location.search).get("next");
    return next && /^[\w\-./]+\.html$/.test(next) && !next.includes("..") ? next : null;
  }

  /* ---------- Login / Sign up page ---------- */
  if ($("login-form")) {
    const loginForm = $("login-form");
    const signupForm = $("signup-form");
    const message = $("auth-message");

    // Already logged in? Skip the form.
    const existing = Auth.getCurrentUser();
    if (existing) location.replace(getNextPage() || Auth.homeFor(existing));

    function switchTab(tab) {
      const isLogin = tab === "login";
      loginForm.hidden = !isLogin;
      signupForm.hidden = isLogin;
      document.querySelectorAll(".auth-tabs button").forEach(button => {
        const active = button.dataset.tab === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active);
      });
      showMessage(message, "");
    }

    document.querySelectorAll(".auth-tabs button").forEach(button => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    // Show / hide password
    document.querySelectorAll(".toggle-pw").forEach(button => {
      button.addEventListener("click", () => {
        const input = $(button.dataset.target);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.textContent = show ? "Hide" : "Show";
      });
    });

    // Vendors need a stall name
    document.querySelectorAll('input[name="role"]').forEach(radio => {
      radio.addEventListener("change", () => {
        $("stall-field").hidden = signupForm.elements.role.value !== "vendor";
      });
    });

    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      withBusy(loginForm, async () => {
        const result = await Auth.logIn({
          email: $("login-email").value,
          password: $("login-password").value
        });

        if (!result.ok) return showMessage(message, result.error);

        showMessage(message, "Logged in. Taking you to the menu...", "success");
        location.href = getNextPage() || Auth.homeFor(result.user);
      });
    });

    signupForm.addEventListener("submit", event => {
      event.preventDefault();
      withBusy(signupForm, async () => {
        if ($("signup-password").value !== $("signup-confirm").value) {
          return showMessage(message, "Passwords do not match.");
        }

        const result = await Auth.signUp({
          name: $("signup-name").value,
          email: $("signup-email").value,
          phone: $("signup-phone").value,
          password: $("signup-password").value,
          role: signupForm.elements.role.value,
          stallName: $("signup-stall").value
        });

        if (!result.ok) return showMessage(message, result.error);

        showMessage(message, "Account created. Taking you in...", "success");
        location.href = getNextPage() || Auth.homeFor(result.user);
      });
    });
  }

  /* ---------- Profile page ---------- */
  if ($("profile-form")) {
    const user = Auth.requireRole(); // sends logged-out visitors to login.html
    if (!user) return;

    const profileForm = $("profile-form");
    const passwordForm = $("password-form");
    const isVendor = user.role === "vendor";

    $("role-badge").textContent = user.role;
    $("profile-email").value = user.email;
    $("profile-name").value = user.name;
    $("profile-phone").value = user.phone;
    $("profile-stall-field").hidden = !isVendor;
    if (isVendor) $("profile-stall").value = user.stallName;

    profileForm.addEventListener("submit", event => {
      event.preventDefault();
      const result = Auth.updateProfile({
        name: $("profile-name").value,
        phone: $("profile-phone").value,
        stallName: $("profile-stall").value
      });

      if (!result.ok) return showMessage($("profile-message"), result.error);

      $("profile-phone").value = result.user.phone;
      showMessage($("profile-message"), "Changes saved.", "success");
    });

    passwordForm.addEventListener("submit", event => {
      event.preventDefault();
      withBusy(passwordForm, async () => {
        const result = await Auth.changePassword({
          currentPassword: $("current-password").value,
          newPassword: $("new-password").value
        });

        if (!result.ok) return showMessage($("password-message"), result.error);

        passwordForm.reset();
        showMessage($("password-message"), "Password updated.", "success");
      });
    });

    $("logout-btn").addEventListener("click", () => {
      Auth.logOut();
      location.href = "login.html";
    });
  }
})();