import Link from "next/link";
import { getCaller } from "../../src/lib/trpc/server.js";

export default async function GalleryPage() {
  const scenarios = await getCaller().gallery.list();

  return (
    <main className="flex flex-col gap-8 p-16">
      <h1 className="text-2xl font-semibold">Curated Encounters</h1>
      {scenarios.length === 0 ? (
        <p>No curated scenarios yet — run the seed script.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((row) => (
            <Link href={`/s/${row.id}`} key={row.id}>
              <div className="rounded border border-slate-200 p-4 flex flex-col gap-2 hover:border-teal-600">
                <span className="text-xs font-semibold uppercase text-teal-700">
                  {row.verdict.encounterType}
                </span>
                <p className="text-sm text-slate-700">{row.rationale}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
