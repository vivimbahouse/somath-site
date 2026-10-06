/* AP funnel context only. No names, email addresses, or query strings are stored. */
(function () {
  "use strict";
  var allowed = ["pre-calculus", "ap-calculus", "ap-statistics"];
  var course = document.body.dataset.apCourse;
  if (allowed.indexOf(course) < 0) return;
  document.addEventListener("click", function (event) {
    var anchor = event.target.closest && event.target.closest("a[href]");
    if (!anchor) return;
    var url;
    try { url = new URL(anchor.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin || !/^\/evaluation(?:\.html)?\/?$/.test(url.pathname)) return;
    var source = location.pathname.replace(/\.html$/, "");
    var context = { ap_course: course, ap_source_path: source, saved_at: Date.now() };
    try { sessionStorage.setItem("somath_ap_evaluation", JSON.stringify(context)); } catch (_) {}
    url.searchParams.set("ap_course", course);
    anchor.href = url.href;
    if (typeof window.gtag === "function") {
      window.gtag("event", "ap_evaluation_click", {
        ap_course: course,
        ap_source_path: source,
        cta_position: anchor.dataset.apCta || "existing_link",
        transport_type: "beacon"
      });
    }
  });
}());
