// Staff-only, read-only Stripe verification followed by an idempotent KV repair.
// Authentication is enforced by handleEnrollmentsApi before calling this module.
export async function recoverEnrollment(body, env, { list, put, update, titles }) {
  const result = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" }
  });
  if (!env.STRIPE_SECRET_KEY || !env.ENROLLMENTS)
    return result({ error: "Enrollment recovery is not configured." }, 503);
  const stripe = async path => {
    const response = await fetch("https://api.stripe.com/v1/" + path, {
      headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY }
    });
    if (!response.ok) throw new Error("Stripe verification failed. No enrollment was changed.");
    return response.json();
  };
  const id = value => typeof value === "string" ? value : value?.id || "";
  const normalized = value => String(value || "").trim().toLowerCase();
  const verified = s => s.livemode === true && s.status === "complete" &&
    s.payment_status === "paid" && s.currency === "usd" && s.amount_total > 0 &&
    !!s.metadata?.student_name?.trim() && !!titles[s.metadata?.course_slug] &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.metadata?.first_class_date || "") &&
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(s.metadata?.weekly_day || "") &&
    !!id(s.customer);
  const matching = (rows, s) => rows.find(r =>
    r.stripeSessionId === s.id ||
    (id(s.subscription) && r.subscriptionId === id(s.subscription)) ||
    (r.stripeCustomerId === id(s.customer) &&
      normalized(r.studentName) === normalized(s.metadata.student_name) &&
      r.course === s.metadata.course_slug && r.startDate === s.metadata.first_class_date)
  );
  try {
    if (body.action === "recovery_lookup") {
      const email = normalized(body.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)
        return result({ error: "Enter the parent's email address." }, 400);
      const customers = await stripe("customers?email=" + encodeURIComponent(email) + "&limit=20");
      if (customers.has_more) return result({ error: "Too many matching Stripe customers. Contact the administrator for a targeted recovery." }, 409);
      const sessions = [];
      for (const customer of customers.data || []) {
        if (normalized(customer.email) !== email) continue;
        const page = await stripe("checkout/sessions?customer=" + encodeURIComponent(customer.id) + "&limit=100");
        if (page.has_more) return result({ error: "This customer has more than 100 checkouts. Contact the administrator for a targeted recovery." }, 409);
        sessions.push(...(page.data || []).filter(verified));
      }
      const rows = await list(env, 5000);
      return result({ candidates: sessions.map(s => {
        const existing = matching(rows, s);
        return {
          sessionId: s.id, student: s.metadata.student_name,
          course: titles[s.metadata.course_slug], day: s.metadata.weekly_day,
          startDate: s.metadata.first_class_date, classTime: s.metadata.class_time || "",
          parentEmail: s.customer_details?.email || s.customer_email || email,
          amountUsd: s.amount_total / 100,
          present: !!existing && existing.status === "paid",
          existingStudent: existing?.studentName || ""
        };
      }) });
    }
    if (body.action !== "recovery_restore" || !/^cs_live_[A-Za-z0-9]+$/.test(body.sessionId || ""))
      return result({ error: "A valid live Stripe checkout is required." }, 400);
    // Never accept student, course, or amount fields supplied by the browser.
    const session = await stripe("checkout/sessions/" + encodeURIComponent(body.sessionId));
    if (!verified(session)) return result({ error: "This is not a completed, paid SOMATH enrollment checkout with sufficient student details." }, 409);
    const rows = await list(env, 5000);
    const existing = matching(rows, session);
    if (existing && normalized(existing.studentName) !== normalized(session.metadata.student_name))
      return result({ error: "An existing record uses this Stripe identity with a different student name. No records were changed; administrator review is required." }, 409);
    if (existing?.status === "paid")
      return result({ ok: true, alreadyPresent: true, student: existing.studentName });
    const invoice = id(session.invoice) ? await stripe("invoices/" + encodeURIComponent(id(session.invoice))) : null;
    if (invoice && (invoice.status !== "paid" || id(invoice.customer) !== id(session.customer)))
      return result({ error: "The invoice could not be verified. No records were changed." }, 409);
    const now = new Date().toISOString();
    const createdAt = existing?.createdAt || new Date(session.created * 1000).toISOString();
    const uniqueRef = session.metadata.course_slug + "__" + session.metadata.weekly_day + "__" +
      session.metadata.first_class_date + "__recovered_" + session.id;
    const record = {
      ...(existing || {}),
      id: existing?.id || "recovered_" + session.id,
      createdAt, updatedAt: now, status: "paid",
      ref: uniqueRef,
      course: session.metadata.course_slug, courseTitle: titles[session.metadata.course_slug],
      day: session.metadata.weekly_day, startDate: session.metadata.first_class_date,
      classTime: session.metadata.class_time || "",
      parentName: session.metadata.parent_name || session.customer_details?.name || "",
      parentEmail: session.customer_details?.email || session.customer_email || "",
      parentPhone: session.customer_details?.phone || "",
      studentName: session.metadata.student_name.trim(),
      studentEmail: existing?.studentEmail || session.metadata.student_email || "",
      amountUsd: session.amount_total / 100,
      stripeCustomerId: id(session.customer), stripeSessionId: session.id,
      subscriptionId: id(session.subscription),
      paymentIntent: id(session.payment_intent) || id(invoice?.payment_intent),
      paidAt: invoice?.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : "",
      referer: "admin-stripe-recovery",
      notes: (existing?.notes ? existing.notes + "\n" : "") +
        "Recovered by authenticated staff from verified paid Stripe checkout at " + now +
        ". Original reference: " + (session.client_reference_id || "") +
        ". No Stripe, calendar, attendance, or email changes."
    };
    // Same checkout always has the same key; repeated clicks do not add another row.
    await put(env, record);
    return result({ ok: true, alreadyPresent: false, student: record.studentName });
  } catch (error) {
    return result({ error: "Recovery could not be completed. Refresh the enrollment list before retrying. No charges or emails were created." }, 502);
  }
}
