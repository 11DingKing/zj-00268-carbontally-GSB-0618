import { useEffect, useState } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";

export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [farms, setFarms] = useState([]);
  const [carbons, setCarbons] = useState([]);
  const [filterFarm, setFilterFarm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/plots"), api.get("/farms"), api.get("/carbon/all")])
      .then(([p, f, c]) => {
        setPlots(p.data);
        setFarms(f.data);
        setCarbons(c.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const carbonMap = Object.fromEntries(carbons.map((c) => [c.plot_id, c]));
  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f]));
  const speciesOptions = [...new Set(plots.map((p) => p.tree_species))];

  const filtered = plots.filter((p) => {
    if (filterFarm && p.farm_id !== Number(filterFarm)) return false;
    if (filterSpecies && p.tree_species !== filterSpecies) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (
        !p.plot_name.toLowerCase().includes(kw) &&
        !p.plot_code.toLowerCase().includes(kw) &&
        !p.tree_species.toLowerCase().includes(kw)
      )
        return false;
    }
    return true;
  });

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">人工林地块</h1>
        <p className="text-forest-600">
          共 {plots.length} 片人工林，涵盖 {speciesOptions.length} 个树种
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-forest-50 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs text-forest-500 mb-1">搜索</div>
          <input
            type="text"
            placeholder="地块名称 / 编号 / 树种"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-300"
          />
        </div>
        <div className="min-w-[160px]">
          <div className="text-xs text-forest-500 mb-1">林场</div>
          <select
            value={filterFarm}
            onChange={(e) => setFilterFarm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-300"
          >
            <option value="">全部林场</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <div className="text-xs text-forest-500 mb-1">树种</div>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-forest-100 focus:outline-none focus:ring-2 focus:ring-forest-300"
          >
            <option value="">全部树种</option>
            {speciesOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-forest-500">筛选结果：{filtered.length} 片</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const c = carbonMap[p.id] || {};
          const farm = farmMap[p.farm_id];
          const standAge = new Date().getFullYear() - p.planting_year;
          return (
            <Link
              key={p.id}
              to={`/plots/${p.id}`}
              className="group bg-white rounded-2xl p-6 shadow-card border border-forest-50 hover:shadow-lg hover:border-forest-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-forest-100 text-forest-700 mb-2">
                    {p.plot_code}
                  </div>
                  <div className="font-bold text-lg text-forest-900 group-hover:text-forest-700 truncate">
                    {p.plot_name}
                  </div>
                </div>
                <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center text-3xl">
                  🌲
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                <div>
                  <div className="text-forest-500 text-xs">所属林场</div>
                  <div className="text-forest-800 font-medium truncate">{farm?.name}</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">树种</div>
                  <div className="text-forest-800 font-medium">{p.tree_species}</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">造林年份</div>
                  <div className="text-forest-800 font-medium">{p.planting_year}年</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">林龄</div>
                  <div className="text-forest-800 font-medium">{standAge} 年</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">面积</div>
                  <div className="text-forest-800 font-medium">{p.area_hectare} 公顷</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">海拔</div>
                  <div className="text-forest-800 font-medium">{p.elevation || "-"} m</div>
                </div>
              </div>

              {c.yearly_results && c.yearly_results.length > 0 && (
                <div className="border-t border-forest-50 pt-4 mt-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-forest-50/60">
                      <div className="text-xl font-bold text-forest-700">
                        {c.total_carbon_stock_t?.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-forest-500 mt-0.5">碳储量 tC</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/70">
                      <div className="text-xl font-bold text-emerald-700">
                        {c.avg_annual_sink_t?.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">年均增汇 tC</div>
                    </div>
                    <div className="p-3 rounded-xl bg-wood-50/60">
                      <div className="text-xl font-bold text-wood-700">
                        {c.total_stand_volume_m3?.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-wood-600 mt-0.5">蓄积 m³</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-forest-600 mt-4 text-right group-hover:text-forest-800 font-medium">
                查看详情与碳汇趋势 →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
