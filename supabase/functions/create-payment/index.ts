import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PaymentItem = {
  title: string;
  quantity: number;
  unit_price: number;
};

type PaymentRequest = {
  orderId: string;
  items: PaymentItem[];
  total: number;
  payerEmail?: string;
  notificationUrl?: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Mercado Pago não configurado no servidor." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as PaymentRequest;
  if (!body.orderId || !body.items?.length || !Number.isFinite(body.total)) {
    return new Response(JSON.stringify({ error: "Dados do pedido inválidos." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const origin = request.headers.get("origin") ?? "https://analiosburguer.vercel.app";
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_reference: body.orderId,
      items: body.items,
      payer: body.payerEmail ? { email: body.payerEmail } : undefined,
      back_urls: {
        success: `${origin}/pedido-confirmado?status=success&pedido=${encodeURIComponent(body.orderId)}`,
        pending: `${origin}/pedido-confirmado?status=pending&pedido=${encodeURIComponent(body.orderId)}`,
        failure: `${origin}/pedido-confirmado?status=failure&pedido=${encodeURIComponent(body.orderId)}`,
      },
      auto_return: "approved",
      notification_url: body.notificationUrl,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Mercado Pago recusou a preferência.", details: result }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    id: result.id,
    checkoutUrl: result.init_point,
    sandboxUrl: result.sandbox_init_point,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
