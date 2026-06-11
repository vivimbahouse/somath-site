// Shared nav, footer, sticky CTA — injected on every page
(function () {
  const page = document.body.dataset.page || "";

  const navHTML = `
    <div class="announce">
      Summer programs now enrolling — get ahead, catch up, or prep for SHSAT, SAT &amp; AP.
      <a href="/evaluation">Book a free evaluation →</a>
    </div>
    <header class="nav">
      <div class="nav__inner">
        <div class="nav__brand">
          <a href="/" class="nav__brand-link" aria-label="School of Math home">
            <img src="/assets/logo-full.svg" alt="School of Math" class="nav__logo" />
          </a>
          <div class="nav__address">
            <a class="nav__address-line" href="https://maps.google.com/?q=226+W+79th+St,+New+York,+NY+10024" target="_blank" rel="noopener" aria-label="Open 226 W 79th St, New York, NY 10024 in Google Maps">226 W 79th St &middot; New York, NY 10024</a>
            <a href="tel:+16466686151" class="nav__phone">(646) 668-6151</a>
          </div>
        </div>
        <nav class="nav__links" aria-label="Primary">
          <a class="nav__link ${page === "programs" ? "is-active" : ""}" href="/programs">Programs</a>
          <div class="nav__dropdown ${page === "schedule" ? "is-active" : ""}">
            <button type="button" class="nav__link nav__dropdown-toggle ${page === "schedule" ? "is-active" : ""}" aria-expanded="false" aria-haspopup="true">Schedule<span class="nav__dropdown-caret" aria-hidden="true">▾</span></button>
            <div class="nav__dropdown-menu" role="menu">
              <a class="nav__dropdown-item" href="/summer-schedule" role="menuitem">July 2026</a>
              <a class="nav__dropdown-item" href="/august-schedule" role="menuitem">August 2026</a>
            </div>
          </div>
          <a class="nav__link ${page === "about" ? "is-active" : ""}" href="/about">About</a>
          <a class="nav__link ${page === "blog" ? "is-active" : ""}" href="/blog">Journal</a>
          <a class="nav__link ${page === "contact" ? "is-active" : ""}" href="/contact">Visit Us</a>
        </nav>
        <a href="/evaluation" class="nav__cta btn btn--primary">Book Free Evaluation</a>
        <button class="nav__burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav__mobile" id="mobile-menu" aria-hidden="true">
        <a class="nav__mobile-link ${page === "programs" ? "is-active" : ""}" href="/programs">Programs</a>
        <a class="nav__mobile-link ${page === "schedule" ? "is-active" : ""}" href="/summer-schedule">Schedule &mdash; July 2026</a>
        <a class="nav__mobile-link ${page === "schedule-august" ? "is-active" : ""}" href="/august-schedule">Schedule &mdash; August 2026</a>
        <a class="nav__mobile-link ${page === "about" ? "is-active" : ""}" href="/about">About</a>
        <a class="nav__mobile-link ${page === "blog" ? "is-active" : ""}" href="/blog">Journal</a>
        <a class="nav__mobile-link ${page === "contact" ? "is-active" : ""}" href="/contact">Visit Us</a>
        <a class="nav__mobile-cta btn btn--primary" href="/evaluation">Book Free Evaluation</a>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <img src="/assets/logo-footer.svg" alt="School of Math" />
          <p class="footer__tag">
            Math tutoring on the Upper West Side, taught by Harvard- and
            Northwestern-trained educators with twenty years preparing
            candidates for MIT, Harvard, and Stanford.
          </p>
        </div>
        <div class="footer__col">
          <h4>Programs</h4>
          <ul>
            <li><a href="/programs#little-newtons">Little Newtons (1–5)</a></li>
            <li><a href="/programs#kid-einsteins">Kid Einsteins (6–8)</a></li>
            <li><a href="/programs#young-fermats">Young Fermats (8+)</a></li>
            <li><a href="/programs#shsat-prep">SHSAT Prep (7–8)</a></li>
            <li><a href="/programs#ap-courses">AP Courses (9–12)</a></li>
            <li><a href="/programs#sat-prep">SAT Prep (10–12)</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>School</h4>
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/blog">Journal</a></li>
            <li><a href="/contact">Visit Us</a></li>
            <li><a href="/evaluation">Free Evaluation</a></li>
            <li><a href="https://www.instagram.com/schoolofmath.us/" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/refund">Refund Policy</a></li>
            <li><a href="/accessibility">Accessibility</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Contact</h4>
          <ul>
            <li><a href="tel:+16466686151">(646) 668-6151</a></li>
            <li><a href="mailto:hello@schoolofmath.us">hello@schoolofmath.us</a></li>
            <li>226 W 79th St<br/>New York, NY 10024</li>
            <li>Mon–Fri · 3:00pm–10:00pm<br/>Sat · 10:00am–6:00pm</li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© ${new Date().getFullYear()} School of Math LLC. All rights reserved.</span>
        <span>Made with care on the Upper West Side.</span>
      </div>
    </footer>
  `;

  const stickyHTML = `
    <a class="stickycta btn btn--primary btn--lg btn--block" href="/evaluation">
      Book a Free 60-Min Evaluation
    </a>
  `;

  // Inject in order
  const navMount = document.getElementById("nav-mount") || document.getElementById("header-mount");
  const footerMount = document.getElementById("footer-mount");
  const stickyMount = document.getElementById("sticky-mount");

  if (navMount) navMount.innerHTML = navHTML;
  if (footerMount) footerMount.innerHTML = footerHTML;
  if (stickyMount) stickyMount.innerHTML = stickyHTML;

  // Desktop dropdown: hover-open, click-toggle (touch), close on outside click + Escape
  document.querySelectorAll(".nav__dropdown").forEach(dd => {
    const toggle = dd.querySelector(".nav__dropdown-toggle");
    if (!toggle) return;
    const setOpen = (open) => {
      dd.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(!dd.classList.contains("is-open"));
    });
    dd.addEventListener("mouseenter", () => setOpen(true));
    dd.addEventListener("mouseleave", () => setOpen(false));
    document.addEventListener("click", (e) => { if (!dd.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  });

  // Mobile hamburger menu toggle
  const burger = document.querySelector(".nav__burger");
  const mobile = document.getElementById("mobile-menu");
  if (burger && mobile) {
    const close = () => {
      burger.classList.remove("is-open");
      mobile.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      mobile.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-open");
    };
    burger.addEventListener("click", () => {
      const open = !burger.classList.contains("is-open");
      burger.classList.toggle("is-open", open);
      mobile.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      mobile.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("nav-open", open);
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // Close when a link is clicked
    mobile.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
    // Close on Escape
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }
})();
