"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPayments } from "@/lib/services/payments";
import { getCourse } from "@/lib/services/courses";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { Payment } from "@/types";

interface PaymentItem {
  payment: Payment;
  courseTitle: string;
}

const STATUS_LABELS: Record<Payment["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  declined: "Rechazado",
  refunded: "Reembolsado",
};

const STATUS_VARIANT: Record<Payment["status"], "default" | "secondary" | "outline"> = {
  pending: "outline",
  approved: "default",
  declined: "secondary",
  refunded: "secondary",
};

export default function EstudianteComprasPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const list = await getPayments({ userId: user!.uid });
        const items = await Promise.all(
          list.map(async (payment) => {
            const course = await getCourse(payment.courseId);
            return { payment, courseTitle: course?.title ?? "Curso" };
          })
        );
        setPayments(items);
      } catch {
        toast.error("Error al cargar el historial de compras");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  async function handleVerify(paymentId: string) {
    setVerifyingId(paymentId);
    try {
      const res = await fetch(`/api/payments/verify?paymentId=${paymentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al verificar pago");

      setPayments((prev) =>
        prev.map((item) =>
          item.payment.id === paymentId
            ? { ...item, payment: { ...item.payment, status: data.status } }
            : item
        )
      );

      if (data.status === "approved") {
        toast.success("¡Pago aprobado! Ya tienes acceso al curso");
      } else if (data.status === "pending") {
        toast.info("El pago aún está pendiente de confirmación");
      } else {
        toast.error(`Estado del pago: ${STATUS_LABELS[data.status as Payment["status"]] ?? data.status}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al verificar pago");
    } finally {
      setVerifyingId(null);
    }
  }

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando compras...</p>;
  }

  return (
    <div>
      <PageHeader title="Mis Compras" description="Historial de pagos y estado de transacciones" />

      {payments.length === 0 ? (
        <EmptyState title="Sin compras" description="Aún no has realizado ninguna compra" />
      ) : (
        <div className="space-y-4">
          {payments.map(({ payment, courseTitle }) => (
            <Card key={payment.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{courseTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ref: {payment.wompi?.reference ?? payment.id}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[payment.status]}>
                  {STATUS_LABELS[payment.status]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  <span className="text-muted-foreground">{formatDateTime(payment.createdAt)}</span>
                  {payment.approvedAt && (
                    <span className="text-muted-foreground">
                      Aprobado: {formatDateTime(payment.approvedAt)}
                    </span>
                  )}
                </div>
                {payment.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifyingId === payment.id}
                    onClick={() => handleVerify(payment.id)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {verifyingId === payment.id ? "Verificando..." : "Verificar pago"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
