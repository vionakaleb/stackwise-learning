import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl space-y-4">
      <p className="eyebrow text-sky">404</p>
      <h1 className="text-4xl">That page is not here</h1>
      <p className="leading-relaxed text-cream-muted">
        The link may be out of date, or the concept may have been renamed. The tracks page lists
        everything that exists right now.
      </p>
      <Link
        href="/tracks"
        className="inline-block rounded-panel bg-cream px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-rose"
      >
        Go to tracks
      </Link>
    </div>
  );
}
