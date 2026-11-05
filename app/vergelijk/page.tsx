import type { Metadata } from "next";
import UploadFlow from "@/components/UploadFlow";
import { llmInfo } from "@/lib/llm/provider";

export const metadata: Metadata = { title: "Vergelijk je salaris – VergelijkMijnSalaris" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Vergelijk je salaris</h1>
      <p className="text-fg-muted mb-8">In 3 stappen weet je waar je staat. Je strook wordt na de analyse direct weggegooid en we slaan geen persoonsgegevens op: geen naam, BSN, IBAN, adres of werkgever.</p>
      <UploadFlow euOnly={llmInfo().euOnly} />
    </div>
  );
}
