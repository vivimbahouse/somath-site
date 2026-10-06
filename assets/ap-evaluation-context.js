/* Exposes a short-lived, non-personal AP context to existing evaluation events. */
(function () {
  "use strict";
  var allowed = ["pre-calculus", "ap-calculus", "ap-statistics"];
  var selected = new URLSearchParams(location.search).get("ap_course");
  var stored = null;
  try { stored = JSON.parse(sessionStorage.getItem("somath_ap_evaluation") || "null"); } catch (_) {}
  var fresh = stored && allowed.indexOf(stored.ap_course) >= 0 &&
    Date.now() - stored.saved_at >= 0 && Date.now() - stored.saved_at < 30 * 60 * 1000;
  var ref = null;
  try { if (document.referrer) ref = new URL(document.referrer); } catch (_) {}
  var matchesSource = fresh && ref && ref.origin === location.origin &&
    ref.pathname.replace(/\.html$/, "") === stored.ap_source_path;
  if (allowed.indexOf(selected) < 0) selected = matchesSource ? stored.ap_course : null;
  window.somathAPContext = selected ? {
    ap_course: selected,
    ap_source_path: fresh && stored.ap_course === selected &&
      typeof stored.ap_source_path === "string" && /^\/(?:courses|posts)\/[a-z0-9-]+$/.test(stored.ap_source_path)
      ? stored.ap_source_path : "direct_subject_link"
  } : {};
}());
