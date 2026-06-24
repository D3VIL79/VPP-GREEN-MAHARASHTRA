import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { plantation_id, action, rejection_reason } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const verifier_id = req.headers.get("x-user-id");  // from JWT (or pass it in body if testing)

  if (action === "approve") {
    // 1. Generate tree_code: VPP-MH-2026-000001
    const { count } = await supabase
      .from("plantations")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified");

    const sequence = String((count ?? 0) + 1).padStart(6, "0");
    const year = new Date().getFullYear();
    const tree_code = `VPP-MH-${year}-${sequence}`;

    // 2. Update plantation
    await supabase.from("plantations").update({
      verification_status: "verified",
      tree_code,
      verified_by: verifier_id,
      verified_on: new Date().toISOString(),
    }).eq("id", plantation_id);

    // 3. Create monitoring schedule (8 cycles over 24 months)
    const plantationDate = new Date();
    const schedules = [3, 6, 9, 12, 15, 18, 21, 24].map((months, i) => ({
      plantation_id,
      cycle: i + 1,
      due_date: new Date(new Date().setMonth(plantationDate.getMonth() + months))
        .toISOString().split("T")[0],
    }));
    await supabase.from("monitoring_schedules").insert(schedules);

    // 4. Award points (100 for plantation verified)
    const plantationRes = await supabase.from("plantations").select("user_id").eq("id", plantation_id).single();
    if (plantationRes.data) {
      await supabase.from("leaderboard_points").insert({
        user_id: plantationRes.data.user_id,
        plantation_id,
        activity_type: "plantation_verified",
        points: 100,
      });
    }

    // 5. Notify user
    const { data: plantation } = await supabase.from("plantations").select("user_id, tree_species(species_name)").eq("id", plantation_id).single();
    if (plantation) {
      await supabase.from("notifications").insert({
        user_id: plantation.user_id,
        title: "🌳 Plantation Verified!",
        message: `Your tree (${tree_code}) has been verified. Start monitoring in 3 months.`,
        notification_type: "plantation_approved",
        reference_id: plantation_id,
      });
    }

    return new Response(JSON.stringify({ success: true, tree_code }), { status: 200 });

  } else if (action === "reject") {
    await supabase.from("plantations").update({
      verification_status: "rejected",
      verified_by: verifier_id,
      verified_on: new Date().toISOString(),
      rejection_reason,
    }).eq("id", plantation_id);

    const { data: plantation } = await supabase.from("plantations").select("user_id").eq("id", plantation_id).single();
    if (plantation) {
      await supabase.from("notifications").insert({
        user_id: plantation.user_id,
        title: "❌ Plantation Rejected",
        message: `Reason: ${rejection_reason}. Please re-submit with a clearer photo.`,
        notification_type: "plantation_rejected",
        reference_id: plantation_id,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
});
