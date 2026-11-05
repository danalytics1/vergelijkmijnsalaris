"use client";

import { useState } from "react";

export default function DeleteButton({ id, deleteKey }: { id: string; deleteKey: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done") return <p className="text-sm text-lime font-medium">✓ Je gegevens zijn definitief verwijderd.</p>;
  return (
    <button
      className="btn !py-2 text-sm bg-transparent text-red-400 ring-1 ring-red-400/40 hover:bg-red-500/10"
      disabled={state === "busy"}
      onClick={async () => {
        if (!confirm("Weet je zeker dat je je gegevens definitief wilt verwijderen?")) return;
        setState("busy");
        const r = await fetch(`/api/submissions/${id}?k=${encodeURIComponent(deleteKey)}`, { method: "DELETE" });
        setState(r.ok ? "done" : "error");
      }}
    >
      {state === "error" ? "Verwijderen mislukt, probeer opnieuw" : "Verwijder mijn gegevens"}
    </button>
  );
}
