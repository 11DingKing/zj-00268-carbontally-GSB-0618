import { useEffect, useState } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";

function StatCard({ label, value, unit, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-forest-600 mb-2">{label}</div>
          <div className="text-3xl font-bold text-forest-900">
            {typeof value === "number"
              ? value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })
              : value}
            {unit && <span className="text-base font-medium text-forest-500 ml-1.5">{unit}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [summary, setSummary] = useState({
    plots: [],
    farms: [],
    species: [],
    researchers: [],
    stewardships: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/carbon/all"),
      api.get("/farms"),
      api.get("/summary/by-species"),
      api.get("/researchers"),
      api.get("/stewardships"),
    ])
      .then(([plots, farms, species, researchers, stewardships]) => {
        setSummary({
          plots: plots.data,
          farms: farms.data,
          species: species.data,
          researchers: researchers.data,
          stewardships: stewardships.data,
        });
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const totalArea = summary.plots.reduce((s, p) => s + p.area_hectare, 0);
  const totalStock = summary.plots.reduce((s, p) => s + p.total_carbon_stock_t, 0);
  const totalSink = summary.plots.reduce((s, p) => s + p.total_carbon_sink_t, 0);
  const totalVolume = summary.plots.reduce((s, p) => s + p.total_stand_volume_m3, 0);
  const topPlots = [...summary.plots]
    .sort((a, b) => b.total_carbon_stock_t - a.total_carbon_stock_t)
    .slice(0, 5);

  if (loading) {
    return <div className="py-20 text-center text-forest-500">正在加载数据...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">人工林碳增汇核算 · 总览</h1>
        <p className="text-forest-600">
          {summary.farms.length} 个林场，{summary.plots.length}{" "}
          片人工林，记录了几代务林人接续奋斗的绿色足迹。
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="人工林总面积"
          value={totalArea}
          unit="公顷"
          icon="🌳"
          color="bg-forest-100 text-forest-700"
        />
        <StatCard
          label="活立木总蓄积"
          value={totalVolume}
          unit="m³"
          icon="📐"
          color="bg-wood-100 text-wood-700"
        />
        <StatCard
          label="现有碳储量"
          value={totalStock}
          unit="tC"
          icon="🌱"
          color="bg-green-50 text-green-700"
        />
        <StatCard
          label="累计碳增汇"
          value={totalSink}
          unit="tC"
          icon="⬆️"
          color="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-7 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-forest-900">碳储量 Top 5 地块</h2>
            <Link to="/plots" className="text-sm text-forest-600 hover:text-forest-800">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-3">
            {topPlots.map((p, idx) => (
              <Link key={p.plot_id} to={`/plots/${p.plot_id}`} className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      idx === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : idx === 1
                          ? "bg-gray-100 text-gray-600"
                          : idx === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-forest-50 text-forest-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-forest-900 truncate">{p.plot_name}</div>
                    <div className="text-xs text-forest-500 mt-0.5">
                      {p.farm_name} · {p.tree_species} · {p.planting_year}年造 · {p.area_hectare}{" "}
                      公顷
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-forest-700">
                      {p.total_carbon_stock_t.toFixed(1)}{" "}
                      <span className="text-xs font-normal">tC</span>
                    </div>
                    <div className="text-xs text-emerald-600 mt-0.5">
                      年均增汇 {p.avg_annual_sink_t.toFixed(1)} tC
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-forest-900">按树种 · 碳储量</h2>
            <Link to="/summary" className="text-sm text-forest-600 hover:text-forest-800">
              统计 →
            </Link>
          </div>
          <div className="space-y-4">
            {summary.species.slice(0, 6).map((s) => {
              const maxStock = Math.max(...summary.species.map((x) => x.total_carbon_stock_t));
              const pct = (s.total_carbon_stock_t / maxStock) * 100;
              return (
                <div key={s.tree_species}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-forest-800">{s.tree_species}</span>
                    <span className="text-forest-600">{s.total_carbon_stock_t.toFixed(0)} tC</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-forest-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-7 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-forest-900">守绿人 · 代代相传</h2>
            <Link to="/researchers" className="text-sm text-forest-600 hover:text-forest-800">
              全部人员 →
            </Link>
          </div>
          <div className="space-y-3">
            {summary.researchers.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-forest-50/50 transition-colors"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md"
                  style={{ backgroundColor: r.avatar_color }}
                >
                  {r.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-forest-900">
                    {r.name}
                    <span className="text-xs ml-2 text-forest-500 font-normal">{r.title}</span>
                  </div>
                  <div className="text-xs text-forest-600 truncate mt-0.5">
                    {r.institution} · {r.specialty}
                  </div>
                </div>
                {r.join_year && (
                  <div className="text-xs text-wood-600 shrink-0 bg-wood-50 px-2.5 py-1 rounded-full font-medium">
                    {r.join_year}年入山
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-forest-900">林场概览</h2>
            <Link to="/summary" className="text-sm text-forest-600 hover:text-forest-800">
              详细汇总 →
            </Link>
          </div>
          <div className="space-y-4">
            {summary.farms.map((f) => {
              const farmPlots = summary.plots.filter((p) => p.farm_name === f.name);
              const stock = farmPlots.reduce((s, p) => s + p.total_carbon_stock_t, 0);
              const area = farmPlots.reduce((s, p) => s + p.area_hectare, 0);
              return (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-forest-100 bg-gradient-to-r from-forest-50/50 to-transparent"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-forest-900">{f.name}</div>
                      <div className="text-xs text-forest-500 mt-0.5">
                        {f.region} · {f.established_year}年建场
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-forest-700">
                        {stock.toFixed(0)} <span className="text-xs font-normal">tC</span>
                      </div>
                      <div className="text-xs text-forest-500">
                        {farmPlots.length} 片林 · {area.toFixed(1)} hm²
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-forest-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
