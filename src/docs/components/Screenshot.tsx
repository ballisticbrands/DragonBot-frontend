// A screenshot slot for docs. Until a real image exists, it renders a
// labeled placeholder so the guide reads cleanly. To drop in the real
// screenshot: save the image under public/docs/screenshots/ and pass its
// path as `src` (e.g. src="/docs/screenshots/sign-up.png").
export function Screenshot({ src, alt, caption }: { src?: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full rounded-lg border border-[var(--border)] shadow-sm"
        />
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] p-8 text-center">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Screenshot
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">{alt}</span>
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
