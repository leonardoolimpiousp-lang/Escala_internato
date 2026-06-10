import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex flex-col items-center gap-2">
          <span className="rounded-full border border-green-primary/20 bg-green-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-dark">
            FMUSP
          </span>
          <span className="text-lg font-semibold text-gray-900">
            Escala Internato
          </span>
        </Link>

        <div className="rounded-[--radius-lg] border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 mb-5 text-sm text-gray-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
