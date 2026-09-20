"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { createImportBatchAction, applyImportBatchAction } from "@/app/actions/import";
import type { ImportWorkspace } from "@/lib/imports/service";

const BATCH_STATUS_LABEL: Record<string, string> = {
  UPLOADED: "Subido",
  PARSED: "Parseado",
  VALIDATED: "Validado",
  READY_TO_APPLY: "Listo para aplicar",
  APPLIED: "Aplicado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado",
};

const BATCH_STATUS_COLOR: Record<string, string> = {
  UPLOADED: "#AAA69C",
  PARSED: "#AAA69C",
  VALIDATED: "#C89B32",
  READY_TO_APPLY: "#7FA65A",
  APPLIED: "#3E9E5C",
  FAILED: "#D2694A",
  CANCELLED: "#D2694A",
};

const ROW_STATUS_LABEL: Record<string, string> = {
  VALID: "Válido",
  WARNING: "Advertencia",
  ERROR: "Error",
  CORRECTED: "Corregido",
  APPLIED: "Aplicado",
};

const ROW_STATUS_COLOR: Record<string, string> = {
  VALID: "#3E9E5C",
  WARNING: "#C89B32",
  ERROR: "#D2694A",
  CORRECTED: "#4A90B8",
  APPLIED: "#7FA65A",
};

export function ImportWorkspace({ view }: { view: ImportWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "errors" | "applied">("all");
  const [importType, setImportType] = useState<string>("pet_contributions");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [clubId, setClubId] = useState("");

  const batches = view.batches.filter((b) => {
    if (filter === "errors") return b.errorRows > 0 && b.status !== "APPLIED";
    if (filter === "applied") return b.status === "APPLIED";
    return true;
  });

  const errorsForBatch = view.errors.filter((e) => e.importBatchId === selectedBatchId);
  const selectedBatch = view.batches.find((b) => b.id === selectedBatchId);

  function notify(kind: "ok" | "error", text: string) { setMessage({ kind, text }); }

  function upload() {
    if (!fileText.trim()) { notify("error", "No hay contenido del archivo."); return; }
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("importType", importType);
    formData.set("fileName", fileName || "import.csv");
    formData.set("fileText", fileText);
    startTransition(async () => {
      try {
        const result = await createImportBatchAction(formData);
        notify("ok", `Lote ${result.batchId.slice(0, 8)}…: ${result.totalRows} filas, ${result.validRows} válidas, ${result.errorRows} con error.`);
        setSelectedBatchId(result.batchId);
        setFileText("");
        setFileName("");
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error al subir archivo.");
      }
    });
  }

  function apply() {
    if (!selectedBatchId) return;
    const formData = new FormData();
    formData.set("batchId", selectedBatchId);
    startTransition(async () => {
      try {
        const result = await applyImportBatchAction(formData);
        notify("ok", `Aplicado: ${result.applied} filas insertadas, ${result.skipped} omitidas.`);
        setSelectedBatchId(null);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error al aplicar.");
      }
    });
  }

  function readAndSetFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileText(reader.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · IMPORTACIONES"
        title="Importación"
        subtitle="Suba un CSV, revise errores, aplique filas válidas con idempotencia por archivo y fila. Duplicar un archivo idéntico no permite re-importar."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Subir archivo
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Tipo</span>
            <select value={importType} onChange={(e) => setImportType(e.target.value)} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              <option value="pet_contributions">pet_contributions</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club (opcional)</span>
            <input value={clubId} onChange={(e) => setClubId(e.target.value)} placeholder="Si vacío, se infiere del contenido" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Archivo CSV</span>
            <input type="file" accept=".csv,.tsv,.txt" onChange={readAndSetFile} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
        </div>
        {fileText ? (
          <p className="mt-2 text-[12px]" style={{ color: S.textSecondary }}>
            Archivo &quot;{fileName}&quot; listo ({fileText.split("\n").length} líneas)
          </p>
        ) : null}
        <button type="button" disabled={isPending || !fileText.trim()} onClick={upload} className="mt-4 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Subir y validar
        </button>
        <p className="mt-2 text-[11px]" style={{ color: S.textSecondary }}>
          Columnas esperadas (Casoinsensible): jugador/playerId (opcional), botellas/bottlesCount (requerido, entero ≥ 0), fecha/recordedAt (requerido, YYYY-MM-DD), kg estimados/estimatedKg (número ≥ 0), notas/notes.
        </p>
        {message ? <p className="mt-3 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Lotes
          </h3>
          <div className="ml-auto flex gap-2">
            {(["all", "errors", "applied"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${filter === f ? "border-[#C9A24A]/60 bg-[#C9A24A]/15" : "border-white/10 bg-transparent hover:bg-white/[0.04]"}`} style={{ fontFamily: S.barlow, color: filter === f ? S.textPrimary : S.textSecondary }}>
                {f === "all" ? "Todos" : f === "errors" ? "Con errores" : "Aplicados"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {batches.length === 0 ? <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin lotes.</p> : null}
          {batches.map((batch) => (
            <article
              key={batch.id}
              className={`cursor-pointer rounded-[10px] border px-4 py-3 transition ${selectedBatchId === batch.id ? "border-[#C9A24A]/40 bg-[#C9A24A]/10" : "border-white/[0.05] bg-black/25 hover:border-white/10"}`}
              onClick={() => setSelectedBatchId(batch.id)}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-medium" style={{ color: S.textPrimary }}>{batch.fileName}</span>
                <span className="rounded-[8px] border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: BATCH_STATUS_COLOR[batch.status] }}>
                  {BATCH_STATUS_LABEL[batch.status] ?? batch.status}
                </span>
                <span className="text-[11px]" style={{ color: S.textSecondary }}>{batch.totalRows} filas</span>
                {batch.errorRows > 0 ? <span className="text-[11px]" style={{ color: "#D2694A" }}>{batch.errorRows} errores</span> : null}
                {batch.appliedAt ? <span className="text-[11px]" style={{ color: S.textSecondary }}>aplicado {batch.appliedAt.toLocaleDateString("es-CO")}</span> : null}
                <span className="ml-auto text-[11px]" style={{ color: S.textSecondary }}>{batch.uploadedBy.slice(0, 8)}…</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedBatch && (
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
              Detalle: {selectedBatch.fileName}
            </h3>
            {selectedBatch.status === "READY_TO_APPLY" ? (
              <button type="button" disabled={isPending} onClick={apply} className="ml-auto rounded-[10px] border border-[#3E9E5C]/40 bg-[#3E9E5C]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#3E9E5C]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: "#3E9E5C" }}>
                Aplicar filas válidas
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {errorsForBatch.length === 0 ? <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin filas registradas.</p> : null}
            {errorsForBatch.map((row) => (
              <div key={row.id} className="flex flex-wrap items-start gap-3 rounded-[8px] border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
                <span className="text-[11px] tabular-nums" style={{ color: S.textSecondary }}>#{row.rowNumber}</span>
                <span className="rounded-[8px] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: ROW_STATUS_COLOR[row.status] }}>
                  {ROW_STATUS_LABEL[row.status] ?? row.status}
                </span>
                {row.errorCode ? <span className="text-[11px]" style={{ color: "#D2694A" }}>{row.errorCode}</span> : null}
                {row.errorMessage ? <span className="text-[11px]" style={{ color: S.textSecondary }}>{row.errorMessage}</span> : null}
                <span className="ml-auto text-[11px]" style={{ color: S.textSecondary }}>{JSON.stringify(row.rawData).slice(0, 120)}</span>
              </div>
            ))}
          </div>
          {selectedBatch.status !== "APPLIED" && selectedBatch.errorRows > 0 ? (
            <p className="mt-3 text-[11px]" style={{ color: S.textSecondary }}>Para aplicar, corrija todas las filas con error subiendo un archivo corregido (mismo contenido produce mismo hash) o corrija manualmente vía la API de corrección.</p>
          ) : null}
        </section>
      )}
    </div>
  );
}