import type { Metadata } from "next";
import UploadFlow from "@/components/UploadFlow";

export const metadata: Metadata = { title: "Vergelijk je salaris – VergelijkMijnSalaris" };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Vergelijk je salaris</h1>
      <p className="text-slate-600 mb-8">In 3 stappen weet je waar je staat. Je strook wordt niet opgeslagen.</p>
      <UploadFlow />
    </div>
  );
}
