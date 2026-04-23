import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://kloversegy.com",
  "https://www.kloversegy.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

type TierKey = "local" | "regional" | "global";
type ClassType = "group" | "private";
type Duration = 1 | 3 | 6;

interface PlanInfo {
  tier: TierKey;
  classType: ClassType;
  duration: Duration;
  amount: number;
  classesIncluded: number;
}

const priceIdToPlan: Record<string, PlanInfo> = {
  "price_1SzuGyP5xKnfzufHDEWn3gYQ": { tier: "local", classType: "group", duration: 1, amount: 25, classesIncluded: 4 },
  "price_1SzuHIP5xKnfzufHopangw1F": { tier: "local", classType: "group", duration: 3, amount: 70, classesIncluded: 12 },
  "price_1SzuHdP5xKnfzufHOnyjqTdp": { tier: "local", classType: "group", duration: 6, amount: 130, classesIncluded: 24 },
  "price_1SzuJfP5xKnfzufHInig8j7K": { tier: "local", classType: "private", duration: 1, amount: 50, classesIncluded: 4 },
  "price_1SzuJxP5xKnfzufHfeHITx65": { tier: "local", classType: "private", duration: 3, amount: 140, classesIncluded: 12 },
  "price_1SzuKHP5xKnfzufHv2F9RQxh": { tier: "local", classType: "private", duration: 6, amount: 250, classesIncluded: 24 },
  "price_1SzuHyP5xKnfzufH95Ft0goD": { tier: "regional", classType: "group", duration: 1, amount: 40, classesIncluded: 4 },
  "price_1SzuIFP5xKnfzufHVP5B37k0": { tier: "regional", classType: "group", duration: 3, amount: 110, classesIncluded: 12 },
  "price_1SzuIVP5xKnfzufHiKQZNrcN": { tier: "regional", classType: "group", duration: 6, amount: 200, classesIncluded: 24 },
  "price_1SzuKcP5xKnfzufH5GZEy8qJ": { tier: "regional", classType: "private", duration: 1, amount: 80, classesIncluded: 4 },
  "price_1SzuKrP5xKnfzufHBdVWXoWm": { tier: "regional", classType: "private", duration: 3, amount: 220, classesIncluded: 12 },
  "price_1SzuLKP5xKnfzufHqCc6Z88A": { tier: "regional", classType: "private", duration: 6, amount: 380, classesIncluded: 24 },
  "price_1SzuIkP5xKnfzufHUoR4BcIy": { tier: "global", classType: "group", duration: 1, amount: 60, classesIncluded: 4 },
  "price_1SzuJ3P5xKnfzufHxh1lTYg6": { tier: "global", classType: "group", duration: 3, amount: 170, classesIncluded: 12 },
  "price_1SzuJMP5xKnfzufHERVUIwAG": { tier: "global", classType: "group", duration: 6, amount: 300, classesIncluded: 24 },
  "price_1SzuLZP5xKnfzufH4JcNbPF5": { tier: "global", classType: "private", duration: 1, amount: 120, classesIncluded: 4 },
  "price_1SzuLpP5xKnfzufHd9EcgWs2": { tier: "global", classType: "private", duration: 3, amount: 330, classesIncluded: 12 },
  "price_1SzuM4P5xKnfzufHQWJXvZWW": { tier: "global", classType: "private", duration: 6, amount: 580, classesIncluded: 24 },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event: Stripe.Event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // ── Handle charge refunds ──
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

      if (paymentIntentId) {
        const { data: enrollment } = await supabaseAdmin
          .from("enrollments")
          .select("id, user_id, sessions_remaining")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (enrollment) {
          await supabaseAdmin.from("enrollments").update({
            payment_status: "REFUNDED",
            enrollment_status: "cancelled",
          }).eq("id", enrollment.id);

          // Deduct credits from profile
          if (enrollment.user_id && enrollment.sessions_remaining > 0) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("credits")
              .eq("user_id", enrollment.user_id)
              .single();

            if (profile) {
              await supabaseAdmin.from("profiles").update({
                credits: Math.max(0, (profile.credits || 0) - enrollment.sessions_remaining),
              }).eq("user_id", enrollment.user_id);
            }
          }

          await supabaseAdmin.from("admin_notifications").insert({
            message: `Stripe charge refunded for enrollment ${enrollment.id}. Enrollment cancelled and credits deducted.`,
            type: "payment_refunded",
            related_user_id: enrollment.user_id,
          });
          console.log(`Refund processed for enrollment ${enrollment.id}`);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Handle payment failures ──
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;

      const { data: enrollment } = await supabaseAdmin
        .from("enrollments")
        .select("id, user_id")
        .eq("stripe_payment_intent_id", pi.id)
        .maybeSingle();

      if (enrollment) {
        await supabaseAdmin.from("enrollments").update({
          payment_status: "FAILED",
        }).eq("id", enrollment.id);

        await supabaseAdmin.from("admin_notifications").insert({
          message: `Stripe payment failed for enrollment ${enrollment.id}. Reason: ${pi.last_payment_error?.message || "unknown"}.`,
          type: "payment_failed",
          related_user_id: enrollment.user_id,
        });
        console.log(`Payment failed for enrollment ${enrollment.id}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Handle successful checkout ──
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;

      // ── Interview Training payment ──
      if (meta?.product_type === "interview_training" && meta?.interview_session_id) {
        const { error: itErr } = await supabaseAdmin
          .from("interview_training_sessions")
          .update({
            payment_status: "paid",
            paid_purchased: 5,
            stripe_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", meta.interview_session_id);
        if (itErr) console.error("Interview training payment update failed:", itErr.message);
        else console.log("Interview training payment processed for session:", meta.interview_session_id);
        return new Response(JSON.stringify({ received: true, type: "interview_training" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const email = meta?.email || session.customer_email;
      const name = meta?.name || "";

      if (!email) {
        console.error("No email in metadata or session");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency
      const txRef = (session.payment_intent as string) || session.id;
      const { data: existingEnrollment } = await supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("tx_ref", txRef)
        .maybeSingle();

      if (existingEnrollment) {
        console.log(`Duplicate webhook for tx_ref ${txRef}, skipping`);
        return new Response(JSON.stringify({ received: true, deduped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Derive plan from line items
      let plan: PlanInfo | null = null;
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price"],
      });

      const lineItems = fullSession.line_items?.data;
      if (lineItems && lineItems.length > 0) {
        const stripePriceId = lineItems[0].price?.id;
        if (stripePriceId && priceIdToPlan[stripePriceId]) {
          plan = priceIdToPlan[stripePriceId];
        }
      }

      if (!plan) {
        console.error("Could not derive plan from Stripe line items");
        return new Response(JSON.stringify({ received: true, warning: "Unknown price" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use actual amount paid (after discount) from Stripe
      const actualAmount = (session.amount_total ?? plan.amount * 100) / 100;
      const unitPrice = plan.classesIncluded > 0 ? actualAmount / plan.classesIncluded : 0;

      // Parse schedule from flat metadata fields (new format)
      const preferredDaysRaw = meta?.preferred_days || "";
      const preferredDays = preferredDaysRaw
        ? preferredDaysRaw.split(",").map((d: string) => d.trim()).filter(Boolean)
        : null;
      const preferredDay = preferredDays && preferredDays.length > 0 ? preferredDays[0] : null;
      const preferredTime = meta?.preferred_time || null;
      const preferredStart = meta?.preferred_start || null;
      const timezone = meta?.timezone || null;
      const level = meta?.level || null;
      const packageId = meta?.package_id || null;

      // Find or create user
      let userId: string;
      const { data: existingUserData } = await supabaseAdmin.auth.admin.getUserByEmail(email);

      if (existingUserData?.user) {
        userId = existingUserData.user.id;
      } else {
        const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name },
        });

        if (createError || !newUser.user) {
          throw new Error(`Failed to create user: ${createError?.message}`);
        }

        userId = newUser.user.id;

        await supabaseAdmin
          .from("profiles")
          .update({ name, email })
          .eq("user_id", userId);

        await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
      }

      // Create enrollment with schedule data from metadata
      const { data: newEnrollment } = await supabaseAdmin.from("enrollments").insert({
        user_id: userId,
        plan_type: plan.classType,
        duration: plan.duration,
        classes_included: plan.classesIncluded,
        amount: actualAmount,
        unit_price: unitPrice,
        tx_ref: txRef,
        receipt_url: `stripe:${session.id}`,
        status: "APPROVED",
        payment_status: "PAID",
        payment_provider: "stripe",
        approval_status: "APPROVED",
        admin_review_required: false,
        sessions_total: plan.classesIncluded,
        sessions_remaining: plan.classesIncluded,
        enrollment_status: "active",
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        timezone,
        preferred_days: preferredDays,
        preferred_day: preferredDay,
        preferred_time: preferredTime,
        preferred_start: preferredStart,
        level: level || null,
        package_id: packageId || null,
        currency: session.currency?.toUpperCase() || "USD",
      }).select("id").single();

      // Save level to profile if provided.
      // Stripe metadata carries the canonical course key (hangul, l1..l6)
      // produced by LEVEL_SELECT_OPTIONS at checkout, so it belongs in
      // profiles.course_level_key (the column course logic reads).
      // profiles.level stays a free-form self-assessment label.
      if (level) {
        await supabaseAdmin
          .from("profiles")
          .update({ course_level_key: level })
          .eq("user_id", userId);
      }

      // Update profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("user_id", userId)
        .single();

      await supabaseAdmin
        .from("profiles")
        .update({
          status: "ACTIVE",
          credits: (profile?.credits || 0) + plan.classesIncluded,
        })
        .eq("user_id", userId);

      const enrollmentId = newEnrollment?.id;
      console.log(`Enrollment created: ${plan.classesIncluded} classes, $${actualAmount}, id: ${enrollmentId}`);

      // Auto-assign to slot/group
      if (enrollmentId) {
        try {
          const { data: slotId } = await supabaseAdmin.rpc("match_enrollment_to_slot", { _enrollment_id: enrollmentId });
          if (slotId) {
            await supabaseAdmin.rpc("assign_student_to_group_from_slot", {
              _slot_id: slotId,
              _user_id: userId,
              _enrollment_id: enrollmentId,
            });
            console.log(`Auto-assigned enrollment ${enrollmentId} to slot ${slotId}`);
          } else {
            // No slot available — create admin reminder
            await supabaseAdmin.from("admin_notifications").insert({
              message: `Stripe-paid student (${email}) could not be auto-assigned to a slot. Please assign manually.`,
              type: "unassigned_paid_student",
              related_user_id: userId,
            });
            console.log(`No slot match for enrollment ${enrollmentId}, admin notification created`);
          }
        } catch (assignErr) {
          console.error("Auto-assign error:", assignErr);
          await supabaseAdmin.from("admin_notifications").insert({
            message: `Auto-assign failed for Stripe-paid student (${email}). Please assign manually.`,
            type: "unassigned_paid_student",
            related_user_id: userId,
          });
        }
      }

      // Approval email is now sent by the DB trigger (email_student_on_approval)
      // after both payment and slot matching are confirmed (matched_at IS NOT NULL).
      // Sending it here would be premature (before matching) and cause duplicates.
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
