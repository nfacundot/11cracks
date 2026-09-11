# 11 CRACKS — Handoff técnico implementable
## Coach · Eleven Score · Racha · PET · Crack Coins · Importaciones · Correcciones

**Objetivo:** que el programador pueda integrar este dominio en `platform-v3` sin depender de mocks ni inventar reglas económicas.

**Stack objetivo:** Next.js 14 App Router + TypeScript estricto + NextAuth/RBAC + Prisma + MySQL 8 + API versionada `/api/v1`.

---

## 0. FUENTES DE VERDAD / DECISIONES CERRADAS

### Plataforma
- Toda entidad de dominio lleva `organizationId`; `clubId` cuando aplica.
- RBAC se valida en servidor; no basta con ocultar botones.
- Los componentes no consultan DB directamente: UI → API/servicio tipado → Prisma.
- Rutas API versionadas `/api/v1/...`.

### Evaluación Coach / Eleven Score
- **Escala pública:** 0–100.
- **Eleven Score v1:** 50% Score Deportivo + 50% Score NeuroCracks.
- **Radar Deportivo vigente (6):** Ofensivo, Defensivo, Técnica, Velocidad, Lectura de juego, Polifuncionalidad.
- **Radar NeuroCracks vigente (6):** Bilingüismo Sport, Liderazgo, Mentalidad, Finanzas Sport, Sostenibilidad, Bienestar.
- **Rúbrica Coach:** No observado = sin puntuación; Requiere acompañamiento=20; En desarrollo=40; Adecuado=60; Destacado=80; Consolidado=100.
- NeuroCracks por dimensión: 50% observación presencial Coach + 50% desempeño digital válido del jugador. La IA puede analizar/corregir lo automatizable, pero no inventa ni sustituye la validación presencial.
- Evaluaciones publicadas son históricas: una corrección crea trazabilidad/versión, no sobrescribe silenciosamente.

### Racha
- La Racha mide **constancia verificable**, no talento absoluto ni abrir la app.
- Pesos iniciales configurables desde Admin:
  - Asistencia 35%
  - NeuroCracks / aprendizaje completado 25%
  - Rutinas o retos verificados 15%
  - Consistencia PET 15%
  - Validaciones completas / sin pendientes críticos 10%
- `Verified Week` puede actuar como llave de recompensas, pero el **umbral exacto queda pendiente**.
- Racha, XP, Eleven Score y Crack Coins son conceptos separados.

### PET
- Mostrar dos mundos: **estimado** para operación/planeación y **validado** para contabilidad.
- Nunca convertir botellas o kg estimados en dinero real.
- Flujo real: Recolección → Lote/Despacho → Pesaje real → Liquidación → Conciliación.
- Documento de compactadora es fuente de verdad para kg reales y COP pagados.
- `precio_real_cop_kg = cop_pagados / kg_reales`.
- El dinero PET entra a 11 Cracks; el club ve aporte/valor PET generado, no saldo retirable.
- Cambios posteriores al cierre quedan auditados.

### Crack Coins
- En la decisión operativa compartida para esta integración, los orígenes que se quieren soportar son **PET** y **resultado de Racha**.
- **NO está aprobada todavía la tasa/fórmula exacta PET→CC ni Racha→CC.**
- El motor debe estar listo pero **no emitir monedas si no existe una regla ACTIVE**.
- Ledger append-only: no editar saldo directo; corrección de monedas = reverso + nuevo movimiento.

---

# 1. ARQUITECTURA DE DOMINIO

```text
Organization
  └─ Club
      ├─ Player
      ├─ Coach
      └─ TrainingSession
          ├─ AttendanceRecord
          ├─ CoachEvaluation
          │   └─ CoachEvaluationItem
          └─ StreakEvidence

Player
  ├─ NeuroDigitalPeriodScore
  ├─ PlayerScoreSnapshot
  ├─ StreakPeriodResult
  ├─ PetContribution
  └─ CrackCoinLedger

PetContribution
  └─ PetBatch
      └─ PetSettlement

Todas las entidades sensibles
  └─ DataCorrection / audit trail

Excel/import
  └─ ImportBatch
      └─ ImportRowError
```

---

# 2. PRINCIPIO CLAVE: GUARDAR HECHOS, NO SOLO RESULTADOS

No guardar únicamente:

```text
racha = 82
coins = 2300
kg = 73
```

Guardar siempre los hechos que permiten reconstruirlos:

```text
asistencia + completados NeuroCracks + retos + PET + validaciones
→ Racha

recolecciones + lote + pesaje + liquidación + conciliación
→ PET real

PET/Racha validado + regla versionada
→ movimientos Crack Coins
```

Así una corrección no rompe el histórico ni obliga a editar saldos manualmente.

---

# 3. FLUJO COACH REAL

## 3.1 Asistencia
Coach marca por jugador:
- `PRESENT`
- `ABSENT`
- `PENDING`

`PENDING` significa todavía no cerrado/no validado y **no debe convertirse en ausencia**.

## 3.2 Evaluación deportiva
Coach selecciona jugador + período y evalúa seis dimensiones vigentes:
- OFFENSIVE
- DEFENSIVE
- TECHNIQUE
- SPEED
- GAME_READING
- POLYFUNCTIONALITY

La UI usa la rúbrica 5 niveles + No observado. No se pide al Coach escribir 0–100 manualmente.

## 3.3 Evaluación NeuroCracks presencial
Coach evalúa:
- BILINGUAL_SPORT
- LEADERSHIP
- MINDSET
- SPORTS_FINANCE
- SUSTAINABILITY
- WELLBEING

La plataforma luego combina cada dimensión NeuroCracks con evidencia digital válida 50/50.

## 3.4 Evidencias para Racha
El Coach **no escribe el score final de Racha**.

La plataforma recibe/deriva evidencias:
- asistencia cerrada;
- actividad NeuroCracks validada;
- reto/rutina verificada;
- actividad PET validada;
- validaciones completas/sin pendientes críticos.

El backend calcula el resultado usando la versión de regla activa.

---

# 4. ELEVEN SCORE — CÁLCULO

## 4.1 Normalización Coach
Rúbrica:

```text
NOT_OBSERVED       → null
NEEDS_SUPPORT      → 20
IN_DEVELOPMENT     → 40
ADEQUATE           → 60
OUTSTANDING        → 80
CONSOLIDATED       → 100
```

**Nunca:** `NOT_OBSERVED → 0`.

## 4.2 Score Deportivo
El esquema permite pesos por dimensión versionados. Si v1 usa pesos iguales, el servicio promedia únicamente dimensiones observadas según la configuración ACTIVE. Si la política exige las 6 completas, se marca `INCOMPLETE`; no se rellena lo faltante.

## 4.3 NeuroCracks por dimensión

```text
neuro_dimension = coach_component * 0.50 + digital_component * 0.50
```

Solo si existen ambas fuentes válidas para esa dimensión. Si falta una fuente, se registra `INCOMPLETE`; no se inventa 0.

## 4.4 Eleven Score

```text
eleven_score = sport_score * 0.50 + neuro_score * 0.50
```

La versión de fórmula debe almacenarse con el snapshot.

---

# 5. RACHA — MOTOR

La Racha usa una regla versionada. No hardcodear pesos en componentes.

## 5.1 Pesos iniciales

```json
{
  "attendance": 0.35,
  "neurocracks": 0.25,
  "challenge": 0.15,
  "pet": 0.15,
  "validation": 0.10
}
```

## 5.2 Estado de cálculo

El resultado debe tener uno de:
- `INCOMPLETE` — faltan componentes o reglas.
- `PREVIEW` — cálculo visible pero aún no final/cerrado.
- `FINAL` — período cerrado y validado.

## 5.3 Subfórmulas

**No todas están cerradas por producto.** El paquete implementa estrategias configurables.

Defaults técnicos que pueden usarse solo como estrategia provisional/configurable:
- Asistencia: `present / (present + absent) * 100`; `pending` queda fuera del denominador.
- NeuroCracks: `validated / assigned * 100`.
- Retos: `validated / assigned * 100`.

Pendientes de decisión de negocio:
- fórmula exacta de consistencia PET → 0–100;
- fórmula exacta de validaciones → 0–100;
- umbral `verified_week`.

Mientras no existan reglas ACTIVE para PET/Validaciones, **no fabricar un score FINAL**. Puede existir `manualOverride` auditado si Owner/Admin decide operar temporalmente con revisión humana.

---

# 6. PET — ESTADOS E INVARIANTES

## 6.1 Recolección
Registra botellas, club, responsable y opcionalmente jugador/sesión.

## 6.2 Lote
Un lote tiene ID/código único y agrupa contribuciones.

Estados sugeridos:
- `DRAFT`
- `SENT`
- `WEIGHED`
- `SETTLED`
- `RECONCILED`
- `CANCELLED`

## 6.3 Invariantes
- `estimatedKg` **nunca** alimenta COP real.
- Para pasar a `WEIGHED`: `realKg > 0` + documento de pesaje.
- Para pasar a `SETTLED`: `realKg > 0` + `copPaid >= 0` + soporte de liquidación/referencia.
- `pricePerKg = copPaid / realKg`.
- Para `RECONCILED`: referencia de pago + actor que concilia + fecha.
- Registro conciliado no se “edita”: se corrige con bitácora y, si aplica, ajuste/reemplazo auditable.

---

# 7. CRACK COINS — LEDGER

## 7.1 Nunca usar saldo mutable como fuente de verdad

Incorrecto:
```ts
player.coins = 2300
```

Correcto:
```sql
SELECT SUM(coin_delta)
FROM crack_coin_ledger
WHERE player_id = ? AND status = 'POSTED';
```

## 7.2 Orígenes
- `PET`
- `STREAK`
- `CORRECTION`

Cada movimiento conserva:
- jugador;
- club/org;
- sourceType;
- sourceId;
- ruleVersion;
- delta;
- idempotencyKey;
- actor/sistema que lo creó;
- corrección/reverso si existe.

## 7.3 Si no hay regla ACTIVE
El motor responde:

```json
{
  "status": "PENDING_RULE",
  "createdLedgerEntry": false
}
```

Nunca asumir `0 CC` como si hubiera una regla aprobada.

---

# 8. IMPORTAR EXCEL SIN ENSUCIAR PRODUCCIÓN

Nunca `Excel → INSERT directo`.

Flujo obligatorio:

```text
UPLOAD
→ IMPORT_BATCH
→ PARSE/STAGING
→ VALIDATE
→ PREVIEW
→ USER CORRECTION
→ APPLY TRANSACTIONALLY
→ RECALCULATE DERIVED DATA
→ AUDIT
```

Cada fila conserva:
- `importBatchId`
- `sourceRowNumber`
- `sourceRowHash/idempotencyKey`

Si se sube dos veces el mismo Excel, no puede duplicar PET, Racha ni Crack Coins.

---

# 9. CORRECCIONES

## Normal data
Se puede corregir con `DataCorrection`, conservando before/after y actor.

## Evaluaciones publicadas
No sobrescribir: publicar versión correctiva con `supersedesEvaluationId`.

## PET conciliado / dinero / Crack Coins
Nunca borrar o reemplazar silenciosamente.

Ejemplo Coin:
```text
original: +100 CC
reversal: -100 CC (reversalOf=original)
replacement: +80 CC
```

Todos apuntan a la misma corrección.

---

# 10. RBAC MÍNIMO

Permisos sugeridos (adaptar a `config/roles.ts` vigente):

```text
evaluation:view_team
evaluation:create
evaluation:publish
evaluation:correct
attendance:manage_team
streak:view_team
streak:recalculate
streak:manage_rules
pet:create_contribution
pet:manage_batch
pet:record_weight
pet:settle
pet:reconcile
coins:view_own
coins:view_team
coins:manage_rules
correction:request
correction:approve
import:create
import:apply
audit:view
```

Scope:
- Player: solo propio.
- Coach: equipos/jugadores autorizados del club/org.
- Admin: organización.
- Super Admin: gobierno global según permisos.

---

# 11. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. Integrar modelos Prisma del fragmento.
2. Migrar DB.
3. Seed de dimensiones, rúbrica y reglas iniciales.
4. Implementar servicio de evaluación + snapshots.
5. Conectar UI Coach `/coach/evaluations`.
6. Implementar asistencia real.
7. Crear productores `StreakEvidence` desde asistencia/Neuro/reto/PET/validaciones.
8. Implementar motor Racha con rule versioning.
9. Implementar flujo PET completo.
10. Implementar import staging Excel.
11. Implementar CoinRule/ledger **sin activar conversiones pendientes**.
12. Implementar correcciones y reversos.
13. Conectar Player Racha/PET/Crack Coins como lectura.
14. QA RBAC, idempotencia, auditoría y multi-tenant.

---

# 12. GATES / PRUEBAS QUE DEBEN PASAR

- Un Coach no puede evaluar jugador de otro scope.
- `NOT_OBSERVED` no baja el score a cero.
- Publicar evaluación crea versión histórica.
- Corrección no destruye evaluación publicada anterior.
- `PENDING` attendance no se convierte en `ABSENT`.
- Abrir la app no genera Racha.
- Duplicar import no duplica eventos ni monedas.
- `estimatedKg` nunca produce `copPaid`.
- Liquidación PET exige `realKg` documentado.
- Conciliación PET exige referencia de pago.
- Coin engine sin regla ACTIVE no emite monedas.
- Duplicar evento PET/Racha no duplica ledger por `idempotencyKey`.
- Reverso de Coin conserva movimiento original.
- Racha con componente pendiente no devuelve score FINAL fabricado.
- Eleven Score no mezcla XP/Racha/Coins.
- Queries filtran siempre `organizationId`; `clubId` cuando aplique.

---

# 13. DECISIONES TODAVÍA PENDIENTES — NO CODEAR COMO CONSTANTE

1. Regla exacta PET → Crack Coins.
2. Regla exacta Racha → Crack Coins.
3. Umbral de `Verified Week`.
4. Fórmula exacta `PET consistency` 0–100 para Racha.
5. Fórmula exacta `Validation component` 0–100 para Racha.
6. Momento exacto de elegibilidad PET para Coin (contribución validada vs lote/pesaje/conciliación), si Coin depende de PET validado.

El esquema y los servicios están preparados para cerrar estas reglas por configuración/versionado sin migrar nuevamente la arquitectura.

---

# 14. ARCHIVOS DEL PACK

- `prisma/schema.fragment.prisma` — modelos listos para fusionar.
- `prisma/seed-domain.ts` — seeds canónicos de dimensiones/rúbrica/rules.
- `src/domain/evaluations/rubric.ts` — mapeo Coach.
- `src/domain/scores/calculate-eleven-score.ts` — cálculo 50/50 con faltantes explícitos.
- `src/domain/streak/calculate-streak.ts` — motor versionado/incompleto seguro.
- `src/domain/pet/pet-invariants.ts` — firewall estimado vs real.
- `src/domain/coins/coin-engine.ts` — ledger/idempotencia y `PENDING_RULE`.
- `src/domain/imports/import-contract.ts` — contrato de staging/import.
- `src/config/domain-rules.ts` — claves/configuración.
- `api/openapi.yaml` — contrato API mínimo.
- `docs/IMPLEMENTATION_CHECKLIST.md` — checklist paso a paso.
- `docs/UNRESOLVED_RULES.md` — decisiones que requieren Owner.
- `tests/ACCEPTANCE_TESTS.md` — QA funcional/adversarial.

