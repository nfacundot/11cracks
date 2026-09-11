"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";
import { getCertificateOperationsView } from "@/lib/certificates/read-model";
import { appendReviewEvent, nextReviewEventId } from "@/lib/certificates/review-store";

function requiredText(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function certificateConfirmation(formData: FormData): void {
  if (String(formData.get("confirm") ?? "") !== "true") throw new Error("Confirma la operación sensible antes de continuar.");
}

async function certificateContext(formData: FormData) {
  const actor = await requireSection("ADMIN");
  certificateConfirmation(formData);
  const certificateId = requiredText(formData, "certificateId");
  const view = await getCertificateOperationsView();
  const certificate = view.certificates.find((item) => item.id === certificateId);
  if (!certificate) throw new Error("Certificado no encontrado.");
  return { actor, certificate };
}

export async function issueAdminCertificate(formData: FormData) {
  const { actor, certificate } = await certificateContext(formData);
  if (!certificate.eligible) throw new Error("El jugador todavía no es elegible: requiere horas validadas suficientes.");
  if (certificate.status === "ISSUED") throw new Error("Este certificado ya está emitido.");
  const evidenceReference = requiredText(formData, "evidenceReference");
  appendReviewEvent(certificate.playerId, {
    id: nextReviewEventId(),
    status: "ISSUED",
    recordedAt: new Date().toISOString(),
    actor: actor.name,
    actorRole: actor.role,
    reason: "Revisión administrativa aprobada.",
    evidenceReference,
    corrected: false,
  });
  revalidatePath("/admin/certifications");
}

export async function rejectAdminCertificate(formData: FormData) {
  const { actor, certificate } = await certificateContext(formData);
  if (certificate.status === "ISSUED") throw new Error("Un certificado emitido debe corregirse con el flujo de corrección.");
  if (certificate.status === "REJECTED") throw new Error("Este certificado ya está rechazado; usa corrección si el estado debe cambiar.");
  const reason = requiredText(formData, "reason");
  appendReviewEvent(certificate.playerId, {
    id: nextReviewEventId(),
    status: "REJECTED",
    recordedAt: new Date().toISOString(),
    actor: actor.name,
    actorRole: actor.role,
    reason,
    corrected: false,
  });
  revalidatePath("/admin/certifications");
}

export async function correctAdminCertificate(formData: FormData) {
  const { actor, certificate } = await certificateContext(formData);
  const reason = requiredText(formData, "reason");
  const correctedStatus = String(formData.get("correctedStatus") ?? "");
  if (correctedStatus !== "ISSUED" && correctedStatus !== "REJECTED") throw new Error("Estado de corrección no válido.");
  if (correctedStatus === "ISSUED" && !certificate.eligible) throw new Error("No puedes corregir a emitido mientras el jugador no sea elegible.");
  if (!certificate.currentEventId) throw new Error("No existe un evento de certificado para corregir.");
  appendReviewEvent(certificate.playerId, {
    id: nextReviewEventId(),
    status: correctedStatus,
    recordedAt: new Date().toISOString(),
    actor: actor.name,
    actorRole: actor.role,
    reason,
    corrected: true,
  });
  revalidatePath("/admin/certifications");
}