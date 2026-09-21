/* ============================================================
   three-scene.js — premium 3D enhancement layer
   (Three.js + Vanilla JavaScript, beginner-friendly)

   What it does:
   1. Fullscreen 3D hero background (floating crystal + rings,
      glowing particles, fog, atmospheric lighting) on a fixed
      canvas BEHIND the UI.
   2. Smooth mouse + touch parallax with lerping + gentle return to rest.
   3. Subtle scroll-linked camera drift across the whole page — the scene
      stays live from the hero down to the footer (normal scrolling untouched).
   4. Depth-based section transitions (opacity + transform only).
   5. Subtle 3D tilt + glow on project cards (still fully clickable).

   UI SAFETY:
   - The canvas lives in #bg3d: position fixed, z-index 0,
     pointer-events NONE. The website UI stays above it and
     always remains readable + clickable.
   - Only transform / opacity are animated. No layout properties.
   - If Three.js fails to load (offline) or WebGL is unavailable,
     everything below silently skips — the UI works exactly as before.
   - Respects prefers-reduced-motion (no heavy animation, simple fades).
   ============================================================ */
(function () {
  "use strict";

  // Global 3D vividness: +20% color saturation on every scene material.
  const SATURATION_BOOST = 0.2;

  // Run code after the page is parsed.
  function onReady(callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  onReady(init);

  function init() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // CSS-only enhancements always run (they Degrade to simple fades
    // when reduced motion is on).
    initDepthTransitions(reduceMotion);
    initCardTilt(reduceMotion);

    // No heavy 3D motion for users who asked for reduced motion.
    if (reduceMotion) return;

    // Three.js comes from a CDN script tag. If it failed (offline),
    // stop here — the portfolio UI is unaffected.
    if (typeof window.THREE === "undefined") return;

    try {
      initBackground();
    } catch (error) {
      // Never break the UI because of a 3D error. Intentionally silent.
    }
  }

  /* ================= 1. Fullscreen 3D background ================= */

  function initBackground() {
    const THREE = window.THREE;
    const container = document.getElementById("bg3d");
    if (!container) return;

    const isMobile = window.matchMedia("(max-width: 680px)").matches;

    // --- Renderer (transparent so the page background shows through) ---
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0); // fully transparent
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // --- Scene, fog (depth atmosphere) and camera ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f1222, 11, 30);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );
    const CAM_BASE = { x: 0, y: 0.2, z: 9 };
    camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);

    // --- Lights (soft studio look) ---
    const ambient = new THREE.AmbientLight(0x8899ff, 0.55);
    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(4, 6, 6);
    const glowCyan = new THREE.PointLight(0x22d3ee, 0.8, 20);
    glowCyan.position.set(-5, -1, 3);
    const glowPink = new THREE.PointLight(0xec4899, 0.5, 20);
    glowPink.position.set(5, 2, 2);
    glowCyan.color.offsetHSL(0, SATURATION_BOOST, 0); // +20% saturation
    glowPink.color.offsetHSL(0, SATURATION_BOOST, 0); // +20% saturation
    scene.add(ambient, directional, glowCyan, glowPink);

    // Shared soft-circle texture for particles and glows.
    const softTexture = makeGlowTexture(THREE);

    // --- Central hero object: crystal + rings + glow + orbiters ---
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x93a0ff,
      metalness: 0.95,
      roughness: 0.22,
      flatShading: true,
    });
    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 0), crystalMat);
    heroGroup.add(crystal);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.32, 1), wireMat);
    heroGroup.add(wire);

    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      metalness: 0.9,
      roughness: 0.3,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.045, 16, 120), ringMat1);
    ring1.rotation.x = Math.PI / 2.4;
    ring1.rotation.y = 0.35;
    heroGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      metalness: 0.9,
      roughness: 0.35,
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.03, 16, 120), ringMat2);
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.y = -0.4;
    heroGroup.add(ring2);

    const glowMat = new THREE.SpriteMaterial({
      map: softTexture,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(4.5, 4.5, 1);
    heroGroup.add(glow);

    // Tiny orbiting gems (code-inspired satellites).
    const orbiterMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      metalness: 0.85,
      roughness: 0.3,
      flatShading: true,
    });
    const orbiters = [];
    for (let i = 0; i < 3; i++) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), orbiterMat);
      gem.userData.angle = (i / 3) * Math.PI * 2;
      gem.userData.radius = 2.5 + i * 0.25;
      gem.userData.speed = 0.25 + i * 0.06;
      heroGroup.add(gem);
      orbiters.push(gem);
    }

    placeHeroGroup(heroGroup, isMobile);

    // --- BACKGROUND layer: far stars (dense field) ---
    const stars = makeParticles(THREE, softTexture, {
      count: isMobile ? 180 : 500,
      spreadX: 14,
      spreadY: 8,
      zMin: -12,
      zMax: -2,
      size: 0.07,
      color: 0xffffff,
      opacity: 0.85,
      additive: true,
    });
    scene.add(stars);

    // --- BACKGROUND layer: near glowing dust (dense atmosphere) ---
    const dust = makeParticles(THREE, softTexture, {
      count: isMobile ? 50 : 140,
      spreadX: 10,
      spreadY: 6,
      zMin: -6,
      zMax: 2,
      size: 0.16,
      color: 0x67e8f9,
      opacity: 0.7,
      additive: true,
    });
    scene.add(dust);

    // --- MIDDLE layer: floating wireframe shapes ---
    const floaterMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const floaterGeos = [
      new THREE.TetrahedronGeometry(0.32),
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.OctahedronGeometry(0.34),
    ];
    const floaters = [];
    const floaterCount = isMobile ? 5 : 9;
    for (let i = 0; i < floaterCount; i++) {
      const mesh = new THREE.Mesh(floaterGeos[i % floaterGeos.length], floaterMat);
      mesh.position.set(
        (Math.random() * 2 - 1) * 7,
        (Math.random() * 2 - 1) * 4,
        -1 - Math.random() * 6
      );
      mesh.userData = {
        baseY: mesh.position.y,
        rotX: (Math.random() - 0.5) * 0.008,
        rotY: (Math.random() - 0.5) * 0.01,
        bobAmp: 0.25 + Math.random() * 0.35,
        bobSpeed: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      };
      scene.add(mesh);
      floaters.push(mesh);
    }

    // Keep a list of theme-aware materials (light/dark mode tuning).
    const mood = { stars, dust, floaterMat, crystalMat, wireMat, ringMat1, ringMat2, glowMat, orbiterMat, ambient, directional };
    applyThemeMood(document.documentElement.getAttribute("data-theme"), mood, scene);

    // Re-tune colors when the user toggles dark / light mode.
    const themeWatcher = new MutationObserver(() => {
      applyThemeMood(document.documentElement.getAttribute("data-theme"), mood, scene);
    });
    themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // --- Mouse + touch parallax (smooth, premium, never aggressive) ---
    // Sensitivity is boosted 30% over the base feel. Touch devices use
    // touchmove so the model stays responsive to fingers too.
    let mouseX = 0;
    let mouseY = 0;
    let lastMouseMove = 0;
    let camX = CAM_BASE.x;
    let camY = CAM_BASE.y;

    function pointToTargets(clientX, clientY) {
      mouseX = (clientX / window.innerWidth) * 2 - 1; // -1 left … 1 right
      mouseY = (clientY / window.innerHeight) * 2 - 1; // -1 top … 1 bottom
      lastMouseMove = performance.now();
    }

    window.addEventListener(
      "mousemove",
      (event) => pointToTargets(event.clientX, event.clientY),
      { passive: true }
    );
    window.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        pointToTargets(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    // --- Scroll progress (read passively, applied in the RAF loop) ---
    let scrollT = 0;
    let scrollDirty = true;
    function readScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollT = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      scrollDirty = false;
    }
    window.addEventListener("scroll", () => { scrollDirty = true; }, { passive: true });
    readScroll();

    // --- Resize handling ---
    let resizeQueued = false;
    window.addEventListener("resize", () => { resizeQueued = true; });
    function applyResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      const nowMobile = window.matchMedia("(max-width: 680px)").matches;
      placeHeroGroup(heroGroup, nowMobile);
      resizeQueued = false;
    }

    // --- Animation loop ---
    let rafId = 0;
    const clock = new THREE.Clock();

    function lerp(current, target, amount) {
      return current + (target - current) * amount;
    }

    function animate() {
      rafId = requestAnimationFrame(animate);

      // The scene stays live for the whole page (hero → footer) so the
      // model keeps responding until the user reaches the end of the site.
      // Only the hidden-tab case skips work.
      if (document.hidden) return;
      if (resizeQueued) applyResize();
      if (scrollDirty) readScroll();

      const t = clock.getElapsedTime();

      // Mouse rest: gently ease the parallax targets back to zero.
      if (performance.now() - lastMouseMove > 2600) {
        mouseX *= 0.97;
        mouseY *= 0.97;
      }

      // Camera: slight inverse parallax (+30% sensitivity) + slow scroll drift.
      const targetX = CAM_BASE.x - mouseX * 0.845;
      const targetY = CAM_BASE.y - mouseY * 0.52 - scrollT * 1.8;
      camX = lerp(camX, targetX, 0.05);
      camY = lerp(camY, targetY, 0.05);
      camera.position.set(camX, camY, CAM_BASE.z);
      camera.lookAt(0, -scrollT * 1.2, 0);

      // Hero object: slow continuous rotation + scroll depth.
      crystal.rotation.y += 0.0022;
      crystal.rotation.x = Math.sin(t * 0.2) * 0.15;
      wire.rotation.y -= 0.0012;
      wire.rotation.z += 0.0008;
      ring1.rotation.z += 0.002;
      ring2.rotation.z -= 0.0014;
      heroGroup.rotation.y = lerp(heroGroup.rotation.y, mouseX * 0.325, 0.04);
      heroGroup.rotation.x = lerp(heroGroup.rotation.x, mouseY * 0.195, 0.04);
      heroGroup.position.y += ((heroGroup.userData.baseY + scrollT * 2.4) - heroGroup.position.y) * 0.06;

      for (const gem of orbiters) {
        gem.userData.angle += gem.userData.speed * 0.016;
        gem.position.x = Math.cos(gem.userData.angle) * gem.userData.radius;
        gem.position.z = Math.sin(gem.userData.angle) * gem.userData.radius;
        gem.position.y = Math.sin(t * 0.8 + gem.userData.angle) * 0.5;
        gem.rotation.y += 0.02;
      }

      // Middle layer: gentle bobbing + rotation.
      for (const mesh of floaters) {
        mesh.rotation.x += mesh.userData.rotX;
        mesh.rotation.y += mesh.userData.rotY;
        mesh.position.y =
          mesh.userData.baseY + Math.sin(t * mesh.userData.bobSpeed + mesh.userData.phase) * mesh.userData.bobAmp;
      }

      // Foreground dust drifts slowly upward for atmosphere.
      dust.rotation.y = Math.sin(t * 0.05) * 0.08;
      stars.rotation.y = t * 0.004;

      renderer.render(scene, camera);
    }
    animate();

    // Free GPU resources when the page is left.
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(rafId);
      themeWatcher.disconnect();
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
    });
  }

  // Place the hero object where it never fights the text:
  // right side on desktop (behind the profile photo), centered on mobile.
  function placeHeroGroup(heroGroup, isMobile) {
    if (isMobile) {
      heroGroup.position.set(0, 0.4, -1);
      heroGroup.userData.baseY = 0.4;
      heroGroup.scale.setScalar(0.75);
    } else {
      heroGroup.position.set(2.6, 0.1, 0);
      heroGroup.userData.baseY = 0.1;
      heroGroup.scale.setScalar(1);
    }
  }

  // Soft radial sprite texture (particles + glow), generated in code —
  // no image files needed.
  function makeGlowTexture(THREE) {
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

  // Random point cloud helper (stars / dust).
  function makeParticles(THREE, texture, options) {
    const positions = new Float32Array(options.count * 3);
    for (let i = 0; i < options.count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * options.spreadX;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * options.spreadY;
      positions[i * 3 + 2] = options.zMin + Math.random() * (options.zMax - options.zMin);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: options.size,
      map: texture,
      color: options.color,
      transparent: true,
      opacity: options.opacity,
      depthWrite: false,
      blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return new THREE.Points(geo, mat);
  }

  // Tune the 3D mood to the site theme so objects stay elegant
  // on both dark and light backgrounds.
  function applyThemeMood(theme, mood, scene) {
    const dark = theme !== "light";
    if (scene && scene.fog) scene.fog.color.set(dark ? 0x0f1222 : 0xf6f7fb);

    // Paint helper: set a color, then boost saturation by 20%.
    function paint(material, hex) {
      material.color.set(hex);
      material.color.offsetHSL(0, SATURATION_BOOST, 0);
    }

    setPoints(mood.stars, dark ? 0xffffff : 0x4f46e5, dark ? 0.85 : 0.4, dark);
    setPoints(mood.dust, dark ? 0x67e8f9 : 0x7c3aed, dark ? 0.7 : 0.35, dark);

    paint(mood.floaterMat, dark ? 0x818cf8 : 0x4f46e5);
    mood.floaterMat.opacity = dark ? 0.5 : 0.35;

    paint(mood.crystalMat, dark ? 0x93a0ff : 0x6366f1);
    mood.crystalMat.metalness = dark ? 0.95 : 0.55;
    mood.crystalMat.roughness = dark ? 0.22 : 0.35;

    paint(mood.wireMat, dark ? 0x818cf8 : 0x4f46e5);
    mood.wireMat.opacity = dark ? 0.4 : 0.35;

    paint(mood.ringMat1, dark ? 0x22d3ee : 0x0ea5e9);
    paint(mood.ringMat2, dark ? 0xec4899 : 0xf472b6);
    paint(mood.orbiterMat, dark ? 0x22d3ee : 0x0ea5e9);

    paint(mood.glowMat, dark ? 0x818cf8 : 0x6366f1);
    mood.glowMat.opacity = dark ? 0.55 : 0.35;

    mood.ambient.intensity = dark ? 0.55 : 0.65;
    mood.directional.intensity = dark ? 0.9 : 0.85;
  }

  function setPoints(points, color, opacity, additive) {
    if (!points) return;
    points.material.color.set(color);
    points.material.color.offsetHSL(0, SATURATION_BOOST, 0); // +20% saturation
    points.material.opacity = opacity;
    const THREE = window.THREE;
    const want = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (points.material.blending !== want) {
      points.material.blending = want;
      points.material.needsUpdate = true;
    }
  }

  /* ============ 2. Depth-based section transitions ============
     Subtle 3D entrance for content sections. Transform + opacity
     only, so document flow and layout are never affected. */

  function initDepthTransitions(reduceMotion) {
    const sections = document.querySelectorAll("main section.section");
    if (!sections.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      sections.forEach((el) => el.classList.add("depth-show"));
      return;
    }

    sections.forEach((el) => el.classList.add("depth-hidden"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("depth-show");
          observer.unobserve(entry.target); // run once, stay lightweight
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    sections.forEach((el) => observer.observe(el));
  }

  /* ============ 3. Subtle 3D tilt on project cards ============
     Card tilts toward the cursor, banner lifts in depth, a soft
     glow follows the cursor. Transform-only; links stay clickable. */

  function initCardTilt(reduceMotion) {
    if (reduceMotion) return;
    if (window.matchMedia("(hover: none)").matches) return; // touch devices

    const grid = document.getElementById("projects-grid");

    function attach(card) {
      if (card.dataset.tiltReady) return;
      card.dataset.tiltReady = "true";

      card.addEventListener("mouseenter", () => {
        card.classList.add("tilting");
      });

      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5; // -0.5 … 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (-py * 10.4).toFixed(2) + "deg) rotateY(" + (px * 10.4).toFixed(2) + "deg)";
        card.style.setProperty("--glow-x", ((px + 0.5) * 100).toFixed(1) + "%");
        card.style.setProperty("--glow-y", ((py + 0.5) * 100).toFixed(1) + "%");
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("tilting");
        card.style.transform = ""; // fall back to the entrance-animation state
      });
    }

    document.querySelectorAll(".project-card").forEach(attach);

    // Project cards render via JavaScript — catch any added later.
    if (grid && "MutationObserver" in window) {
      const watcher = new MutationObserver(() => {
        document.querySelectorAll(".project-card").forEach(attach);
      });
      watcher.observe(grid, { childList: true });
    }
  }
})();
