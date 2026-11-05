export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 space-y-4 text-fg-muted leading-relaxed [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-fg [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_h2]:pt-6 [&_strong]:text-fg [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:marker:text-lime [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-line [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:text-left [&_th]:pb-2 [&_th]:text-fg [&_th]:font-mono [&_th]:text-xs [&_th]:font-normal [&_a]:text-lime [&_a]:underline [&_a]:underline-offset-4">
      {children}
    </article>
  );
}
