/* FoodFever - User Accounts & Access */
/* Developer: Keith */
/* Prototype only: accounts live in localStorage. A real backend must replace this. */

window.FoodFeverAuth = (() => {
  const USERS_KEY = "foodfever_users";
  const SESSION_KEY = "foodfever_session";

  // Where each role lands after login. Teammates: change these when your pages exist
  // (e.g. vendor: "vendor.html" once the vendor dashboard is ready).
  const ROLE_HOME = {
    student: "index.html",
    vendor: "index.html",
    admin: "index.html"
  };

  // Seeded admin (admins cannot sign up through the form)
  const ADMIN = {
    name: "FoodFever Admin",
    email: "admin@foodfever.test",
    phone: "254700000000",
    password: "Admin1234"
  };

  /* ---------- storage helpers ---------- */
  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const getUsers = () => read(USERS_KEY, []);
  const fail = error => ({ ok: false, error });

  /* ---------- password hashing (SHA-256 + salt) ---------- */
  const toHex = bytes =>
    [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");

  const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(8)));

  async function hash(password, salt) {
    const data = new TextEncoder().encode(salt + password);
    return toHex(await crypto.subtle.digest("SHA-256", data));
  }

  /* ---------- validation ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^(?:\+?254|0)[17]\d{8}$/;

  // Store phones as 2547XXXXXXXX so M-Pesa can use them directly
  function normalizePhone(phone) {
    const clean = String(phone).replace(/[\s-]/g, "");
    if (!PHONE_RE.test(clean)) return null;
    return "254" + clean.replace(/^(?:\+?254|0)/, "");
  }

  function checkPassword(password) {
    if (typeof password !== "string" || password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "Password must include at least one letter and one number.";
    }
    return null;
  }

  /* ---------- seed admin ---------- */
  async function seedAdmin() {
    const users = getUsers();
    if (users.some(u => u.role === "admin")) return;
    const salt = newSalt();
    users.push({
      id: "admin-1",
      name: ADMIN.name,
      email: ADMIN.email,
      phone: ADMIN.phone,
      role: "admin",
      stallName: "",
      salt,
      passwordHash: await hash(ADMIN.password, salt),
      createdAt: new Date().toISOString()
    });
    write(USERS_KEY, users);
  }

  const ready = seedAdmin();

  /* ---------- sessions ---------- */
  function publicUser(user) {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  function getCurrentUser() {
    const session = read(SESSION_KEY, null);
    if (!session) return null;
    const user = getUsers().find(u => u.id === session.userId);
    return user ? publicUser(user) : null;
  }

  function emitChange() {
    window.dispatchEvent(
      new CustomEvent("foodfever:auth", { detail: { user: getCurrentUser() } })
    );
  }

  function startSession(user) {
    write(SESSION_KEY, { userId: user.id, loginAt: Date.now() });
    emitChange();
  }

  /* ---------- actions ---------- */
  async function signUp({ name, email, phone, password, role, stallName }) {
    await ready;
    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    stallName = (stallName || "").trim();

    if (name.length < 2) return fail("Enter your full name.");
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");

    const cleanPhone = normalizePhone(phone || "");
    if (!cleanPhone) return fail("Enter a valid Kenyan phone number, like 0712345678.");

    const passwordError = checkPassword(password);
    if (passwordError) return fail(passwordError);

    if (role !== "student" && role !== "vendor") return fail("Choose Student or Vendor.");
    if (role === "vendor" && stallName.length < 2) return fail("Enter your stall or cafeteria name.");

    const users = getUsers();
    if (users.some(u => u.email === email)) {
      return fail("An account with this email already exists. Log in instead.");
    }

    const salt = newSalt();
    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name,
      email,
      phone: cleanPhone,
      role,
      stallName: role === "vendor" ? stallName : "",
      salt,
      passwordHash: await hash(password, salt),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    write(USERS_KEY, users);
    startSession(user);
    return { ok: true, user: publicUser(user) };
  }

  async function logIn({ email, password }) {
    await ready;
    email = (email || "").trim().toLowerCase();
    const user = getUsers().find(u => u.email === email);

    // Same message for unknown email and wrong password
    if (!user || (await hash(password || "", user.salt)) !== user.passwordHash) {
      return fail("Incorrect email or password.");
    }

    startSession(user);
    return { ok: true, user: publicUser(user) };
  }

  function logOut() {
    localStorage.removeItem(SESSION_KEY);
    emitChange();
  }

  function updateProfile({ name, phone, stallName }) {
    const current = getCurrentUser();
    if (!current) return fail("You need to log in first.");

    name = (name || "").trim();
    if (name.length < 2) return fail("Enter your full name.");

    const cleanPhone = normalizePhone(phone || "");
    if (!cleanPhone) return fail("Enter a valid Kenyan phone number, like 0712345678.");

    stallName = (stallName || "").trim();
    if (current.role === "vendor" && stallName.length < 2) {
      return fail("Enter your stall or cafeteria name.");
    }

    const users = getUsers();
    const user = users.find(u => u.id === current.id);
    user.name = name;
    user.phone = cleanPhone;
    if (current.role === "vendor") user.stallName = stallName;
    write(USERS_KEY, users);
    emitChange();
    return { ok: true, user: publicUser(user) };
  }

  async function changePassword({ currentPassword, newPassword }) {
    const current = getCurrentUser();
    if (!current) return fail("You need to log in first.");

    const users = getUsers();
    const user = users.find(u => u.id === current.id);

    if ((await hash(currentPassword || "", user.salt)) !== user.passwordHash) {
      return fail("Your current password is incorrect.");
    }

    const passwordError = checkPassword(newPassword);
    if (passwordError) return fail(passwordError);

    user.salt = newSalt();
    user.passwordHash = await hash(newPassword, user.salt);
    write(USERS_KEY, users);
    return { ok: true };
  }

  /* ---------- access control ---------- */
  const isLoggedIn = () => getCurrentUser() !== null;

  function hasRole(...roles) {
    const user = getCurrentUser();
    return !!user && roles.includes(user.role);
  }

  // Call at the top of a protected page, e.g. FoodFeverAuth.requireRole("vendor")
  // Not logged in -> login page. Wrong role -> home page. Returns the user if allowed.
  function requireRole(...roles) {
    const user = getCurrentUser();
    if (!user) {
      const page = location.pathname.split("/").pop() || "index.html";
      location.replace(`login.html?next=${encodeURIComponent(page)}`);
      return null;
    }
    if (roles.length && !roles.includes(user.role)) {
      location.replace(ROLE_HOME[user.role] || "index.html");
      return null;
    }
    return user;
  }

  const homeFor = user => (user ? ROLE_HOME[user.role] : "login.html") || "index.html";

  /* ---------- header nav (fills <div id="auth-nav">) ---------- */
  function renderNav() {
    const nav = document.getElementById("auth-nav");
    if (!nav) return;
    nav.textContent = "";

    const user = getCurrentUser();

    if (!user) {
      const login = document.createElement("a");
      login.href = "login.html";
      login.textContent = "Log in";
      nav.appendChild(login);
      return;
    }

    const profile = document.createElement("a");
    profile.href = "profile.html";
    profile.textContent = `${user.name.split(" ")[0]} (${user.role})`;

    const logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Log out";
    logout.addEventListener("click", () => {
      logOut();
      location.href = "login.html";
    });

    nav.append(profile, logout);
  }

  window.addEventListener("foodfever:auth", renderNav);
  document.addEventListener("DOMContentLoaded", renderNav);

  return {
    signUp,
    logIn,
    logOut,
    getCurrentUser,
    isLoggedIn,
    hasRole,
    requireRole,
    updateProfile,
    changePassword,
    homeFor,
    renderNav
  };
})();