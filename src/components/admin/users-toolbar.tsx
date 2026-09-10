"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { AddUserModal } from "@/components/admin/add-user-modal";

export function UsersToolbar({ teams }: { teams: { id: string; name: string }[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded-[10px] border border-[#C9A24A]/25 bg-[#C9A24A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C9A24A] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/20 active:scale-95"
      >
        <PlusIcon className="h-4 w-4" />
        Agregar Usuario
      </button>
      <AddUserModal open={modalOpen} onClose={() => setModalOpen(false)} teams={teams} />
    </>
  );
}
