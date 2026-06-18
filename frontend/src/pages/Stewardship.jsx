import { useEffect, useState, useMemo } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";

const GENERATION_NAMES = [
  "第一代 · 拓荒者",
  "第二代 · 守绿人",
  "第三代 · 兴林人",
  "第四代 · 智能务林",
  "第五代 · 青年力量",
];

const GENERATION_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-green-100 text-green-800",
  "bg-forest-100 text-forest-800",
  "bg-emerald-100 text-emerald-800",
  "bg-lime-100 text-lime-800",
];

function generationOfIndex(genIndex) {
  const i = Math.min(Math.max(genIndex, 1), GENERATION_NAMES.length) - 1;
  return { name: GENERATION_NAMES[i], color: GENERATION_COLORS[i] };
}

function HandoverBridge({ current, nextS }) {
  if (!nextS) return null;

  if (current.handover_status === "contiguous") {
    return (
      <div className="relative pl-14 my-1">
        <div className="flex items-center gap-2 text-xs text-forest-500">
          <span className="inline-block w-5 h-px bg-forest-300" />
          <span className="font-medium">
            {current.end_year} → {nextS.start_year} 首尾衔接
          </span>
          <span className="inline-block flex-1 h-px bg-forest-200" />
        </div>
      </div>
    );
  }

  if (current.handover_status === "gap") {
    return (
      <div className="relative pl-14 my-1">
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5 border border-red-200">
          <span className="font-semibold">⚠ 年份空档</span>
          <span>
            {current.end_year + 1}
            {current.gap_years > 1 ? `—${nextS.start_year - 1}` : ""}年无人认领 （空
            {current.gap_years}年）
          </span>
        </div>
      </div>
    );
  }

  if (current.handover_status === "overlap") {
    return (
      <div className="relative pl-14 my-1">
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5 border border-orange-200">
          <span className="font-semibold">⚠ 年份重叠</span>
          <span>
            {nextS.start_year}—{current.end_year}年两人重叠管护
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export default function Stewardship() {
  const [plots, setPlots] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [researcherFilter, setResearcherFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/plots")
      .then((r) => {
        setPlots(r.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (plots.length === 0) return;
    const ids = selectedPlotId ? [Number(selectedPlotId)] : plots.map((p) => p.id);
    Promise.all(ids.map((id) => api.get(`/plots/${id}/stewardship-timeline`)))
      .then((rs) => {
        const data = rs.map((r) => r.data).filter(Boolean);
        setTimelines(data);
      })
      .catch(console.error);
  }, [plots, selectedPlotId]);

  const filteredTimelines = useMemo(() => {
    if (!researcherFilter) return timelines;
    return timelines
      .map((t) => ({
        ...t,
        stewards: t.stewards.filter(
          (s) =>
            s.name.includes(researcherFilter) ||
            (s.role && s.role.includes(researcherFilter)) ||
            (s.key_achievements && s.key_achievements.includes(researcherFilter)),
        ),
      }))
      .filter((t) => t.stewards.length > 0);
  }, [timelines, researcherFilter]);

  const totalStints = timelines.reduce((s, t) => s + t.stewards.length, 0);
  const uniqueResearchers = new Set(timelines.flatMap((t) => t.stewards.map((s) => s.name))).size;
  const totalGapCount = timelines.reduce(
    (s, t) => s + t.stewards.filter((st) => st.handover_status === "gap").length,
    0,
  );
  const totalOverlapCount = timelines.reduce(
    (s, t) => s + t.stewards.filter((st) => st.handover_status === "overlap").length,
    0,
  );

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  const allContiguous = totalGapCount === 0 && totalOverlapCount === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">守护者代际台账</h1>
        <p className="text-forest-600">
          记录了 {uniqueResearchers} 位守绿人，在{" "}
          {timelines.filter((t) => t.stewards.length > 0).length} 片林地上完成了 {totalStints}{" "}
          次接力。
          {allContiguous ? (
            <span className="ml-2 text-emerald-600">✅ 全部代际首尾衔接，无空档无重叠</span>
          ) : (
            <>
              {totalGapCount > 0 && (
                <span className="ml-2 text-red-500">⚠ {totalGapCount} 处年份空档</span>
              )}
              {totalOverlapCount > 0 && (
                <span className="ml-2 text-orange-500">⚠ {totalOverlapCount} 处年份重叠</span>
              )}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="参与地块"
          value={timelines.filter((t) => t.stewards.length > 0).length}
          icon="🗺️"
        />
        <StatCard label="科研人员" value={uniqueResearchers} icon="👥" />
        <StatCard label="接力次数" value={totalStints} icon="🤝" />
        <StatCard label="最长接力代数" value={maxGeneration(timelines)} icon="🌳" />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-forest-50 mb-6 flex flex-wrap items-center gap-4">
        <div className="min-w-[240px] flex-1">
          <div className="text-xs text-forest-500 mb-1">按地块筛选</div>
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-300"
          >
            <option value="">全部地块</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plot_code} · {p.plot_name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <div className="text-xs text-forest-500 mb-1">搜索人员 / 关键词</div>
          <input
            type="text"
            placeholder="姓名、职务、主要成就..."
            value={researcherFilter}
            onChange={(e) => setResearcherFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-300"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredTimelines.length === 0 && (
          <div className="py-16 text-center text-forest-400 bg-white rounded-2xl border border-forest-50">
            暂无符合条件的台账记录
          </div>
        )}
        {filteredTimelines.map((t) => {
          const generationSet = new Set(t.stewards.map((s) => s.generation_index));
          const generationBadges = [...generationSet].sort((a, b) => a - b);
          const plotGaps = t.stewards.filter((s) => s.handover_status === "gap").length;
          const plotOverlaps = t.stewards.filter((s) => s.handover_status === "overlap").length;
          const plotContiguous = plotGaps === 0 && plotOverlaps === 0 && t.stewards.length > 1;
          return (
            <div
              key={t.plot_id}
              className="bg-white rounded-2xl p-6 shadow-card border border-forest-50"
            >
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-forest-100 text-forest-700">
                      {t.plot_code}
                    </span>
                    <Link
                      to={`/plots/${t.plot_id}`}
                      className="text-xl font-bold text-forest-900 hover:text-forest-700"
                    >
                      {t.plot_name}
                    </Link>
                    {plotContiguous && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✅ 代际衔接完好
                      </span>
                    )}
                    {plotGaps > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                        {plotGaps} 处空档
                      </span>
                    )}
                    {plotOverlaps > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                        {plotOverlaps} 处重叠
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-forest-600 mb-2">
                    {t.farm_name} · {t.tree_species} · {t.planting_year}年造 · {t.area_hectare}公顷
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {generationBadges.map((gi) => {
                      const gen = generationOfIndex(gi);
                      return (
                        <span
                          key={gi}
                          className="generation-badge bg-forest-50 text-forest-700 border border-forest-100"
                        >
                          {gen.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Link
                  to={`/plots/${t.plot_id}`}
                  className="text-sm text-forest-600 hover:text-forest-800 font-medium"
                >
                  查看地块详情 →
                </Link>
              </div>

              {t.stewards.length > 0 ? (
                <div className="relative pl-4">
                  <div
                    className="absolute left-[22px] top-2 bottom-2 w-1 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${t.stewards[0]?.avatar_color || "#456d2e"} 0%, ${t.stewards[t.stewards.length - 1]?.avatar_color || "#456d2e"} 100%)`,
                    }}
                  />
                  <div className="space-y-0">
                    {t.stewards.map((s, idx) => {
                      const gen = generationOfIndex(s.generation_index);
                      const nextS = t.stewards[idx + 1];
                      const duration =
                        s.end_year && s.end_year !== s.start_year
                          ? `${s.end_year - s.start_year + 1}年`
                          : s.end_year === s.start_year
                            ? "1年"
                            : `${new Date().getFullYear() - s.start_year + 1}年（进行中）`;
                      return (
                        <div key={s.stewardship_id}>
                          <div className="relative pl-14">
                            <div
                              className="absolute left-0 top-2 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white z-10"
                              style={{ backgroundColor: s.avatar_color }}
                            >
                              {s.name.slice(0, 1)}
                            </div>
                            <div className="bg-gradient-to-br from-forest-50/80 to-white rounded-xl p-5 border border-forest-100">
                              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-lg font-bold text-forest-900">
                                      {s.name}
                                    </span>
                                    <span className={`generation-badge ${gen.color}`}>
                                      {gen.name}
                                    </span>
                                  </div>
                                  <div className="text-sm text-forest-600">
                                    {s.title || "科研人员"} · {s.institution}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-bold text-wood-700 text-lg">
                                    {s.start_year} — {s.end_year || "至今"}
                                  </div>
                                  <div className="text-xs text-wood-600 mt-0.5">
                                    {s.role || "负责管护"} · {duration}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {s.breeding_work && (
                                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                                    <div className="text-xs font-semibold text-amber-800 mb-1">
                                      🌰 选育工作
                                    </div>
                                    <div className="text-amber-900/90 leading-relaxed">
                                      {s.breeding_work}
                                    </div>
                                  </div>
                                )}
                                {s.management_work && (
                                  <div className="p-3 rounded-lg bg-forest-50/70 border border-forest-100">
                                    <div className="text-xs font-semibold text-forest-800 mb-1">
                                      🌿 管护措施
                                    </div>
                                    <div className="text-forest-900/90 leading-relaxed">
                                      {s.management_work}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {s.key_achievements && (
                                <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/40 border border-emerald-200/60">
                                  <div className="text-xs font-semibold text-emerald-800 mb-1">
                                    ⭐ 主要成就
                                  </div>
                                  <div className="text-emerald-900/90 leading-relaxed">
                                    {s.key_achievements}
                                  </div>
                                </div>
                              )}

                              {s.handover_notes && nextS && (
                                <div className="mt-3 p-3 rounded-lg bg-white border-2 border-dashed border-wood-300/60 text-sm">
                                  <div className="text-xs font-semibold text-wood-700 mb-1">
                                    📜 交接寄语（→ {nextS.name}）
                                  </div>
                                  <div className="text-wood-900/80 leading-relaxed italic">
                                    &ldquo;{s.handover_notes}&rdquo;
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <HandoverBridge current={s} nextS={nextS} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-forest-400">
                  该地块尚无守绿台账记录
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-card border border-forest-50 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-forest-50 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-forest-500">{label}</div>
        <div className="text-2xl font-bold text-forest-900">{value}</div>
      </div>
    </div>
  );
}

function maxGeneration(timelines) {
  let max = 0;
  for (const t of timelines) {
    for (const s of t.stewards) {
      if (s.generation_index > max) max = s.generation_index;
    }
  }
  return max;
}
