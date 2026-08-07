/* ============================================================
   BRUNA VARRO · TATTOO — interações
   GSAP + ScrollTrigger + Lenis. Respeita prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(min-width: 900px) and (pointer: fine)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------- Ano no footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     LENIS — rolagem suave "manteiga"
     ============================================================ */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ duration: 1.1, lerp: 0.1, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (hasGSAP && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }
    document.documentElement.classList.add("lenis");
  }

  /* Links âncora respeitam o Lenis */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ============================================================
     PRELOADER — assinatura + linha fina revela o site
     ============================================================ */
  const preloader = document.getElementById("preloader");
  function revealSite() {
    if (preloader) preloader.classList.add("is-done");
    document.body.classList.add("is-loaded");
    startHero();
  }
  if (preloader && hasGSAP && !reduced) {
    const tl = gsap.timeline();
    tl.to(".preloader__sig", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" })
      .to(".preloader__line", { width: "min(320px, 62vw)", duration: 0.8, ease: "power2.inOut" }, "-=0.3")
      .to(".preloader__tag", { opacity: 1, duration: 0.5 }, "-=0.4")
      .to({}, { duration: 0.35 })
      .add(revealSite);
  } else {
    // Sem GSAP ou movimento reduzido: mostra direto
    window.addEventListener("load", revealSite);
    setTimeout(revealSite, 600);
  }

  /* ============================================================
     HERO — abertura em cascata
     ============================================================ */
  function startHero() {
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.7 })
      .from(".hero__title .line > span", { yPercent: 115, duration: 0.9, stagger: 0.12 }, "-=0.35")
      .from(".hero__lead", { y: 20, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".hero__cta > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.12 }, "-=0.4")
      .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.2");
  }

  /* ============================================================
     REVEALS — títulos e blocos entrando (dispara antes da dobra)
     ============================================================ */
  const reveals = document.querySelectorAll(".reveal-up");
  if (hasGSAP && !reduced && typeof ScrollTrigger !== "undefined") {
    reveals.forEach((el) => {
      const delay = parseFloat(el.dataset.delay || 0);
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ============================================================
     PROGRESS BAR
     ============================================================ */
  const progress = document.getElementById("progress");
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (progress) progress.style.width = (p * 100).toFixed(2) + "%";
  }
  if (lenis) lenis.on("scroll", updateProgress);
  else window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ============================================================
     NAV — fundo ao rolar + FAB
     ============================================================ */
  const nav = document.getElementById("nav");
  const fab = document.querySelector(".fab");
  function onScrollUI() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (fab) fab.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScrollUI, { passive: true });
  onScrollUI();

  /* ============================================================
     SHOWCASE — esteira automática contínua (PC e celular)
     ============================================================ */
  const showcase = document.getElementById("trabalhos");
  const track = document.getElementById("showcaseTrack");
  if (showcase && track && !reduced) {
    // Duplica os frames uma vez para o loop ficar contínuo (sem "salto")
    const originals = Array.from(track.children);
    originals.forEach((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      const img = clone.querySelector("img");
      if (img) img.removeAttribute("loading"); // clones podem carregar de imediato
      track.appendChild(clone);
    });
    showcase.classList.add("is-marquee");
    // Duração proporcional à largura, pra manter velocidade constante em qualquer tela
    requestAnimationFrame(() => {
      const halfWidth = track.scrollWidth / 2;
      const pxPerSecond = 55;
      track.style.setProperty("--marquee-duration", (halfWidth / pxPerSecond).toFixed(1) + "s");
    });
  }
  // Movimento reduzido: sem animação, vira carrossel arrastável via CSS (overflow-x + scroll-snap)

  /* ============================================================
     BOTÃO MAGNÉTICO (só desktop/pointer fino)
     ============================================================ */
  if (isDesktop && !reduced) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = "translate(0,0)"; });
    });
  }

  /* ============================================================
     TILT 3D nos cards (só desktop) / feedback de toque (mobile)
     ============================================================ */
  if (isDesktop && !reduced) {
    document.querySelectorAll(".tilt").forEach((card) => {
      const max = 6;
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
        card.style.boxShadow = "0 24px 50px -24px rgba(20,16,14,.4)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    });
  } else {
    // Mobile: feedback de toque
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("touchstart", () => { card.style.transform = "scale(.98)"; }, { passive: true });
      card.addEventListener("touchend", () => { card.style.transform = ""; }, { passive: true });
    });
  }

  /* ============================================================
     FORMULÁRIO → monta mensagem e abre o WhatsApp
     ============================================================ */
  const WHATS = "5512981555026"; // (12) 98155-5026
  const form = document.getElementById("waForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nome = (data.get("nome") || "").toString().trim();
      const ideia = (data.get("ideia") || "").toString().trim();
      const local = (data.get("local") || "").toString().trim();
      const tam = (data.get("tamanho") || "").toString().trim();

      // validação leve
      if (!nome || !ideia) {
        const alvo = !nome ? form.querySelector("#f-nome") : form.querySelector("#f-ideia");
        if (alvo) { alvo.focus(); alvo.style.borderColor = "#c98b6b"; }
        return;
      }

      let msg = `Oi, Bruna! Tudo bem? Meu nome é ${nome}.`;
      msg += `\n\nMinha ideia de tatuagem: ${ideia}.`;
      if (local) msg += `\nLocal do corpo: ${local}.`;
      if (tam) msg += `\nTamanho aproximado: ${tam}.`;
      msg += `\n\nVim pelo site e gostaria de agendar.`;

      const url = `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  /* Refresh do ScrollTrigger após tudo carregar (fontes/imagens) */
  window.addEventListener("load", () => {
    if (hasGSAP && typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });
})();
