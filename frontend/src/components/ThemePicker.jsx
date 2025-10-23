import { useMemo } from "react";
function ThemeTile({ theme, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(theme);
        }
      }}
      aria-pressed={selected}
      aria-label={`Use ${theme} theme`}
      className={[
        "border outline-2 outline-offset-2 outline-transparent",
        "rounded-lg overflow-hidden w-full text-left",
        "border-base-content/20 hover:border-base-content/40",
        selected ? "outline-base-content" : "",
        "transition focus:outline-base-content"
      ].join(" ")}
    >
      <div data-theme={theme} className="bg-base-100 text-base-content w-full cursor-pointer font-sans">
        <div className="grid grid-cols-5 grid-rows-3">
          <div className="bg-base-200 col-start-1 row-start-1 row-span-2" />
          <div className="bg-base-300 col-start-1 row-start-3" />
          <div className="bg-base-100 col-start-2 col-span-4 row-start-1 row-span-3 flex flex-col gap-1 p-2">
            <div className="font-bold capitalize text-sm">{theme}</div>
            <div className="flex flex-wrap gap-1">
              <div className="bg-primary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                <div className="text-primary-content text-xs font-bold">A</div>
              </div>
              <div className="bg-secondary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                <div className="text-secondary-content text-xs font-bold">A</div>
              </div>
              <div className="bg-accent flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                <div className="text-accent-content text-xs font-bold">A</div>
              </div>
              <div className="bg-neutral flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                <div className="text-neutral-content text-xs font-bold">A</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ThemePicker({
  value,
  onChange,
  themes = [
    "light","dark","cupcake","bumblebee","emerald",
    "corporate","synthwave","retro","cyberpunk","valentine",
    "halloween","garden","forest","aqua","lofi",
    "pastel","fantasy","wireframe","black","luxury",
    "dracula","cmyk","autumn","business","acid",
    "lemonade","night","coffee","winter","dim",
    "nord","sunset",
  ],
}) {
  const gridCls = useMemo(() => "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3", []);
  return (
    <div className={gridCls}>
      {themes.map((t) => (
        <ThemeTile key={t} theme={t} selected={t === value} onSelect={onChange} />
      ))}
    </div>
  );
}
