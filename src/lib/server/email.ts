import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "noreply@catequesis.online";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Catequesis Online";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada — correo no enviado:", subject, to);
    return false;
  }
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Error enviando:", err);
    return false;
  }
}

function layout(title: string, body: string) {
  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e">
      <h1 style="color:#2d4a7a;font-size:22px;margin-bottom:16px">${title}</h1>
      ${body}
      <p style="margin-top:32px;font-size:12px;color:#666">Catequesis Online — Formación en la fe</p>
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, name: string) {
  return send(
    to,
    "Bienvenido a Catequesis Online",
    layout(
      `¡Hola, ${name}!`,
      `<p>Tu cuenta fue creada correctamente. Ya puedes explorar nuestros programas sacramentales y comenzar tu camino de fe.</p>
       <p><a href="${APP_URL}/estudiante" style="color:#c9a227">Ir a mi panel</a></p>`
    )
  );
}

export async function sendPurchaseEmail(to: string, name: string, courseTitle: string, amount: string) {
  return send(
    to,
    `Compra confirmada: ${courseTitle}`,
    layout(
      "¡Pago recibido!",
      `<p>Hola ${name}, tu pago de <strong>${amount}</strong> por <strong>${courseTitle}</strong> fue confirmado.</p>
       <p>El curso ya está disponible en tu panel.</p>
       <p><a href="${APP_URL}/estudiante/cursos" style="color:#c9a227">Ver mis cursos</a></p>`
    )
  );
}

export async function sendCertificateEmail(to: string, name: string, courseTitle: string) {
  return send(
    to,
    `Certificado listo: ${courseTitle}`,
    layout(
      "¡Felicitaciones!",
      `<p>Hola ${name}, completaste <strong>${courseTitle}</strong> y tu certificado ya está disponible.</p>
       <p><a href="${APP_URL}/estudiante/certificados" style="color:#c9a227">Descargar certificado</a></p>`
    )
  );
}

export async function sendClassReminderEmail(
  to: string,
  name: string,
  classTitle: string,
  scheduledAt: string,
  meetingUrl: string
) {
  return send(
    to,
    `Recordatorio: ${classTitle}`,
    layout(
      "Clase en vivo próxima",
      `<p>Hola ${name}, tienes una clase programada:</p>
       <p><strong>${classTitle}</strong><br/>${scheduledAt}</p>
       <p><a href="${meetingUrl}" style="color:#c9a227">Unirme a la clase</a></p>`
    )
  );
}

export async function sendAssignmentReminderEmail(to: string, name: string, assignmentTitle: string, dueDate: string) {
  return send(
    to,
    `Recordatorio de tarea: ${assignmentTitle}`,
    layout(
      "Tarea próxima a vencer",
      `<p>Hola ${name}, la tarea <strong>${assignmentTitle}</strong> vence el ${dueDate}.</p>
       <p><a href="${APP_URL}/estudiante/tareas" style="color:#c9a227">Ver tareas</a></p>`
    )
  );
}
