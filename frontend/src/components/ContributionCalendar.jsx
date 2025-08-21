import { useMemo } from "react";

export default function ContributionCalendar({
  countsByDate = {},
  weeks = 53,
  startOnSunday = true,
  title = "Activity",
}) {
  const fmtKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const shortMonth = (m) =>
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m];

  const grid = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const dow = today.getDay(); // 0..6 (Sun..Sat)
    const weekStartOffset = startOnSunday ? dow : (dow === 0 ? 6 : dow - 1);
    const lastWeekStart = new Date(today); lastWeekStart.setDate(today.getDate() - weekStartOffset);
    const firstWeekStart = new Date(lastWeekStart); firstWeekStart.setDate(lastWeekStart.getDate() - (weeks - 1) * 7);

    const cols = [];
    for (let w = 0; w < weeks; w++) {
      const colStart = new Date(firstWeekStart); colStart.setDate(firstWeekStart.getDate() + w * 7);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(colStart); d.setDate(colStart.getDate() + i);
        const key = fmtKey(d);
        days.push({ date: d, key, count: countsByDate[key] ?? 0 });
      }
      cols.push({ start: colStart, days });
    }
    return cols;
  }, [countsByDate, weeks, startOnSunday]);

  const monthTextsByIndex = useMemo(() => {
    const map = new Map();
    let lastMonth = -1;
    grid.forEach((col, idx) => {
      const firstOfMonth = col.days.find((c) => c.date.getDate() === 1);
      if (firstOfMonth) {
        const m = firstOfMonth.date.getMonth();
        if (m !== lastMonth) {
          map.set(idx, shortMonth(m));
          lastMonth = m;
        }
      }
    });
    if (map.size === 0 && grid.length) map.set(0, shortMonth(grid[0].days[0].date.getMonth()));
    return map;
  }, [grid]);

  const level = (n) => {
    if (n <= 0) return "bg-base-300/40";
    if (n === 1) return "bg-primary/30";
    if (n <= 3) return "bg-primary/50";
    if (n <= 6) return "bg-primary/70";
    return "bg-primary";
  };

  const weekdayLabels = startOnSunday
    ? ["", "Mon", "", "Wed", "", "Fri", ""]
    : ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="space-y-2">
      <div className="text-sm opacity-70">{title}</div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="inline-block">
          <div className="flex items-start">
            <div className="w-8 shrink-0" />
            <div className="flex gap-[3px] sm:gap-1">
              {grid.map((_, idx) => (
                <div
                  key={`ml-${idx}`}
                  className="w-2.5 sm:w-3.5 h-4 text-[10px] sm:text-xs leading-4"
                >
                  {monthTextsByIndex.get(idx) || ""}
                </div>
              ))}
            </div>
          </div>

          <div className="flex">
            <div className="w-8 shrink-0 mr-1 sticky left-0 z-10">
              <div className="bg-base-100/90 backdrop-blur-sm rounded pr-1">
                <div className="flex flex-col gap-[3px] sm:gap-1 items-end text-[10px] leading-[14px] opacity-60 py-[1px]">
                  {weekdayLabels.map((lbl, i) => (
                    <div key={i} className="h-2.5 sm:h-3.5">{lbl}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-[3px] sm:gap-1">
              {grid.map((col) => (
                <div key={col.start.toISOString()} className="flex flex-col gap-[3px] sm:gap-1">
                  {col.days.map((cell) => (
                    <div
                      key={cell.key}
                      className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded ${level(cell.count)}`}
                      title={`${cell.key}: ${cell.count} update${cell.count === 1 ? "" : "s"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs opacity-60 mt-2 ml-9">
            <span>Less</span>
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-base-300/40" />
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-primary/30" />
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-primary/50" />
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-primary/70" />
            <span className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded bg-primary" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

