import { useEffect, useState } from "react";
import api from "../api.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartColors = {
  stock: { bg: "rgba(88, 138, 60, 0.15)", border: "rgb(69, 109, 46)" },
  sink: { bg: "rgba(167, 201, 87, 0.7)", border: "rgb(116, 166, 87)" },
  volume: { bg: "rgba(203, 149, 86, 0.15)", border: "rgb(191, 126, 65)" },
};

export default function PlotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plot, setPlot] = useState(null);
  const [carbon, setCarbon] = useState(null);
  const [stewards, setStewards] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/plots/${id}`),
      api.get(`/plots/${id}/carbon`),
      api.get(`/plots/${id}/stewardship-timeline`),
    ])
      .then(([p, c, s]) => {
        setPlot(p.data);
        setCarbon(c.data);
        setStewards(s.data);
        setFarm({ id: p.data.farm_id });
        api.get(`/farms/${p.data.farm_id}`).then((f) => setFarm(f.data));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;
  if (!plot) return <div className="py-20 text-center text-forest-500">地块不存在</div>;

  const yearly = carbon?.yearly_results || [];
  const years = yearly.map((y) => y.year);
  const standAge = new Date().getFullYear() - plot.planting_year;
  const dataQuality = carbon?.data_quality || null;

  const stockData = {
    labels: years,
    datasets: [
      {
        label: "碳储量 (tC)",
        data: yearly.map((y) => y.carbon_stock_t),
        borderColor: chartColors.stock.border,
        backgroundColor: chartColors.stock.bg,
        tension: 0.35,
        fill: true,
        pointRadius: yearly.map((y) => (y.data_quality === "measured" ? 4 : 6)),
        pointHoverRadius: 6,
        pointStyle: yearly.map((y) =>
          y.data_quality === "measured"
            ? "circle"
            : y.data_quality === "corrected"
              ? "triangle"
              : "rectRot",
        ),
        pointBackgroundColor: yearly.map((y) =>
          y.data_quality === "measured"
            ? chartColors.stock.border
            : y.data_quality === "corrected"
              ? "#e6a23c"
              : "#909399",
        ),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2.5,
        spanGaps: false,
      },
      {
        label: "活立木蓄积 (m³)",
        data: yearly.map((y) => y.volume_m3),
        borderColor: chartColors.volume.border,
        backgroundColor: chartColors.volume.bg,
        tension: 0.35,
        fill: true,
        pointRadius: yearly.map((y) => (y.data_quality === "measured" ? 3 : 5)),
        pointStyle: yearly.map((y) =>
          y.data_quality === "measured"
            ? "circle"
            : y.data_quality === "corrected"
              ? "triangle"
              : "rectRot",
        ),
        pointBackgroundColor: yearly.map((y) =>
          y.data_quality === "measured"
            ? chartColors.volume.border
            : y.data_quality === "corrected"
              ? "#e6a23c"
              : "#909399",
        ),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2,
        yAxisID: "y1",
        spanGaps: false,
      },
    ],
  };

  const sinkData = {
    labels: years,
    datasets: [
      {
        label: "碳增汇 (tC/年)",
        data: yearly.map((y) => y.carbon_sink_t),
        backgroundColor: yearly.map((y) =>
          y.data_quality === "measured"
            ? chartColors.sink.bg
            : y.data_quality === "corrected"
              ? "rgba(230, 162, 60, 0.7)"
              : "rgba(144, 147, 153, 0.7)",
        ),
        borderColor: yearly.map((y) =>
          y.data_quality === "measured"
            ? chartColors.sink.border
            : y.data_quality === "corrected"
              ? "#e6a23c"
              : "#909399",
        ),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          padding: 16,
          color: "#2e4522",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(38, 58, 30, 0.92)",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#588a3c", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f0f7ec" },
        ticks: { color: "#588a3c", font: { size: 11 } },
        beginAtZero: true,
      },
    },
  };

  const stockOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        position: "left",
        title: {
          display: true,
          text: "碳储量 (tC)",
          color: "#456d2e",
          font: { size: 12 },
        },
        grid: { color: "#f0f7ec" },
        ticks: { color: "#588a3c" },
        beginAtZero: true,
      },
      y1: {
        position: "right",
        title: {
          display: true,
          text: "蓄积 (m³)",
          color: "#bf7e41",
          font: { size: 12 },
        },
        grid: { drawOnChartArea: false },
        ticks: { color: "#bf7e41" },
        beginAtZero: true,
      },
    },
    interaction: { mode: "index", intersect: false },
  };

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-forest-600 hover:text-forest-800 mb-4 flex items-center gap-1"
      >
        ← 返回
      </button>

      <div className="bg-white rounded-2xl p-8 shadow-card border border-forest-50 mb-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-forest-100 text-forest-700">
                {plot.plot_code}
              </span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-wood-100 text-wood-700">
                {plot.tree_species}
              </span>
              {farm && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  {farm.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-forest-900 mb-2">{plot.plot_name}</h1>
            <p className="text-sm text-forest-600">
              {plot.notes || "这片林子承载着几代务林人的心血。"}
            </p>
          </div>
          <Link
            to={`/data-entry?plotId=${plot.id}`}
            className="px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 shadow-md"
          >
            ✏️ 更新长势 / 录入数据
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <InfoCell label="造林年份" value={`${plot.planting_year}年`} />
          <InfoCell label="林龄" value={`${standAge} 年`} />
          <InfoCell label="面积" value={`${plot.area_hectare} 公顷`} />
          <InfoCell label="海拔" value={plot.elevation ? `${plot.elevation} m` : "-"} />
          <InfoCell label="土壤类型" value={plot.soil_type || "-"} />
          <InfoCell
            label="初植密度"
            value={plot.initial_density ? `${plot.initial_density} 株/hm²` : "-"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <MetricCard
          label="当前碳储量"
          value={carbon?.total_carbon_stock_t || 0}
          unit="tC"
          color="forest"
        />
        <MetricCard
          label="累计碳增汇"
          value={carbon?.total_carbon_sink_t || 0}
          unit="tC"
          color="emerald"
        />
        <MetricCard
          label="年均碳增汇"
          value={carbon?.avg_annual_sink_t || 0}
          unit="tC/年"
          color="lime"
        />
        <MetricCard
          label="活立木蓄积"
          value={carbon?.total_stand_volume_m3 || 0}
          unit="m³"
          color="wood"
        />
      </div>

      {dataQuality && (dataQuality.has_missing_data || dataQuality.has_anomalies) && (
        <div className="mb-6">
          <DataQualityAlert quality={dataQuality} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-forest-900">📈 碳储量与蓄积量变化</h3>
            <DataLegend />
          </div>
          <div className="h-[340px]">
            {yearly.length > 0 ? <Line data={stockData} options={stockOptions} /> : <EmptyChart />}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-forest-900">⬆️ 逐年碳增汇</h3>
            <DataLegend />
          </div>
          <div className="h-[340px]">
            {yearly.length > 0 ? <Bar data={sinkData} options={commonOptions} /> : <EmptyChart />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-4">📋 逐年核算台账</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-forest-500 border-b border-forest-100">
                  <th className="py-3 px-3 text-left">年份</th>
                  <th className="py-3 px-3 text-right">林龄</th>
                  <th className="py-3 px-3 text-right">蓄积 (m³)</th>
                  <th className="py-3 px-3 text-right">总生物量 (t)</th>
                  <th className="py-3 px-3 text-right">碳储量 (tC)</th>
                  <th className="py-3 px-3 text-right">碳增汇 (tC)</th>
                  <th className="py-3 px-3 text-right">单位增汇 (tC/hm²)</th>
                </tr>
              </thead>
              <tbody>
                {yearly.map((y) => (
                  <tr
                    key={y.year}
                    className={`border-b border-forest-50 hover:bg-forest-50/40 ${
                      y.data_quality === "corrected"
                        ? "bg-amber-50/30"
                        : y.data_quality === "interpolated"
                          ? "bg-gray-50/30"
                          : ""
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-forest-800">{y.year}</span>
                        {y.data_quality !== "measured" && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              y.data_quality === "corrected"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {y.data_quality === "corrected" ? "异常修正" : "插值补全"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-forest-600">{y.stand_age}</td>
                    <td className="py-3 px-3 text-right text-wood-700 font-medium">
                      {y.volume_m3.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-forest-600">
                      {y.biomass_total_t.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-forest-800 font-bold">
                      {y.carbon_stock_t.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {y.carbon_sink_t > 0 ? "+" : ""}
                      {y.carbon_sink_t.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right text-forest-500">
                      {y.carbon_sink_per_ha_t.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
          <h3 className="text-lg font-bold text-forest-900 mb-4">🤝 守护者更替</h3>
          {stewards && stewards.stewards && stewards.stewards.length > 0 ? (
            <div className="relative">
              <div className="timeline-line" />
              <div className="space-y-5">
                {stewards.stewards.map((s) => (
                  <div key={s.stewardship_id} className="relative pl-14">
                    <div
                      className="absolute left-[14px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md ring-2"
                      style={{
                        backgroundColor: s.avatar_color,
                        boxShadow: "0 0 0 2px #bdd9aa",
                      }}
                    />
                    <div className="bg-forest-50/70 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-forest-900">{s.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded-full text-forest-600">
                          {s.title}
                        </span>
                      </div>
                      <div className="text-xs text-wood-700 mb-2 font-medium">
                        {s.start_year} — {s.end_year || "至今"}
                        {s.role && <span className="text-forest-600 ml-2">· {s.role}</span>}
                      </div>
                      {s.key_achievements && (
                        <div className="text-xs text-forest-700 bg-white rounded-lg p-2 leading-relaxed">
                          🌟 {s.key_achievements}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-forest-400 text-center py-12">暂无守护者记录</div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-forest-50/50 border border-forest-100">
      <div className="text-xs text-forest-500 mb-1">{label}</div>
      <div className="font-bold text-forest-800">{value}</div>
    </div>
  );
}

function MetricCard({ label, value, unit, color }) {
  const colorMap = {
    forest: { text: "text-forest-700", bg: "bg-forest-50", icon: "🌱" },
    emerald: { text: "text-emerald-700", bg: "bg-emerald-50", icon: "⬆️" },
    lime: { text: "text-lime-700", bg: "bg-lime-50", icon: "📈" },
    wood: { text: "text-wood-700", bg: "bg-wood-50", icon: "🪵" },
  }[color];
  return (
    <div className={`${colorMap.bg} rounded-2xl p-5 border border-white shadow-soft`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-forest-600">{label}</div>
        <div className="text-xl">{colorMap.icon}</div>
      </div>
      <div className="text-2xl font-bold text-forest-900">
        {Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}
        <span className={`text-sm font-medium ${colorMap.text} ml-1.5`}>{unit}</span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-forest-400">
      暂无长势数据，无法绘制图表
    </div>
  );
}

function DataQualityAlert({ quality }) {
  const completeness = (quality.data_completeness * 100).toFixed(0);
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <div className="font-bold text-amber-800 mb-2">数据质量提示</div>
          <div className="text-sm text-amber-700 space-y-1.5">
            {quality.has_missing_data && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <span>
                  存在 <b>{quality.interpolated_years}</b> 年缺失数据，已通过线性插值补全
                </span>
              </div>
            )}
            {quality.has_anomalies && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  检测到 <b>{quality.corrected_years}</b> 年异常数据（蓄积量异常下降），已自动修正
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200/50 mt-2">
              <span className="text-amber-600">数据完整度：</span>
              <div className="flex-1 max-w-[180px] h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="font-bold text-amber-800">{completeness}%</span>
            </div>
          </div>
          <div className="text-xs text-amber-600 mt-3">
            💡 建议：及时补全缺失年份的实地调查数据，以获得更准确的碳汇核算结果
          </div>
        </div>
      </div>
    </div>
  );
}

function DataLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-forest-600">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-forest-700 border border-white shadow-sm" />
        <span>实测</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-amber-500" />
        <span>修正</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rotate-45 bg-gray-400 border border-white shadow-sm" />
        <span>插值</span>
      </div>
    </div>
  );
}
