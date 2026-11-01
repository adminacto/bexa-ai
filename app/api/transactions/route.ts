/**
 * BEXA AI — Transactions API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { user, profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("transactions")
      .select(`
        id, transaction_number, type, amount, currency, date, user_id,
        project_id, payment_method, status, description, authorized_creator,
        created_at
      `);

    if (search) {
      query = query.or(
        `transaction_number.ilike.%${search}%,description.ilike.%${search}%,type.ilike.%${search}%`
      );
    }

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: transactions, error: fetchError, count } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Calculate summary (only completed, exclude transfers from revenue)
    const allTxn = (transactions || []) as any[];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const t of allTxn) {
      if (t.status === "completed") {
        if (t.type === "revenue") totalRevenue += t.amount;
        else if (t.type === "expense") totalExpenses += t.amount;
        else if (t.type === "refund") totalRevenue -= t.amount;
        // transfers are NOT counted as revenue or expense
      }
    }

    // Enrich with user and project info
    const enriched = await Promise.all(
      allTxn.map(async (t: any) => {
        let userName: string | undefined;
        if (t.user_id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", t.user_id)
            .single();
          if (userProfile) userName = (userProfile as any).full_name;
        }

        let projectNumber: string | undefined;
        if (t.project_id) {
          const { data: project } = await supabase
            .from("projects")
            .select("project_number")
            .eq("id", t.project_id)
            .single();
          if (project) projectNumber = (project as any).project_number;
        }

        return {
          id: t.id,
          transaction_number: t.transaction_number,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          date: t.date,
          user_id: t.user_id,
          user_name: userName,
          project_id: t.project_id,
          project_number: projectNumber,
          payment_method: t.payment_method,
          status: t.status,
          description: t.description,
          authorized_creator: t.authorized_creator,
          created_at: t.created_at,
        };
      })
    );

    return NextResponse.json({
      transactions: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      },
    });
  } catch (err) {
    console.error("Transactions API error:", err);
    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, supabase, error: authError } = await requireAuth(request, "ADMIN");
  if (authError) {
    return NextResponse.json({ error: authError }, { status: profile ? 403 : 401 });
  }

  const {
    transaction_number,
    type,
    amount,
    currency = "USD",
    date,
    user_id,
    project_id,
    payment_method,
    status = "completed",
    description,
  } = body;

  if (!transaction_number || !type || !amount) {
    return NextResponse.json(
      { error: "Transaction number, type, and amount are required" },
      { status: 400 }
    );
  }

  try {
    // Use a transaction: insert transaction and update project totals atomically
    const { data, error } = await (supabase as any).rpc("create_transaction_with_update", {
      p_transaction_number: transaction_number,
      p_type: type,
      p_amount: parseFloat(amount),
      p_currency: currency,
      p_date: date || new Date().toISOString(),
      p_user_id: user_id || null,
      p_project_id: project_id || null,
      p_payment_method: payment_method || null,
      p_status: status,
      p_description: description || null,
      p_authorized_creator: (profile as any)?.id,
    });

    if (error) {
      // Fallback: direct insert
      const { data: directData, error: directError } = await (supabase as any)
        .from("transactions")
        .insert({
          transaction_number,
          type,
          amount: parseFloat(amount),
          currency,
          date: date || new Date().toISOString(),
          user_id,
          project_id,
          payment_method,
          status,
          description,
          authorized_creator: (profile as any).id,
        })
        .select()
        .single();

      if (directError) {
        return NextResponse.json({ error: directError.message }, { status: 400 });
      }

      // Update project totals if applicable
      if (project_id && status === "completed" && type !== "transfer") {
        const { data: proj } = await supabase
          .from("projects")
          .select("total_revenue, total_expenses")
          .eq("id", project_id)
          .single();

        if (proj) {
          const p = proj as any;
          const update: Record<string, any> = { updated_at: new Date().toISOString() };
          if (type === "revenue") update.total_revenue = p.total_revenue + parseFloat(amount);
          else if (type === "expense") update.total_expenses = p.total_expenses + parseFloat(amount);
          else if (type === "refund") update.total_revenue = p.total_revenue - parseFloat(amount);

          await (supabase as any).from("projects").update(update).eq("id", project_id);
        }
      }

      await (supabase as any).from("activity_log").insert({
        actor_id: (profile as any).id,
        action: "transaction.created",
        entity_type: "transaction",
        entity_id: directData.id,
      });

      return NextResponse.json({ transaction: directData });
    }

    return NextResponse.json({ transaction: data });
  } catch (err) {
    console.error("Create transaction error:", err);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
