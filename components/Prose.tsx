export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-4 text-slate-700 leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:pt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-slate-200 [&_td]:py-2 [&_td]:pr-3 [&_th]:text-left [&_th]:pb-2 [&_a]:text-brand-600 [&_a]:underline">
      {children}
    </article>
  );
}
