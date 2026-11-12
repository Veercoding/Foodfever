/* FoodFever - "Browse the menu" reveal animation */
/* Instead of a plain scroll, the page wipes to red, food tosses around, then the
   menu is uncovered and its search, filters, cards and cart pop in one by one. */

(() => {
  const COVER_MS = 450;     // the red circle grows from the button
  const HOLD_MS = 750;      // food tossing on the red screen
  const REVEAL_MS = 600;    // the circle closes and uncovers the menu
  const CLEANUP_MS = 1800;  // remove the reveal classes afterwards
  const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

  let busy = false;

  const reducedMotion = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const circle = (radius, x, y) => `circle(${radius}px at ${x}px ${y}px)`;

  // Radius needed for a circle at (x, y) to cover the whole window.
  function coverRadius(x, y) {
    return Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    ) + 20;
  }

  function buildOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "ff-menu-wipe";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="ffm-center">
        <div class="ffm-foods">
          <span style="--d:0">🍔</span>
          <span style="--d:1">🍟</span>
          <span style="--d:2">🍛</span>
          <span style="--d:3">🥟</span>
          <span style="--d:4">🥤</span>
        </div>
        <p class="ffm-title">Today's menu</p>
        <p class="ffm-sub">Fresh from every campus kitchen</p>
      </div>`;
    return overlay;
  }

  // Page position that puts the menu heading just under the nav bar.
  function menuScrollTop(title) {
    const nav = document.querySelector(".ff-nav");
    const navHeight = nav ? nav.offsetHeight : 0;
    return Math.max(title.getBoundingClientRect().top + window.scrollY - navHeight - 24, 0);
  }

  async function browseMenu(link) {
    const menu = document.getElementById("menu");
    if (!menu) return;

    const section = menu.closest("section");
    const title = (section && section.querySelector("h2")) || menu;
    const main = menu.closest("main") || document.body;

    // Reduced motion: just jump to the menu, no animation.
    if (reducedMotion()) {
      window.scrollTo({ top: menuScrollTop(title), behavior: "instant" });
      return;
    }

    if (busy) return;
    busy = true;

    const overlay = buildOverlay();

    try {
      // 1. A red circle grows from the button until it covers the screen.
      const box = link.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const radius = coverRadius(x, y);

      overlay.style.clipPath = circle(0, x, y);
      document.body.appendChild(overlay);

      await overlay.animate(
        [{ clipPath: circle(0, x, y) }, { clipPath: circle(radius, x, y) }],
        { duration: COVER_MS, easing: EASE, fill: "forwards" }
      ).finished;

      // 2. While covered, jump to the menu and let the food toss around.
      window.scrollTo({ top: menuScrollTop(title), behavior: "instant" });
      overlay.classList.add("is-on");
      await wait(HOLD_MS);

      // 3. Get the menu ready to pop in, then close the circle onto the heading.
      Array.from(menu.children).forEach((card, index) => {
        card.style.setProperty("--ffm-i", String(Math.min(index, 11)));
      });
      main.classList.add("ffm-reveal");

      const heading = title.getBoundingClientRect();
      const hx = Math.min(heading.left + 140, window.innerWidth - 20);
      const hy = Math.max(Math.min(heading.top + heading.height / 2, window.innerHeight - 20), 20);
      const startRadius = coverRadius(hx, hy);

      await overlay.animate(
        [{ clipPath: circle(startRadius, hx, hy) }, { clipPath: circle(0, hx, hy) }],
        { duration: REVEAL_MS, easing: EASE, fill: "forwards" }
      ).finished;
    } catch (error) {
      console.warn("Menu animation skipped:", error);
      window.scrollTo({ top: menuScrollTop(title), behavior: "instant" });
    } finally {
      overlay.remove();
      busy = false;
      setTimeout(() => main.classList.remove("ffm-reveal"), CLEANUP_MS);
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest && event.target.closest('a[href="#menu"]');
    if (!link || !document.getElementById("menu")) return;

    event.preventDefault();
    browseMenu(link);
  });
})();