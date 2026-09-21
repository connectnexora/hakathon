/* ============================================================
   Portfolio — script.js (Vanilla JavaScript, beginner-friendly)
   Features:
   1. Project data (easy to edit) + dynamic project cards
   2. Mobile navigation menu
   3. Dark / light mode with localStorage
   4. Smooth scrolling + active nav link on scroll
   5. Scroll reveal animations + layout-safe slide-in animations
   6. Contact form validation
   7. Back-to-top button + footer year
   ============================================================ */

// ---------- EDIT YOUR PROJECTS HERE ----------
// To add a project: copy one block, change the values, save, refresh.
// - icon: any emoji shown on the card banner
// - bannerClass: project-banner-1 to project-banner-4 (changes color)
// - liveUrl / githubUrl: use "#" if you don't have a link yet.
const PROJECTS = [
  {
    title: "Student Management System",
    description:
      "A simple app to add, search and manage student records with local storage in the browser.",
    technologies: ["HTML", "CSS", "JavaScript"],
    icon: "🎓",
    bannerClass: "project-banner-1",
    liveUrl: "#",
    githubUrl: "https://github.com/your-username/student-management-system",
  },
  {
    title: "Personal Portfolio",
    description:
      "This responsive portfolio website with dark mode, animations and a validated contact form.",
    technologies: ["HTML", "CSS", "JavaScript"],
    icon: "💼",
    bannerClass: "project-banner-2",
    liveUrl: "#home",
    githubUrl: "https://github.com/your-username/portfolio",
  },
  {
    title: "Weather App",
    description:
      "Search any city and see current weather using a public API, with clean cards and icons.",
    technologies: ["HTML", "CSS", "JavaScript", "API"],
    icon: "🌦️",
    bannerClass: "project-banner-3",
    liveUrl: "#",
    githubUrl: "https://github.com/your-username/weather-app",
  },
];

// ---------- Reusable helper: run code after the page loads ----------
function onReady(callback) {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}

onReady(init);

function init() {
  renderProjects();
  initMobileMenu();
  initTheme();
  initActiveNav();
  initSlideAnimations();
  initScrollReveal();
  initContactForm();
  initBackToTop();
  initCursor3D();
  initDeadLinkGuard();
  setCurrentYear();
}

/* ================= 1. Dynamic project cards ================= */

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear any existing content

  PROJECTS.forEach((project) => {
    const card = createProjectCard(project);
    grid.appendChild(card);
  });
}

// Build one project card element from a project object.
// Note: no "visible" / "slide-show" here — initSlideAnimations() assigns
// the slide direction + stagger delay and reveals the card on scroll.
// Defaults keep one mistyped entry from breaking the whole grid.
function createProjectCard(project) {
  const {
    title = "Untitled Project",
    description = "",
    technologies = [],
    icon = "💻",
    bannerClass = "project-banner-1",
    liveUrl = "#",
    githubUrl = "#",
  } = project || {};
  const card = document.createElement("article");
  card.className = "project-card reveal";

  const techItems = technologies
    .map((tech) => `<li>${escapeHtml(tech)}</li>`)
    .join("");

  card.innerHTML = `
    <div class="project-banner ${escapeHtml(bannerClass)}" aria-hidden="true">
      <span>${escapeHtml(icon)}</span>
    </div>
    <div class="project-body">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
      <ul class="tech-list">${techItems}</ul>
      <div class="project-links">
        <a class="btn btn-primary btn-small" href="${escapeHtml(liveUrl)}"${liveUrl === "#" ? ' aria-disabled="true"' : ""} ${
    liveUrl.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
  }>Live Demo</a>
        <a class="btn btn-outline btn-small" href="${escapeHtml(githubUrl)}"${githubUrl === "#" ? ' aria-disabled="true"' : ""} ${
    githubUrl.startsWith("http") ? 'target="_blank" rel="noopener"' : ""
  }>GitHub</a>
      </div>
    </div>
  `;

  return card;
}

// Prevent broken HTML if project text contains < > & characters.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ================= 2. Mobile navigation ================= */

function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  if (!hamburger || !navLinks) return;

  function closeMenu() {
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
  }

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  // Close the menu when a link is clicked (mobile UX)
  // + smooth-scroll with sticky-navbar offset handled by CSS scroll-padding.
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close menu with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

/* ================= 3. Dark / light mode ================= */

const THEME_KEY = "portfolio-theme";

function initTheme() {
  const toggleButton = document.getElementById("theme-toggle");
  if (!toggleButton) return;

  applySavedTheme();

  toggleButton.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    setTheme(nextTheme);
  });
}

function applySavedTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (error) {
    // localStorage can fail with file:// in some browsers — fall back silently.
    savedTheme = null;
  }

  if (savedTheme === "dark" || savedTheme === "light") {
    setTheme(savedTheme, false);
  } else {
    // No saved choice: respect the operating system preference.
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light", false);
  }
}

function setTheme(theme, save = true) {
  document.documentElement.setAttribute("data-theme", theme);

  if (save) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Ignore storage errors (private mode / file:// restrictions).
    }
  }

  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    toggleButton.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  // Keep the browser address-bar color in sync (mobile).
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#0f1222" : "#4f46e5");
  }
}

/* ================= 4. Active nav link on scroll ================= */

function initActiveNav() {
  const links = document.querySelectorAll(".nav-link");
  if (!links.length) return;
  if (!("IntersectionObserver" in window)) return;

  const linkById = {};
  links.forEach((link) => {
    const id = link.getAttribute("href").replace("#", "");
    linkById[id] = link;
  });

  // Only watch sections that actually have a nav link (e.g. Achievements
  // has none — watching it would clear every active state while passing).
  const sections = Array.from(document.querySelectorAll("main section[id]")).filter(
    (section) => linkById[section.id]
  );
  if (!sections.length) return;

  function setActive(id) {
    links.forEach((link) => link.classList.remove("active"));
    const activeLink = linkById[id];
    if (activeLink) activeLink.classList.add("active");
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ================= 5. Scroll reveal animations ================= */

function initScrollReveal() {
  // Slide system (initSlideAnimations) already handles .reveal elements it
  // marked with .slide-hidden-left / .slide-hidden-right, so only observe
  // the rest here. This keeps a single animation owner per element.
  const elements = document.querySelectorAll(
    ".reveal:not(.slide-hidden-left):not(.slide-hidden-right)"
  );
  if (!elements.length) return;

  // If the browser is old, just show everything.
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Animate skill bars when the skills section appears.
          if (entry.target.querySelector(".progress-bar")) {
            animateProgressBar(entry.target);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => observer.observe(el));
}

// Skill bars start at width 0 in CSS; animate to their inline width.
function animateProgressBar(card) {
  const bar = card.querySelector(".progress-bar");
  if (!bar) return;
  const targetWidth = bar.style.width;
  bar.style.width = "0";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.width = targetWidth;
    });
  });
}

/* ============ 5b. Layout-safe slide-in animations ============
   - Uses IntersectionObserver (one observer, unobserves after show).
   - Only animates the target itself via opacity + translateX (see
     .slide-hidden-left / .slide-hidden-right / .slide-show in style.css).
   - Never touches layout props; visibility preserves document flow, so
     surrounding elements never move and no horizontal scrollbar appears.
   - Stagger (0/100/200/300ms) applies to card grids only. */

function initSlideAnimations() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  // Show everything immediately when animation is unavailable / unwanted.
  function showAllImmediately() {
    targets.forEach((el) => {
      el.classList.add("slide-show", "visible");
      if (el.querySelector(".progress-bar")) animateProgressBar(el);
    });
  }

  if (!("IntersectionObserver" in window)) {
    showAllImmediately();
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showAllImmediately();
    return;
  }

  // Stagger: cards inside Skills / Projects / Achievements grids get
  // delays of 0ms, 100ms, 200ms, 300ms, then repeat. Direction alternates
  // left / right for a subtle professional effect.
  const staggered = new Set();
  const grids = document.querySelectorAll(
    ".skills-grid, .projects-grid, .achievements-grid"
  );
  grids.forEach((grid) => {
    const cards = Array.from(grid.children);
    cards.forEach((card, index) => {
      card.classList.add(index % 2 === 0 ? "slide-hidden-left" : "slide-hidden-right");
      card.style.setProperty("--slide-delay", String((index % 4) * 100) + "ms");
      staggered.add(card);
    });
  });

  // All other reveal elements: alternate left / right, no delay.
  let order = 0;
  targets.forEach((el) => {
    if (staggered.has(el)) return;
    el.classList.add(order % 2 === 0 ? "slide-hidden-left" : "slide-hidden-right");
    order += 1;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("slide-show", "visible");
        if (el.querySelector(".progress-bar")) animateProgressBar(el);
        // Clear the stagger delay after the entrance finishes so later
        // hover / focus transitions have no leftover delay.
        window.setTimeout(() => {
          el.style.setProperty("--slide-delay", "0ms");
        }, 1000);
        observer.unobserve(el); // run once, stay lightweight
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ================= 6. Contact form validation ================= */

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Never reload the page
    clearErrors();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    let isValid = true;

    if (name.length < 2) {
      showError(nameInput, "name-error", "Please enter your name (min 2 characters).");
      isValid = false;
    }

    if (!isValidEmail(email)) {
      showError(emailInput, "email-error", "Please enter a valid email address.");
      isValid = false;
    }

    if (message.length < 10) {
      showError(messageInput, "message-error", "Please write a message (min 10 characters).");
      isValid = false;
    }

    if (!isValid) {
      setStatus("Please fix the errors above and try again.", "error");
      return;
    }

    // Demo behaviour: no backend, so confirm + reset.
    // To receive real messages, connect Formspree / Netlify Forms here.
    setStatus("Thanks, " + name.split(" ")[0] + "! Your message has been noted. I'll reply soon.", "success");
    form.reset();
  });

  // Clear error styling while the user types.
  [nameInput, emailInput, messageInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("invalid");
      const errorEl = document.getElementById(input.id + "-error");
      if (errorEl) errorEl.textContent = "";
    });
  });

  function showError(input, errorId, message) {
    input.classList.add("invalid");
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = message;
  }

  function clearErrors() {
    ["name-error", "email-error", "message-error"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    [nameInput, emailInput, messageInput].forEach((input) =>
      input.classList.remove("invalid")
    );
  }

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = "form-status " + type;
  }
}

// Simple, beginner-friendly email check.
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/* ================= 7. Back-to-top button ================= */

function initBackToTop() {
  const button = document.getElementById("back-to-top");
  if (!button) return;

  function toggleVisibility() {
    const show = window.scrollY > 500;
    button.classList.toggle("show", show);
  }

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility(); // Set correct state on page load

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ================= 8. Footer year ================= */

function setCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

/* ============ 10. Dead placeholder-link guard ============
   Placeholder href="#" links (e.g. demo links without a URL yet)
   would teleport the user to the top of the page. Neutralize the
   jump until the owner adds real URLs. */

function initDeadLinkGuard() {
  document.addEventListener("click", (event) => {
    const deadLink = event.target.closest('a[href="#"]');
    if (deadLink) event.preventDefault();
  });
}

/* ============ 9. Premium 3D interactive cursor ============
   A tiny Three.js micro-scene (glass pointer + neon edges + glow +
   orbit ring + orbiting particles + fading trail + click ripples)
   rendered on a small transparent canvas that follows the pointer.

   Design rules (from the project brief + past feedback):
   - Zero-gap tracking: the 3D object sits exactly on the pointer.
     Only the fading trail ghosts lag behind — the object never does.
   - No positional magnet: hover "magnetism" is expressed as lean,
     glow and scale so the object never drifts off the cursor.
   - Purely visual: stage is pointer-events:none, movement is
     transform-only, one small RAF loop, cleaned up on pagehide.
   - Reuses the already-loaded Three.js CDN build (deferred scripts
     run before DOMContentLoaded, so window.THREE exists here).
     If WebGL/THREE is missing, we return early and the NATIVE
     cursor stays visible (body.has-cursor is never added).
   - Skipped on touch devices and prefers-reduced-motion. */

function initCursor3D() {
  if (window.matchMedia("(hover: none)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof window.THREE === "undefined") return;

  const stage = document.getElementById("cursor3d");
  if (!stage) return;

  const THREE = window.THREE;
  const SIZE = 160; // stage px — small on purpose (cheap to render)
  const HALF = SIZE / 2;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (error) {
    return; // no WebGL → keep the native cursor
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(SIZE, SIZE);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  // px → world units at the cursor plane (for trail offsets).
  const PX2U =
    (2 * 6 * Math.tan(THREE.MathUtils.degToRad(35 / 2))) / SIZE;

  // --- Lights (cool studio look, blue/purple) ---
  scene.add(new THREE.AmbientLight(0x8899ff, 0.7));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const rimCyan = new THREE.PointLight(0x22d3ee, 1.1, 12);
  rimCyan.position.set(-3, -1, 3);
  scene.add(rimCyan);
  const rimPurple = new THREE.PointLight(0x8b5cf6, 1.0, 12);
  rimPurple.position.set(3, 2, 2);
  scene.add(rimPurple);

  // --- Glass pointer (4-sided pyramid, apex leaning upper-left) ---
  const pointer = new THREE.Group();
  scene.add(pointer);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x6d7cff,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.94,
    flatShading: true,
  });
  const headGeo = new THREE.ConeGeometry(0.34, 1.0, 4);
  const head = new THREE.Mesh(headGeo, glassMat);
  head.rotation.y = Math.PI / 4;
  pointer.add(head);

  // Neon edge glow (cyan outline over the glass).
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.95,
  });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(headGeo), edgeMat);
  edges.rotation.y = Math.PI / 4;
  pointer.add(edges);

  pointer.rotation.z = 0.6; // rest lean, apex toward upper-left

  // --- Soft outer glow ---
  const glowTex = makeCursorGlowTexture(THREE);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x818cf8,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(2.6, 2.6, 1);
  pointer.add(glow);

  // --- Orbit ring ---
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.55,
  });
  const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 12, 80), ringMat);
  orbitRing.rotation.x = Math.PI / 2.6;
  pointer.add(orbitRing);

  // --- Orbiting particles (blue/purple, staggered) ---
  const orbGeo = new THREE.SphereGeometry(0.05, 10, 10);
  const orbColors = [0x22d3ee, 0xa78bfa, 0x67e8f9, 0x8b5cf6, 0x818cf8];
  const orbs = orbColors.map((color, i) => {
    const orb = new THREE.Mesh(
      orbGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    orb.userData = {
      angle: (i / orbColors.length) * Math.PI * 2,
      radius: 1.05 + (i % 2) * 0.15,
      speed: 1.6 + i * 0.25,
    };
    pointer.add(orb);
    return orb;
  });

  // --- Fading trail ghosts (follow chain, screen-space history) ---
  const TRAIL_COUNT = 6;
  const ghosts = [];
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const ghost = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x818cf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const ghostScale = 1.1 - i * 0.13;
    ghost.scale.set(ghostScale, ghostScale, 1);
    ghost.userData.baseOpacity = 0.32 - i * 0.05;
    scene.add(ghost);
    ghosts.push(ghost);
  }
  const history = []; // recent pointer positions in px, newest first

  // --- Click ripple pool (expanding rings, ~420ms each) ---
  const RIPPLE_TIME = 0.42;
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const ripple = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.03, 10, 60),
      new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ripple.userData = { t: 1, max: 0.8 }; // t >= 1 means idle
    scene.add(ripple);
    ripples.push(ripple);
  }
  function fireRipple(strength) {
    const ripple = ripples.find((r) => r.userData.t >= 1) || ripples[0];
    ripple.userData.t = 0;
    ripple.userData.max = 0.8 * strength;
  }

  // --- Interaction state (normal / link / button / card / down / drag) ---
  // Targets below are lerped every frame for buttery transitions.
  const STATE_STYLE = {
    normal: { scale: 1.0, glow: 0.5, emissive: 0.45, orbit: 1.0, depth: 0 },
    link: { scale: 1.25, glow: 0.65, emissive: 0.6, orbit: 1.8, depth: 0.1 },
    button: { scale: 1.5, glow: 0.85, emissive: 0.9, orbit: 2.4, depth: 0.25 },
    card: { scale: 1.35, glow: 0.75, emissive: 0.7, orbit: 2.0, depth: 0.45 },
  };
  let state = "normal";
  let down = false;
  let dragging = false;
  let downX = 0;
  let downY = 0;
  const current = { scale: 1, glow: 0.5, emissive: 0.45, orbit: 1, depth: 0 };

  function pickState(target) {
    if (target.closest("button, .btn, input, select, textarea")) return "button";
    if (target.closest("a")) return "link";
    if (target.closest(".project-card")) return "card";
    return "normal";
  }

  document.addEventListener("mouseover", (event) => {
    state = pickState(event.target);
    if (state === "button") fireRipple(0.45); // soft pulse on entering buttons
  });

  window.addEventListener("mousedown", (event) => {
    down = true;
    dragging = false;
    downX = event.clientX;
    downY = event.clientY;
    fireRipple(1); // full click ripple (~420ms)
  });
  window.addEventListener("mouseup", () => {
    down = false;
    dragging = false;
  });

  // --- Pointer tracking (zero-gap: object sits exactly on the cursor) ---
  let x = -999;
  let y = -999;
  let followX = -999;
  let followY = -999;
  let velX = 0;
  let velY = 0;
  let shown = false;

  window.addEventListener(
    "mousemove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      if (down && Math.hypot(x - downX, y - downY) > 6) dragging = true;
      if (!shown) {
        shown = true;
        followX = x;
        followY = y;
        document.body.classList.add("has-cursor");
        stage.classList.add("on");
      }
    },
    { passive: true }
  );

  document.documentElement.addEventListener("mouseleave", () => {
    stage.classList.remove("on");
  });
  document.documentElement.addEventListener("mouseenter", () => {
    if (shown) stage.classList.add("on");
  });

  // --- Animation loop (one small RAF, transform-only DOM writes) ---
  const clock = new THREE.Clock();
  let rafId = 0;
  let renderCount = 0;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (document.hidden || !shown) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Fast follow (≈2-frame delay): glued feel, never laggy.
    followX = lerp(followX, x, 0.4);
    followY = lerp(followY, y, 0.4);
    stage.style.transform =
      "translate3d(" + (followX - HALF) + "px," + (followY - HALF) + "px,0)";

    // Smoothed pointer velocity drives lean + stretch.
    const rawVX = x - followX;
    const rawVY = y - followY;
    velX += (rawVX - velX) * 0.35;
    velY += (rawVY - velY) * 0.35;
    const speed = Math.sqrt(velX * velX + velY * velY);

    // Ease all state values toward their targets.
    const target = STATE_STYLE[state] || STATE_STYLE.normal;
    const ease = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
    current.scale = lerp(current.scale, target.scale, ease);
    current.glow = lerp(current.glow, target.glow, ease);
    current.emissive = lerp(current.emissive, target.emissive, ease);
    current.orbit = lerp(current.orbit, target.orbit, ease);
    current.depth = lerp(current.depth, target.depth, ease);

    // Pose: scale pop, lean into motion, gentle float, depth shift.
    pointer.scale.setScalar(current.scale * (down ? 0.92 : 1));
    pointer.rotation.x = lerp(pointer.rotation.x, Math.max(-0.25, Math.min(0.25, velY * 0.004)), 0.2);
    pointer.rotation.y = Math.sin(t * 1.5) * 0.12 + Math.max(-0.3, Math.min(0.3, velX * 0.003));
    pointer.position.y = Math.sin(t * 2.2) * 0.05;
    pointer.position.z = lerp(pointer.position.z, current.depth, ease);
    glassMat.emissiveIntensity = current.emissive + (down ? 0.35 : 0);
    glowMat.opacity = current.glow + (down ? 0.2 : 0);

    // Orbit ring + particles (faster + brighter on interactive states).
    orbitRing.rotation.z += dt * 0.8 * current.orbit;
    ringMat.opacity = 0.4 + current.orbit * 0.12;
    for (const orb of orbs) {
      orb.userData.angle += dt * orb.userData.speed * current.orbit;
      orb.position.x = Math.cos(orb.userData.angle) * orb.userData.radius;
      orb.position.y = Math.sin(orb.userData.angle) * orb.userData.radius;
      orb.position.z = Math.sin(t * 0.8 + orb.userData.angle) * 0.4;
    }

    // Trail: record history, ghosts sample older positions (screen → world).
    history.unshift({ x: followX, y: followY });
    if (history.length > 24) history.pop();
    const motion = Math.min(speed / 10, 1); // 0 when still → trail hides
    const trailBoost = dragging ? 1.8 : 1;
    ghosts.forEach((ghost, i) => {
      const sample = history[Math.min((i + 1) * 3, history.length - 1)] || { x: followX, y: followY };
      ghost.position.set((sample.x - followX) * PX2U, -(sample.y - followY) * PX2U, -0.5 - i * 0.1);
      ghost.material.opacity = ghost.userData.baseOpacity * motion * trailBoost;
    });

    // Ripples: expand + fade over RIPPLE_TIME seconds.
    for (const ripple of ripples) {
      if (ripple.userData.t >= 1) {
        ripple.material.opacity = 0;
        continue;
      }
      ripple.userData.t = Math.min(ripple.userData.t + dt / RIPPLE_TIME, 1);
      const k = ripple.userData.t;
      const s = 0.4 + k * 1.4;
      ripple.scale.set(s, s, 1);
      ripple.material.opacity = ripple.userData.max * (1 - k);
    }

    renderer.render(scene, camera);
    renderCount += 1;
  }
  animate();

  // Test hook (read-only): lets automated checks observe cursor state.
  window.__cursorState = () => ({
    state,
    down,
    dragging,
    shown,
    activeRipples: ripples.filter((r) => r.userData.t < 1).length,
    renders: renderCount,
  });

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(rafId);
    scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.map && m.map !== glowTex) m.map.dispose();
          m.dispose();
        });
      }
    });
    glowTex.dispose();
    renderer.dispose();
  });

  // Soft radial sprite texture, generated in code — no image files needed.
  function makeCursorGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }
}
