import { useEffect } from "react";

export default function ImageGalleryModal({ open, onClose, images = [] }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const count = images.length;

  const containerClass =
    count <= 1
      ? "w-auto max-w-[90vw] max-h-[90vh] p-0"
      : count <= 3
      ? "w-full max-w-3xl max-h-[90vh]"
      : "w-full max-w-5xl max-h-[90vh]";

  const gridCols =
    count <= 1 ? "" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-3 md:grid-cols-4";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className={`bg-base-100 rounded-2xl shadow-xl overflow-hidden ${containerClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-base-300">
            <div className="text-sm opacity-70">{count} image{count > 1 ? "s" : ""}</div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        )}

        <div className={`p-0 ${count > 1 ? "p-3" : ""}`}>
          {count <= 1 ? (
            <img
              src={images[0]}
              alt=""
              className="block max-w-[90vw] max-h-[85vh] object-contain"
            />
          ) : (
            <div className={`grid ${gridCols} gap-3 overflow-auto max-h-[80vh]`}>
              {images.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                  title="Open original"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
