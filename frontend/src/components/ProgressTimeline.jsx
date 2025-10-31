export default function ProgressTimeline({
  updates = [],
  onEdit,
  onDelete,
  onOpenImages,
}) {
  const items = [...updates].sort((a, b) =>
    Date.parse(b.date || b.created_at) - Date.parse(a.date || a.created_at)
  );

  const normalizeToBackend = (u) => {
    if (!u) return "";
    try {
      const base = (import.meta?.env?.VITE_API_BASE) || window.location.origin;
      const baseURL = new URL(base, window.location.href);
      const url = new URL(u, baseURL.origin);

      if (url.hostname === baseURL.hostname && !url.port && baseURL.port) {
        url.port = baseURL.port;
      }
      return url.href;
    } catch {
      return u;
    }
  };

  const toUrls = (imgs) =>
    Array.isArray(imgs)
      ? imgs
          .map((x) => (typeof x === "string" ? x : x?.url || x?.image || x?.src))
          .filter(Boolean)
          .map(normalizeToBackend)
      : [];

  const fmtDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  };

  if (!items.length) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <p className="opacity-70 text-sm">No progress updates yet.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((u) => {
        const imgs = toUrls(u.images);
        const displayDate = fmtDate(u.date || u.created_at);

        return (
          <li key={u.id} className="card bg-base-200">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                    {u.title || "Progress update"}
                    {imgs.length > 0 && (
                      <button
                        className="btn btn-ghost btn-xs px-2 py-0 h-auto min-h-0"
                        onClick={() => onOpenImages?.(imgs)}
                        title="View images"
                      >
                        📷 <span className="ml-1 text-xs">{imgs.length}</span>
                      </button>
                    )}
                  </div>
                  {displayDate && (
                    <div className="text-xs opacity-70">{displayDate}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn btn-ghost btn-xs sm:btn-sm"
                    onClick={() => onEdit?.(u)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-error btn-xs sm:btn-sm"
                    onClick={() => onDelete?.(u)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {u.notes && (
                <div className="mt-2">
                  {/<\/?[a-z][\s\S]*>/i.test(u.notes) ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: u.notes }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{u.notes}</p>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
