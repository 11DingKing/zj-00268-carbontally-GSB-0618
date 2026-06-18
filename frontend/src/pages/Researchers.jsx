import { useEffect, useState } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";

function generationOf(joinYear) {
  if (!joinYear) return { name: "未知", color: "bg-gray-100 text-gray-600" };
  if (joinYear < 1965) return { name: "第一代 · 拓荒", color: "bg-amber-100 text-amber-800" };
  if (joinYear < 1985) return { name: "第二代 · 守绿", color: "bg-green-100 text-green-800" };
  if (joinYear < 2005) return { name: "第三代 · 兴林", color: "bg-forest-100 text-forest-800" };
  if (joinYear < 2020) return { name: "第四代 · 智慧", color: "bg-emerald-100 text-emerald-800" };
  return { name: "第五代 · 青年", color: "bg-lime-100 text-lime-800" };
}

export default function Researchers() {
  const [researchers, setResearchers] = useState([]);
  const [plotsMap, setPlotsMap] = useState({});
  const [stewardships, setStewardships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/researchers"), api.get("/plots"), api.get("/stewardships")])
      .then(([r, p, s]) => {
        setResearchers(r.data);
        setPlotsMap(Object.fromEntries(p.data.map((x) => [x.id, x])));
        setStewardships(s.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const researcherPlots = (rid) => {
    return stewardships
      .filter((s) => s.researcher_id === rid)
      .map((s) => ({ ...s, plot: plotsMap[s.plot_id] }))
      .sort((a, b) => a.start_year - b.start_year);
  };

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">科研人员 · 守绿人</h1>
        <p className="text-forest-600">
          共 {researchers.length} 位科研工作者，覆盖从建国初期到新世纪的五代务林人。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {researchers.map((r) => {
          const gen = generationOf(r.join_year);
          const stints = researcherPlots(r.id);
          const totalYears = stints.reduce((sum, s) => {
            const end = s.end_year || new Date().getFullYear();
            return sum + (end - s.start_year + 1);
          }, 0);
          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden"
            >
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0"
                    style={{ backgroundColor: r.avatar_color }}
                  >
                    {r.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h2 className="text-xl font-bold text-forest-900">{r.name}</h2>
                      <span className={`generation-badge ${gen.color}`}>{gen.name}</span>
                    </div>
                    <div className="text-sm text-forest-700 font-medium mb-1.5">{r.title}</div>
                    <div className="text-xs text-forest-500 space-y-0.5">
                      <div>🏛️ {r.institution}</div>
                      <div>🔬 专长：{r.specialty}</div>
                      <div>
                        {r.birth_year && <span className="mr-3">🎂 {r.birth_year}年生</span>}
                        {r.join_year && <span>🌲 {r.join_year}年入山</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {r.bio && (
                  <p className="mt-4 p-4 bg-gradient-to-br from-forest-50/60 to-wood-50/40 rounded-xl text-sm text-forest-800 leading-relaxed border border-forest-100/70">
                    &ldquo;{r.bio}&rdquo;
                  </p>
                )}

                <div className="flex gap-3 mt-4 text-sm">
                  <div className="px-3 py-1.5 rounded-full bg-forest-50 text-forest-700 font-medium">
                    📍 负责 {stints.length} 片林地
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    ⏱️ 累计守绿 {totalYears} 年
                  </div>
                </div>
              </div>

              {stints.length > 0 && (
                <div className="border-t border-forest-50 bg-forest-50/30 p-5">
                  <div className="text-xs font-semibold text-forest-700 mb-3">🗂️ 守绿履历</div>
                  <div className="space-y-2.5">
                    {stints.map((s) =>
                      s.plot ? (
                        <Link
                          key={s.id}
                          to={`/plots/${s.plot_id}`}
                          className="block p-3 rounded-xl bg-white border border-forest-100 hover:border-forest-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-wood-600 font-medium mb-0.5">
                                {s.start_year} — {s.end_year || "至今"}
                              </div>
                              <div className="font-semibold text-forest-900 truncate">
                                {s.plot.plot_name}
                              </div>
                              <div className="text-xs text-forest-500 mt-0.5 truncate">
                                {s.role || "管护负责"} · {s.plot.tree_species}
                              </div>
                            </div>
                            <div className="shrink-0 text-forest-400 text-sm">→</div>
                          </div>
                        </Link>
                      ) : null,
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
