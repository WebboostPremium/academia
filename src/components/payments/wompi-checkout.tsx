"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

interface WompiCheckoutProps {
  courseId: string;
  courseTitle: string;
  price: number;
}

export function WompiCheckout({ courseId, courseTitle, price }: WompiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al procesar pago");
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold">{formatCurrency(price)}</p>
      <Button onClick={handleBuy} disabled={loading} className="w-full" size="lg">
        {loading ? "Procesando..." : `Comprar ${courseTitle}`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
