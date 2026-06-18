import { useEffect, useState, useMemo } from "react";
import api, { batchAPI } from "../api.js";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [allPlots, setAllPlots] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddPlots, setShowAddPlots] = useState(false);
  const [selectedPlotIds, setSelectedPlotIds] = useState([]);
  const [filterFarm, setFilterFarm] = useState("");
  const [plotKeyword, setPlotKeyword] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  async function loadBatch() {
    try {
      const res = await batchAPI.get(id);
      setBatch(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    Promise.all([batchAPI.get(id), api.get("/plots"), api.get("/farms")])
      .then(([b, p, f]) => {
        setBatch(b.data);
        setAllPlots(p.data);
        setFarms(f.data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f]));
  const membershipPlotIds = useMemo(
    () => new Set((batch?.memberships || []).map((m) => m.plot_id)),
    [batch],
  );

  const availablePlots = useMemo(() => {
    return allPlots.filter((p) => {
      if (membershipPlotIds.has(p.id)) return false;
      if (filterFarm && p.farm_id !== Number(filterFarm)) return false;
      if (plotKeyword) {
        const kw = plotKeyword.toLowerCase();
        if (
          !p.plot_name.toLowerCase().includes(kw) &&
          !p.plot_code.toLowerCase().includes(kw) &&
          !p.tree_species.toLowerCase().includes(kw)
        )
          return false;
      }
      return true;
    });
  }, [allPlots, membershipPlotIds, filterFarm, plotKeyword]);

  function togglePlot(plotId) {
    setSelectedPlotIds((ids) =>
      ids.includes(plotId) ? ids.filter((i) => i !== plotId) : [...ids, plotId],
    );
  }

  async function handleAddPlots() {
    if (selectedPlotIds.length === 0) return;
    try {
      await batchAPI.addPlots(id, selectedPlotIds);
      await loadBatch();
      setShowAddPlots(false);
      setSelectedPlotIds([]);
    } catch (err) {
      alert("添加失败：" + (err.response?.data?.detail || err.message));
    }
  }

  async function handleRemovePlot(plotId, plotName) {
    if (!confirm(`确定要从批次中移除「${plotName}」吗？`)) return;
    try {
      await batchAPI.removePlots(id, [plotId]);
      await loadBatch();
    } catch (err) {
      alert("移除失败：" + (err.response?.data?.detail || err.message));
    }
  }

  async function handleRemoveSelected(plotIds) {
    if (plotIds.length === 0) return;
    if (!confirm(`确定要从批次中移除选中的 ${plotIds.length} 片地块吗？`)) return;
    try {
      await batchAPI.removePlots(id, plotIds);
      await loadBatch();
    } catch (err) {
      alert("移除失败：" + (err.response?.data?.detail || err.message));
    }
  }

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  if (!batch) {
    return (
      <div className="py-20 text-center">
        <div className="text-forest-500 mb-4">批次不存在</div>
        <Link to="/batches" className="text-forest-600 hover:text-forest-800 font-medium">
          ← 返回批次列表
        </Link>
      </div>
    );
  }

  const memberships = batch.memberships || [];

  function toggleMember(plotId) {
    setSelectedMembers((ids) =>
      ids.includes(plotId) ? ids.filter((i) => i !== plotId) : [...ids, plotId],
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/batches"
          className="text-sm text-forest-600 hover:text-forest-800 font-medium inline-flex items-center gap-1"
        >
          ← 返回批次列表
        </Link>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 via-forest-50 to-emerald-50 rounded-2xl p-7 shadow-card border border-emerald-100 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl">📦</span>
              <span className="text-sm px-3 py-1 rounded-full bg-white text-emerald-700 font-semibold shadow-sm">
                {batch.batch_code}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-forest-900">{batch.batch_name}</h1>
            {batch.description && (
              <p className="text-forest-600 mt-2 max-w-2xl">{batch.description}</p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-forest-500 hover:text-forest-700 text-sm"
          >
            ✏️ 编辑基本信息
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <InfoCard label="核证时段" value={`${batch.start_year} — ${batch.end_year}`} icon="📅" />
          <InfoCard label="纳入地块" value={`${batch.plot_count} 片`} icon="🗺️" />
          <InfoCard label="总面积" value={`${batch.total_area_hectare.toFixed(1)} hm²`} icon="📐" />
          <InfoCard
            label="时段碳增汇"
            value={`${batch.total_carbon_sink_t.toLocaleString("zh-CN", {
              maximumFractionDigits: 1,
            })} tC`}
            icon="⚡"
            highlight
          />
          <InfoCard
            label="创建时间"
            value={new Date(batch.created_at).toLocaleDateString("zh-CN")}
            icon="🕐"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-forest-900">
          🗂️ 纳入地块明细
          <span className="ml-2 text-sm font-normal text-forest-500">
            共 {memberships.length} 片
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {selectedMembers.length > 0 && (
            <button
              onClick={() => handleRemoveSelected(selectedMembers)}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
            >
              批量移除 ({selectedMembers.length})
            </button>
          )}
          <button
            onClick={() => setShowAddPlots(true)}
            className="px-5 py-2 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 shadow-md"
          >
            + 添加地块
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-forest-50/80">
              <tr className="text-xs text-forest-500">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4 text-left">地块编号</th>
                <th className="py-3 px-4 text-left">地块名称</th>
                <th className="py-3 px-4 text-left">所属林场</th>
                <th className="py-3 px-4 text-left">树种</th>
                <th className="py-3 px-4 text-right">造林年</th>
                <th className="py-3 px-4 text-right">面积 (hm²)</th>
                <th className="py-3 px-4 text-right">{batch.start_year}年碳储量 (tC)</th>
                <th className="py-3 px-4 text-right">{batch.end_year}年碳储量 (tC)</th>
                <th className="py-3 px-4 text-right">⚡ 时段增汇 (tC)</th>
                <th className="py-3 px-4 text-right">占比</th>
                <th className="py-3 px-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m, _idx) => {
                const pct =
                  batch.total_carbon_sink_t > 0
                    ? (m.carbon_sink_t / batch.total_carbon_sink_t) * 100
                    : 0;
                const checked = selectedMembers.includes(m.plot_id);
                return (
                  <tr
                    key={m.id}
                    className={`border-b border-forest-50 transition-colors ${
                      checked ? "bg-emerald-50/60" : "hover:bg-forest-50/40"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(m.plot_id)}
                        className="w-4 h-4 accent-forest-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/plots/${m.plot_id}`}
                        className="text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-mono hover:bg-forest-200"
                      >
                        {m.plot_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-forest-900 whitespace-nowrap">
                      <Link to={`/plots/${m.plot_id}`} className="hover:text-forest-600">
                        {m.plot_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-forest-600 whitespace-nowrap">{m.farm_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-wood-100 text-wood-700 text-xs font-medium">
                        {m.tree_species}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-forest-600">{m.planting_year}</td>
                    <td className="py-3 px-4 text-right text-wood-700 font-medium">
                      {m.area_hectare.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-forest-600">
                      {m.carbon_stock_start_t.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-forest-800 font-medium">
                      {m.carbon_stock_end_t.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold ${
                          m.carbon_sink_t >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {m.carbon_sink_t >= 0 ? "+" : ""}
                        {m.carbon_sink_t.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-2 bg-forest-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-forest-500 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-forest-600 font-mono w-10 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemovePlot(m.plot_id, m.plot_name)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan="12" className="py-16 text-center text-forest-400">
                    <div className="text-4xl mb-2">🗺️</div>
                    批次中还没有地块，点击右上角「添加地块」开始纳入
                  </td>
                </tr>
              )}
            </tbody>
            {memberships.length > 0 && (
              <tfoot>
                <tr className="bg-forest-50 border-t-2 border-forest-200 text-sm font-bold">
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-forest-800" colSpan="5">
                    合 计
                  </td>
                  <td className="py-3 px-4 text-right text-wood-700">
                    {batch.total_area_hectare.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-forest-600">
                    {memberships.reduce((s, m) => s + m.carbon_stock_start_t, 0).toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-forest-800">
                    {memberships.reduce((s, m) => s + m.carbon_stock_end_t, 0).toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700">
                    {batch.total_carbon_sink_t.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-forest-600">100%</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showAddPlots && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-forest-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-forest-900">➕ 添加地块到批次</h3>
              <button
                onClick={() => {
                  setShowAddPlots(false);
                  setSelectedPlotIds([]);
                }}
                className="text-forest-400 hover:text-forest-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 border-b border-forest-50 bg-forest-50/30 flex flex-wrap items-center gap-3">
              <div className="min-w-[180px]">
                <div className="text-xs text-forest-500 mb-1">筛选林场</div>
                <select
                  value={filterFarm}
                  onChange={(e) => setFilterFarm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-forest-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-300 text-sm"
                >
                  <option value="">全部林场</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs text-forest-500 mb-1">搜索地块</div>
                <input
                  type="text"
                  placeholder="名称 / 编号 / 树种"
                  value={plotKeyword}
                  onChange={(e) => setPlotKeyword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-forest-200 bg-white focus:outline-none focus:ring-2 focus:ring-forest-300 text-sm"
                />
              </div>
              <div className="text-sm text-forest-600 pt-5">
                可选 <b>{availablePlots.length}</b> 片 · 已选{" "}
                <b className="text-emerald-600">{selectedPlotIds.length}</b> 片
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-white sticky top-0 border-b border-forest-100">
                  <tr className="text-xs text-forest-500">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4 text-left">地块编号</th>
                    <th className="py-3 px-4 text-left">地块名称</th>
                    <th className="py-3 px-4 text-left">林场</th>
                    <th className="py-3 px-4 text-left">树种</th>
                    <th className="py-3 px-4 text-right">造林年</th>
                    <th className="py-3 px-4 text-right">面积 (hm²)</th>
                  </tr>
                </thead>
                <tbody>
                  {availablePlots.map((p) => {
                    const checked = selectedPlotIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => togglePlot(p.id)}
                        className={`border-b border-forest-50 cursor-pointer transition-colors ${
                          checked ? "bg-emerald-50/70 hover:bg-emerald-50" : "hover:bg-forest-50/40"
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="w-4 h-4 accent-forest-600"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-mono">
                            {p.plot_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-forest-800">{p.plot_name}</td>
                        <td className="py-2.5 px-4 text-forest-600">{farmMap[p.farm_id]?.name}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-wood-100 text-wood-700 text-xs font-medium">
                            {p.tree_species}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">{p.planting_year}</td>
                        <td className="py-2.5 px-4 text-right text-wood-700">
                          {p.area_hectare.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                  {availablePlots.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-forest-400">
                        没有更多可选地块（已全部纳入批次）
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-forest-100 bg-forest-50/30 flex items-center gap-3">
              <button
                onClick={() => setSelectedPlotIds(availablePlots.map((p) => p.id))}
                className="px-4 py-2 rounded-lg bg-white border border-forest-200 text-forest-700 text-sm font-medium hover:bg-forest-50"
              >
                全选
              </button>
              <button
                onClick={() => setSelectedPlotIds([])}
                className="px-4 py-2 rounded-lg bg-white border border-forest-200 text-forest-700 text-sm font-medium hover:bg-forest-50"
              >
                清空
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setShowAddPlots(false);
                  setSelectedPlotIds([]);
                }}
                className="px-5 py-2.5 rounded-lg bg-forest-50 text-forest-700 text-sm font-medium hover:bg-forest-100"
              >
                取消
              </button>
              <button
                onClick={handleAddPlots}
                disabled={selectedPlotIds.length === 0}
                className="px-6 py-2.5 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 shadow-md disabled:bg-forest-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                确认添加 ({selectedPlotIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon, highlight }) {
  return (
    <div
      className={`rounded-xl p-4 ${
        highlight
          ? "bg-white shadow-md border border-emerald-200"
          : "bg-white/70 border border-white"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-forest-500 mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-lg font-bold ${highlight ? "text-emerald-700" : "text-forest-800"}`}>
        {value}
      </div>
    </div>
  );
}
