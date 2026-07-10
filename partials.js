// Shared nav, footer, sticky CTA — injected on every page
(function () {
  const page = document.body.dataset.page || "";

  const navHTML = `
    <div class="announce">
      New: SOMATH Membership — start any week, from $246/mo.
      <a href="/membership">See plans →</a>
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
          <a class="nav__link ${page === "membership" ? "is-active" : ""}" href="/membership">Membership</a>
          <a class="nav__link ${page === "courses" ? "is-active" : ""}" href="/courses/">Courses</a>
          <a class="nav__link ${page === "schedule" ? "is-active" : ""}" href="/schedule">Schedule</a>
          <a class="nav__link ${page === "about" ? "is-active" : ""}" href="/about">Team</a>
          <a class="nav__link ${page === "blog" ? "is-active" : ""}" href="/blog">Journal</a>
          <a class="nav__link ${page === "contact" ? "is-active" : ""}" href="/contact">Visit</a>
        </nav>
        <a href="/evaluation" class="nav__cta btn btn--primary">Book Free Evaluation</a>
        <button class="nav__burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav__mobile" id="mobile-menu" aria-hidden="true">
        <a class="nav__mobile-link ${page === "membership" ? "is-active" : ""}" href="/membership">Membership</a>
        <a class="nav__mobile-link ${page === "courses" ? "is-active" : ""}" href="/courses/">Courses</a>
        <a class="nav__mobile-link ${page === "schedule" ? "is-active" : ""}" href="/schedule">Schedule</a>
        <a class="nav__mobile-link ${page === "about" ? "is-active" : ""}" href="/about">Team</a>
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
          <h4>Enroll</h4>
          <ul>
            <li><a href="/membership"><strong>Membership — monthly</strong></a></li>
            <li><a href="/courses/">All courses</a></li>
            <li><a href="/programs">Programs (all levels)</a></li>
            <li><a href="/schedule">Year-round schedule</a></li>
            <li><a href="/shsat-prep">SHSAT Prep</a></li>
            <li><a href="/programs#little-newtons">Little Newtons (K–2)</a></li>
            <li><a href="/programs#kid-einsteins">Kid Einsteins (3–5)</a></li>
            <li><a href="/programs#young-fermats">Young Fermats (5–8)</a></li>
            <li><a href="/programs#shsat-prep">SHSAT Prep (7–8)</a></li>
            <li><a href="/programs#ap-courses">AP Courses (9–12)</a></li>
            <li><a href="/programs#sat-prep">SAT Prep (10–12)</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>School</h4>
          <ul>
            <li><a href="/about">Team</a></li>
            <li><a href="/posts/inside-somath-2026-website-tour-membership-schedule-syllabus">Watch the Tour</a></li>
            <li><a href="/blog">Journal</a></li>
            <li><a href="/contact">Visit Us</a></li>
            <li><a href="/evaluation">Free Evaluation</a></li>
            <li><a href="/student-evaluation">Student Evaluation</a></li>
            <li><a href="/course-recommendation">Course Recommendation</a></li>
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
            <li>Mon–Fri · 3:00pm–10:00pm<br/>Sat · 9:00am–6:00pm<br/>Sun · 10:00am–5:00pm</li>
          </ul>
        </div>
      </div>
      <div class="footer__social" aria-label="School of Math on social media">
        <a class="footer__social-link" href="https://www.instagram.com/schoolofmath.us/" target="_blank" rel="noopener" aria-label="Instagram">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.2.05 1.8.25 2.2.42a3.7 3.7 0 0 1 1.35.88c.4.4.69.85.88 1.35.17.42.37 1.02.42 2.2.06 1.25.07 1.62.07 4.8s0 3.55-.07 4.8c-.05 1.2-.25 1.8-.42 2.2a3.7 3.7 0 0 1-.88 1.35 3.7 3.7 0 0 1-1.35.88c-.42.17-1.02.37-2.2.42-1.25.06-1.62.07-4.8.07s-3.55 0-4.8-.07c-1.2-.05-1.8-.25-2.2-.42a3.7 3.7 0 0 1-1.35-.88 3.7 3.7 0 0 1-.88-1.35c-.17-.42-.37-1.02-.42-2.2C2.2 15.55 2.2 15.18 2.2 12s0-3.55.07-4.8c.05-1.2.25-1.8.42-2.2.2-.5.49-.95.88-1.35.4-.4.85-.69 1.35-.88.42-.17 1.02-.37 2.2-.42C8.45 2.2 8.82 2.2 12 2.2Zm0 1.8c-3.13 0-3.5 0-4.73.07-.94.04-1.45.2-1.79.34-.45.18-.77.39-1.11.73-.34.34-.55.66-.73 1.11-.13.34-.3.85-.34 1.79C3.04 8.5 3 8.87 3 12s0 3.5.07 4.73c.04.94.2 1.45.34 1.79.18.45.39.77.73 1.11.34.34.66.55 1.11.73.34.13.85.3 1.79.34C8.5 20.96 8.87 21 12 21s3.5 0 4.73-.07c.94-.04 1.45-.2 1.79-.34.45-.18.77-.39 1.11-.73.34-.34.55-.66.73-1.11.13-.34.3-.85.34-1.79.07-1.23.07-1.6.07-4.73s0-3.5-.07-4.73c-.04-.94-.2-1.45-.34-1.79a3 3 0 0 0-.73-1.11 3 3 0 0 0-1.11-.73c-.34-.13-.85-.3-1.79-.34C15.5 4.04 15.13 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.05a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://www.facebook.com/profile.php?id=61568867662183" target="_blank" rel="noopener" aria-label="Facebook">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.6H7.6V14h2.7v8h3.2Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://www.youtube.com/@somathny" target="_blank" rel="noopener" aria-label="YouTube">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5A3 3 0 0 0 2.6 19.6c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5ZM9.8 15.5v-7l6.2 3.5-6.2 3.5Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://www.tiktok.com/@schoolofmathny" target="_blank" rel="noopener" aria-label="TikTok">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.7v-3a5.8 5.8 0 1 0 5 5.7V8.6a7.4 7.4 0 0 0 4 1.2V6.8a4.5 4.5 0 0 1-4-4.8Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://www.linkedin.com/company/somathny/" target="_blank" rel="noopener" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.5 3h-17A1.5 1.5 0 0 0 2 4.5v15A1.5 1.5 0 0 0 3.5 21h17a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 20.5 3ZM8 18H5.3v-8.6H8V18ZM6.65 8.2a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1ZM19 18h-2.7v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V18H10.6v-8.6h2.6v1.2h.04a2.85 2.85 0 0 1 2.56-1.4c2.74 0 3.24 1.8 3.24 4.14V18Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://www.pinterest.com/somathnyc/" target="_blank" rel="noopener" aria-label="Pinterest">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.65 19.31c-.09-.8-.17-2.04.04-2.92.19-.8 1.24-5.1 1.24-5.1s-.32-.64-.32-1.58c0-1.48.86-2.59 1.93-2.59.91 0 1.35.68 1.35 1.5 0 .92-.58 2.29-.88 3.56-.25 1.07.53 1.94 1.58 1.94 1.9 0 3.36-2 3.36-4.9 0-2.56-1.84-4.35-4.47-4.35a4.64 4.64 0 0 0-4.84 4.65c0 .92.35 1.91.8 2.45.09.11.1.2.07.31-.08.32-.25 1.02-.28 1.16-.05.19-.15.23-.34.14-1.28-.6-2.08-2.46-2.08-3.96 0-3.23 2.34-6.19 6.75-6.19 3.54 0 6.3 2.52 6.3 5.9 0 3.52-2.22 6.36-5.31 6.36-1.04 0-2.01-.54-2.34-1.18l-.64 2.43c-.23.89-.85 2-1.27 2.68A10 10 0 1 0 12 2Z"/></svg>
        </a>
        <a class="footer__social-link" href="https://x.com/schoolofmathny" target="_blank" rel="noopener" aria-label="X (Twitter)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.83l4.713 6.231 5.447-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>
        </a>
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
