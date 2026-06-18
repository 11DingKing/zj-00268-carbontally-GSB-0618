import { useEffect, useState } from "react";
import api from "../api.js";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Title, Tooltip, Legend);

export default function Summary() {
  const [byFarm, setByFarm] = useState([]);
  const [bySpecies, setBySpecies] = useState([]);
  const [allCarbon, setAllCarbon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/summary/by-farm"),
      api.get("/summary/by-species"),
      api.get("/carbon/all"),
    ])
      .then(([f, s, c]) => {
        setByFarm(f.data);
        setBySpecies(s.data);
        setAllCarbon(c.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  const speciesColors = [
    "#456d2e",
    "#588a3c",
    "#74a657",
    "#97c07c",
    "#bdd9aa",
    "#bf7e41",
    "#cb9556",
    "#d9b37c",
    "#e8d2ae",
    "#f4ead8",
  ];

  const doughnutData = {
    labels: bySpecies.map((s) => s.tree_species),
    datasets: [
      {
        label: "碳储量 (tC)",
        data: bySpecies.map((s) => s.total_carbon_stock_t),
        backgroundColor: speciesColors.slice(0, bySpecies.length),
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const farmBarData = {
    labels: byFarm.map((f) =>
      f.farm_name.replace("国营林场", "").replace("省级林场", "").replace("实验林场", ""),
    ),
    datasets: [
      {
        label: "碳储量 (tC)",
        data: byFarm.map((f) => f.total_carbon_stock_t),
        backgroundColor: "rgba(88, 138, 60, 0.78)",
        borderRadius: 8,
        yAxisID: "y",
      },
      {
        label: "累计碳增汇 (tC)",
        data: byFarm.map((f) => f.total_carbon_sink_t),
        backgroundColor: "rgba(167, 201, 87, 0.9)",
        borderRadius: 8,
        yAxisID: "y",
      },
      {
        label: "总面积 (公顷)",
        data: byFarm.map((f) => f.total_area_hectare),
        backgroundColor: "rgba(203, 149, 86, 0.7)",
        borderRadius: 8,
        yAxisID: "y1",
      },
    ],
  };

  const speciesBarData = {
    labels: bySpecies.map((s) => s.tree_species),
    datasets: [
      {
        label: "单位年均碳增汇 (tC/ha·年)",
        data: bySpecies.map((s) =>
          s.total_area_hectare > 0 ? s.avg_annual_sink_t / Math.max(s.plot_count, 1) : 0,
        ),
        backgroundColor: "rgba(56, 86, 39, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">汇总统计</h1>
        <p className="text-forest-600">按林场、按树种维度汇总碳储量与碳增汇</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-4">🌳 按林场 · 碳汇对比</h3>
          <div className="h-[340px]">
            <Bar
              data={farmBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { boxWidth: 12, padding: 12, color: "#2e4522" },
                  },
                  tooltip: {
                    backgroundColor: "rgba(38,58,30,0.9)",
                    cornerRadius: 8,
                    padding: 12,
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#588a3c", font: { size: 11 } },
                  },
                  y: {
                    position: "left",
                    grid: { color: "#f0f7ec" },
                    ticks: { color: "#588a3c" },
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "碳储量/增汇 (tC)",
                      color: "#456d2e",
                      font: { size: 11 },
                    },
                  },
                  y1: {
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: { color: "#bf7e41" },
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "面积 (公顷)",
                      color: "#bf7e41",
                      font: { size: 11 },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-4">🌲 按树种 · 碳储量占比</h3>
          <div className="h-[340px] flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "62%",
                plugins: {
                  legend: {
                    position: "right",
                    labels: {
                      boxWidth: 12,
                      padding: 10,
                      color: "#2e4522",
                      font: { size: 11 },
                    },
                  },
                  tooltip: {
                    backgroundColor: "rgba(38,58,30,0.9)",
                    cornerRadius: 8,
                    padding: 12,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-4">📊 树种 · 平均效率</h3>
          <div className="h-[340px]">
            <Bar
              data={speciesBarData}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(38,58,30,0.9)",
                    cornerRadius: 8,
                    padding: 12,
                  },
                },
                scales: {
                  x: {
                    grid: { color: "#f0f7ec" },
                    ticks: { color: "#588a3c" },
                    beginAtZero: true,
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: "#588a3c", font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-5">🏞️ 林场维度汇总</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-forest-100 text-xs text-forest-500">
                  <th className="py-3 px-3 text-left">林场</th>
                  <th className="py-3 px-3 text-right">地块数</th>
                  <th className="py-3 px-3 text-right">总面积 (hm²)</th>
                  <th className="py-3 px-3 text-right">碳储量 (tC)</th>
                  <th className="py-3 px-3 text-right">累计增汇 (tC)</th>
                  <th className="py-3 px-3 text-right">年均增汇 (tC/年)</th>
                </tr>
              </thead>
              <tbody>
                {byFarm.map((f) => (
                  <tr key={f.farm_id} className="border-b border-forest-50 hover:bg-forest-50/40">
                    <td className="py-3 px-3 font-semibold text-forest-800">{f.farm_name}</td>
                    <td className="py-3 px-3 text-right">{f.plot_count}</td>
                    <td className="py-3 px-3 text-right text-wood-700">
                      {f.total_area_hectare.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-forest-800">
                      {f.total_carbon_stock_t.toLocaleString("zh-CN", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700">
                      {f.total_carbon_sink_t.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right text-forest-600">
                      {f.avg_annual_sink_t.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-forest-50 border-t-2 border-forest-200 text-sm font-bold">
                  <td className="py-3 px-3 text-forest-800">合计 / 平均</td>
                  <td className="py-3 px-3 text-right">
                    {byFarm.reduce((s, f) => s + f.plot_count, 0)}
                  </td>
                  <td className="py-3 px-3 text-right text-wood-700">
                    {byFarm.reduce((s, f) => s + f.total_area_hectare, 0).toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right text-forest-800">
                    {byFarm
                      .reduce((s, f) => s + f.total_carbon_stock_t, 0)
                      .toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700">
                    {byFarm.reduce((s, f) => s + f.total_carbon_sink_t, 0).toFixed(0)}
                  </td>
                  <td className="py-3 px-3 text-right text-forest-600">
                    {(byFarm.reduce((s, f) => s + f.avg_annual_sink_t, 0) / byFarm.length).toFixed(
                      1,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-5">🌿 树种维度汇总</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-forest-100 text-xs text-forest-500">
                  <th className="py-3 px-3 text-left">树种</th>
                  <th className="py-3 px-3 text-right">地块数</th>
                  <th className="py-3 px-3 text-right">总面积 (hm²)</th>
                  <th className="py-3 px-3 text-right">碳储量 (tC)</th>
                  <th className="py-3 px-3 text-right">累计增汇 (tC)</th>
                  <th className="py-3 px-3 text-right">年均增汇 (tC/年)</th>
                </tr>
              </thead>
              <tbody>
                {bySpecies.map((s) => (
                  <tr
                    key={s.tree_species}
                    className="border-b border-forest-50 hover:bg-forest-50/40"
                  >
                    <td className="py-3 px-3 font-semibold text-forest-800">{s.tree_species}</td>
                    <td className="py-3 px-3 text-right">{s.plot_count}</td>
                    <td className="py-3 px-3 text-right text-wood-700">
                      {s.total_area_hectare.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-forest-800">
                      {s.total_carbon_stock_t.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700">
                      {s.total_carbon_sink_t.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right text-forest-600">
                      {s.avg_annual_sink_t.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-lg font-bold text-forest-900">🗂️ 全部地块 · 核算一览表</h3>
          <Link to="/plots" className="text-sm text-forest-600 hover:text-forest-800 font-medium">
            查看地块详情 →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-forest-100 text-xs text-forest-500 whitespace-nowrap">
                <th className="py-3 px-3 text-left">地块编号</th>
                <th className="py-3 px-3 text-left">地块名称</th>
                <th className="py-3 px-3 text-left">林场</th>
                <th className="py-3 px-3 text-left">树种</th>
                <th className="py-3 px-3 text-right">造林年</th>
                <th className="py-3 px-3 text-right">面积 (hm²)</th>
                <th className="py-3 px-3 text-right">蓄积 (m³)</th>
                <th className="py-3 px-3 text-right">碳储量 (tC)</th>
                <th className="py-3 px-3 text-right">累计增汇 (tC)</th>
                <th className="py-3 px-3 text-right">年均增汇 (tC)</th>
              </tr>
            </thead>
            <tbody>
              {allCarbon.map((p) => (
                <tr key={p.plot_id} className="border-b border-forest-50 hover:bg-forest-50/40">
                  <td className="py-2.5 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-mono">
                      {p.plot_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-forest-900 whitespace-nowrap">
                    <Link to={`/plots/${p.plot_id}`} className="hover:text-forest-600">
                      {p.plot_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-forest-600 whitespace-nowrap">{p.farm_name}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-wood-100 text-wood-700 text-xs font-medium">
                      {p.tree_species}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">{p.planting_year}</td>
                  <td className="py-2.5 px-3 text-right text-wood-700">
                    {p.area_hectare.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-wood-800">
                    {p.total_stand_volume_m3.toFixed(0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-forest-800">
                    {p.total_carbon_stock_t.toFixed(0)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {p.total_carbon_sink_t.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-forest-600 font-medium">
                    {p.avg_annual_sink_t.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
