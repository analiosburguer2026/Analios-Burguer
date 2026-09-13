import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

type PaymentResponse = {
  id?: number;
  status?: string;
  external_reference?: string;
};

function mapStatus(status: string | undefined) {
  if (status === "approved") return "approved";
  if (status === "in_process" || status === "pending") return "in_process";
  if (status === "refunded") return "refunded";
  if (status === "cancelled") return "cancelled";
  return "rejected";
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!accessToken || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Webhook não configurado." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const payload = await request.json() as { type?: string; data?: { id?: string }; action?: string };
  const paymentId = payload.data?.id;
  if (!paymentId || (payload.type && payload.type !== "payment")) return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!paymentResponse.ok) return new Response(JSON.stringify({ error: "Não foi possível consultar o pagamento." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const payment = await paymentResponse.json() as PaymentResponse;
  if (!payment.external_reference) return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: state, error } = await supabase.from("app_state").select("data").eq("key", "orders").maybeSingle();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const ordersData = state?.data && typeof state.data === "object" ? state.data as { orders?: unknown[]; sequence?: number } : {};
  const orders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
  const updatedOrders = orders.map((order) => order && typeof order === "object" && "code" in order && order.code === payment.external_reference
    ? { ...order, paymentStatus: mapStatus(payment.status), paymentId: String(payment.id), updatedAt: new Date().toISOString() }
    : order);
  const update = await supabase.from("app_state").upsert({ key: "orders", data: { ...ordersData, orders: updatedOrders }, updated_at: new Date().toISOString() });
  if (update.error) return new Response(JSON.stringify({ error: update.error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
