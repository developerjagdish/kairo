// ===== Navbar: shrink/blur on scroll =====
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ===== Mobile menu toggle =====
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  navToggle.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
  })
);

// ===== Accordions (FAQ + Solutions) =====
function initAccordion(listSelector, itemSelector, qSelector, aSelector) {
  document.querySelectorAll(listSelector).forEach((list) => {
    const items = list.querySelectorAll(itemSelector);
    items.forEach((item) => {
      const q = item.querySelector(qSelector);
      const a = item.querySelector(aSelector);
      if (!q || !a) return;
      if (item.classList.contains("active")) {
        requestAnimationFrame(() => { a.style.maxHeight = a.scrollHeight + "px"; });
      }
      q.addEventListener("click", () => {
        const isOpen = item.classList.contains("active");
        items.forEach((other) => {
          other.classList.remove("active");
          const oa = other.querySelector(aSelector);
          if (oa) oa.style.maxHeight = "0px";
        });
        if (!isOpen) {
          item.classList.add("active");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  });
}
initAccordion(".faq__list", ".faq__item", ".faq__q", ".faq__a");
initAccordion(".acc", ".acc__item", ".acc__q", ".acc__a");

// ===== Orbit graphic re-aligns with the active Solutions item =====
const orbit = document.querySelector(".orbit");
const accItems = document.querySelectorAll(".acc__item");
function spinOrbit() {
  if (!orbit) return;
  let idx = [...accItems].findIndex((i) => i.classList.contains("active"));
  if (idx < 0) idx = 0;
  orbit.style.transform = `rotate(${idx * 36}deg)`;
}
accItems.forEach((item) => item.querySelector(".acc__q")?.addEventListener("click", () => {
  // run after the accordion toggles its active class
  requestAnimationFrame(spinOrbit);
}));
spinOrbit();

// ===== Long-copy word reveal =====
// Preserve the original text for screen readers while animating visual word spans.
const wordRevealEls = document.querySelectorAll(
  ".about__title, .about__lead, .sec__title, .sec__lead, .quote-block blockquote, .enterprise__list, .testi__card blockquote, .cta__text, .stats__note p"
);

const wordRevealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      wordRevealIO.unobserve(entry.target);
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);

wordRevealEls.forEach((el) => {
  const text = el.textContent.replace(/\s+/g, " ").trim();
  if (!text || text.split(" ").length < 8) return;

  el.setAttribute("aria-label", text);
  el.classList.add("word-reveal");
  el.innerHTML = text
    .split(" ")
    .map(
      (word, index) =>
        `<span class="word" aria-hidden="true" style="--word-index:${index}">${word}</span>`
    )
    .join(" ");
  wordRevealIO.observe(el);
});

// ===== Scroll-reveal animations =====
const revealEls = document.querySelectorAll(
  ".sec__intro-body, .stat, .cap, .case, .testi__card, .insight, .quote-block, .enterprise__badges, .cta__inner"
);
revealEls.forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = (i % 4) * 0.07 + "s";
});

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => io.observe(el));

// ===== Animated stat counters =====
const stats = document.querySelectorAll(".stat__num");
const statIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.target) || 0;
      const suffix = el.dataset.suffix || "";
      // Demo numbers so the template doesn't sit at zero
      const demo = { "+": 2400, "M+": 18, "%": 87 };
      const end = target > 0 ? target : demo[suffix] || 0;
      let cur = 0;
      const step = Math.max(1, end / 60);
      const tick = () => {
        cur += step;
        if (cur >= end) cur = end;
        el.textContent = Math.round(cur).toLocaleString() + suffix;
        if (cur < end) requestAnimationFrame(tick);
      };
      tick();
      statIO.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
stats.forEach((s) => statIO.observe(s));

// ===== Waitlist form =====
const form = document.getElementById("waitlistForm");
const note = document.getElementById("formNote");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = form.querySelector("input");
  note.textContent = "🎉 Request received! We'll reach out at " + input.value;
  input.value = "";
});

// ===== Smooth inertia scrolling =====
// Lerps the REAL scroll position (window.scrollTo) so position: sticky / fixed
// keep working. Disabled on touch devices and when reduced motion is requested.
(function smoothScroll() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (reduce || isTouch) return;

  // turn off CSS smooth so per-frame scrollTo isn't double-eased
  document.documentElement.style.scrollBehavior = "auto";

  const EASE = 0.12; // higher = snappier, lower = floatier
  let target = window.scrollY;
  let current = target;
  let running = false;
  let lastSet = Math.round(current);

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamp = (v) => Math.max(0, Math.min(v, maxScroll()));

  function loop() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.4) current = target;
    const y = Math.round(current);
    lastSet = y;
    window.scrollTo(0, y);
    if (current !== target) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }
  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  // wheel / trackpad
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) return; // let pinch-zoom through
      e.preventDefault();
      target = clamp(target + e.deltaY);
      start();
    },
    { passive: false }
  );

  // keyboard
  window.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
    const page = window.innerHeight * 0.9;
    const map = {
      ArrowDown: 90, ArrowUp: -90,
      PageDown: page, PageUp: -page, " ": page,
      Home: -maxScroll() - target, End: maxScroll(),
    };
    if (e.key in map) {
      e.preventDefault();
      target = clamp(target + map[e.key]);
      start();
    }
  });

  // if the page is scrolled by other means (scrollbar drag, resize), resync
  window.addEventListener(
    "scroll",
    () => {
      if (Math.abs(window.scrollY - lastSet) > 2) {
        target = current = window.scrollY;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", () => { target = clamp(target); });

  // smooth anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      target = clamp(top);
      start();
    });
  });
})();
