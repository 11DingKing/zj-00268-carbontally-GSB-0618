import { useEffect, useState, useMemo } from "react";
import api, { batchAPI } from "../api.js";
import { Link } from "react-router-dom";

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [plots, setPlots] = useState([]);
  const [farms, setFarms] = useState([]);
  const [carbons, setCarbons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    batch_code: "",
    batch_name: "",
    start_year: new Date().getFullYear() - 5,
    end_year: new Date().getFullYear(),
    description: "",
    plot_ids: [],
  });
  const [formError, setFormError] = useState("");
  const [filterFarm, setFilterFarm] = useState("");
  const [plotKeyword, setPlotKeyword] = useState("");

  useEffect(() => {
    Promise.all([batchAPI.list(), api.get("/plots"), api.get("/farms"), api.get("/carbon/all")])
      .then(([b, p, f, c]) => {
        setBatches(b.data);
        setPlots(p.data);
        setFarms(f.data);
        setCarbons(c.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f]));
  const carbonMap = Object.fromEntries(carbons.map((c) => [c.plot_id, c]));

  const availablePlots = useMemo(() => {
    return plots.filter((p) => {
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
  }, [plots, filterFarm, plotKeyword]);

  const selectedPlotDetails = useMemo(() => {
    return plots.filter((p) => form.plot_ids.includes(p.id));
  }, [plots, form.plot_ids]);

  const estimatedTotal = useMemo(() => {
    if (!form.start_year || !form.end_year) return 0;
    return selectedPlotDetails.reduce((sum, p) => {
      const c = carbonMap[p.id];
      if (!c || !c.yearly_results) return sum;
      let startStock = 0;
      let endStock = 0;
      for (const y of c.yearly_results) {
        if (y.year <= form.start_year) startStock = y.carbon_stock_t;
        if (y.year <= form.end_year) endStock = y.carbon_stock_t;
        if (y.year > form.end_year) break;
      }
      return sum + (endStock - startStock);
    }, 0);
  }, [selectedPlotDetails, form.start_year, form.end_year, carbonMap]);

  function togglePlot(plotId) {
    setForm((f) => ({
      ...f,
      plot_ids: f.plot_ids.includes(plotId)
        ? f.plot_ids.filter((id) => id !== plotId)
        : [...f.plot_ids, plotId],
    }));
  }

  function selectAllPlots() {
    setForm((f) => ({ ...f, plot_ids: availablePlots.map((p) => p.id) }));
  }

  function clearSelectedPlots() {
    setForm((f) => ({ ...f, plot_ids: [] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.batch_code.trim()) {
      setFormError("请填写批次编号");
      return;
    }
    if (!form.batch_name.trim()) {
      setFormError("请填写批次名称");
      return;
    }
    if (form.start_year >= form.end_year) {
      setFormError("开始年份必须小于结束年份");
      return;
    }
    try {
      await batchAPI.create({
        batch_code: form.batch_code.trim(),
        batch_name: form.batch_name.trim(),
        start_year: parseInt(form.start_year),
        end_year: parseInt(form.end_year),
        description: form.description.trim() || null,
        plot_ids: form.plot_ids,
      });
      const latest = await batchAPI.list();
      setBatches(latest.data);
      setShowCreate(false);
      setForm({
        batch_code: "",
        batch_name: "",
        start_year: new Date().getFullYear() - 5,
        end_year: new Date().getFullYear(),
        description: "",
        plot_ids: [],
      });
    } catch (err) {
      setFormError(err.response?.data?.detail || err.message);
    }
  }

  async function handleDelete(batchId, batchName) {
    if (!confirm(`确定要删除批次「${batchName}」吗？此操作不可恢复。`)) return;
    try {
      await batchAPI.remove(batchId);
      setBatches((bs) => bs.filter((b) => b.id !== batchId));
    } catch (err) {
      alert("删除失败：" + (err.response?.data?.detail || err.message));
    }
  }

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest-900 mb-2">核证批次</h1>
          <p className="text-forest-600">
            将若干地块在特定时段的碳增汇打包成核证批次，自动汇总计算批次碳汇总量
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-forest-600 text-white font-medium hover:bg-forest-700 shadow-md active:scale-[0.98] transition-all"
        >
          + 新建核证批次
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-forest-900">📦 新建核证批次</h2>
            <button
              onClick={() => setShowCreate(false)}
              className="text-forest-400 hover:text-forest-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Field label="批次编号 *">
                <input
                  type="text"
                  placeholder="例如 CCER-2025-001"
                  value={form.batch_code}
                  onChange={(e) => setForm({ ...form, batch_code: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="批次名称 *">
                <input
                  type="text"
                  placeholder="例如 青山林场2020-2025核证"
                  value={form.batch_name}
                  onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="开始年份 *">
                <input
                  type="number"
                  value={form.start_year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_year: parseInt(e.target.value) || 0,
                    })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="结束年份 *">
                <input
                  type="number"
                  value={form.end_year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      end_year: parseInt(e.target.value) || 0,
                    })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="备注说明" className="mb-6">
              <textarea
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputCls}
                placeholder="核证范围、方法学、委托方等补充说明..."
              />
            </Field>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-bold text-forest-800">
                  ② 选择纳入批次的地块
                  <span className="ml-2 text-sm font-normal text-forest-500">
                    已选 {form.plot_ids.length} 片 · 预估时段增汇{" "}
                    <span className="font-semibold text-emerald-600">
                      {estimatedTotal.toFixed(1)} tC
                    </span>
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPlots}
                    className="text-xs px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 hover:bg-forest-100"
                  >
                    全选筛选结果
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedPlots}
                    className="text-xs px-3 py-1.5 rounded-lg bg-wood-50 text-wood-700 hover:bg-wood-100"
                  >
                    清空选择
                  </button>
                </div>
              </div>

              <div className="bg-forest-50/50 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
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
                <div className="text-xs text-forest-500 pt-5">
                  共 {availablePlots.length} 片可选
                </div>
              </div>

              <div className="border border-forest-100 rounded-xl overflow-hidden">
                <div className="max-h-[340px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-forest-50 sticky top-0">
                      <tr className="text-xs text-forest-500">
                        <th className="py-2.5 px-3 w-10"></th>
                        <th className="py-2.5 px-3 text-left">地块编号</th>
                        <th className="py-2.5 px-3 text-left">地块名称</th>
                        <th className="py-2.5 px-3 text-left">林场</th>
                        <th className="py-2.5 px-3 text-left">树种</th>
                        <th className="py-2.5 px-3 text-right">造林年</th>
                        <th className="py-2.5 px-3 text-right">面积 (hm²)</th>
                        <th className="py-2.5 px-3 text-right">累计增汇 (tC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availablePlots.map((p) => {
                        const c = carbonMap[p.id] || {};
                        const checked = form.plot_ids.includes(p.id);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => togglePlot(p.id)}
                            className={`border-b border-forest-50 cursor-pointer transition-colors ${
                              checked
                                ? "bg-emerald-50/70 hover:bg-emerald-50"
                                : "hover:bg-forest-50/40"
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                readOnly
                                className="w-4 h-4 accent-forest-600"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-mono">
                                {p.plot_code}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-forest-800">
                              {p.plot_name}
                            </td>
                            <td className="py-2.5 px-3 text-forest-600">
                              {farmMap[p.farm_id]?.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-wood-100 text-wood-700 text-xs font-medium">
                                {p.tree_species}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">{p.planting_year}</td>
                            <td className="py-2.5 px-3 text-right text-wood-700">
                              {p.area_hectare.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                              {c.total_carbon_sink_t?.toFixed(1) || "-"}
                            </td>
                          </tr>
                        );
                      })}
                      {availablePlots.length === 0 && (
                        <tr>
                          <td colSpan="8" className="py-10 text-center text-forest-400">
                            没有符合条件的地块
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                  {formError}
                </div>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-lg bg-forest-50 text-forest-700 font-medium hover:bg-forest-100"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-forest-600 text-white font-medium hover:bg-forest-700 shadow-md active:scale-[0.98] transition-all"
              >
                💾 创建批次并自动核算
              </button>
            </div>
          </form>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-card border border-forest-50 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-forest-800 mb-2">还没有核证批次</h3>
          <p className="text-forest-500 mb-6">
            点击右上角「新建核证批次」，选择地块和时段，开始打包核证
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 rounded-xl bg-forest-600 text-white font-medium hover:bg-forest-700 shadow-md"
          >
            + 新建第一个批次
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {batches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-6 shadow-card border border-forest-50 hover:shadow-lg hover:border-forest-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 mb-2">
                    {b.batch_code}
                  </div>
                  <div className="font-bold text-lg text-forest-900 group-hover:text-forest-700 truncate">
                    {b.batch_name}
                  </div>
                </div>
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-forest-200 flex items-center justify-center text-2xl">
                  📦
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                <div>
                  <div className="text-forest-500 text-xs">核证时段</div>
                  <div className="text-forest-800 font-medium">
                    {b.start_year} — {b.end_year}
                  </div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">地块数量</div>
                  <div className="text-forest-800 font-medium">{b.plot_count} 片</div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">总面积</div>
                  <div className="text-wood-700 font-medium">
                    {b.total_area_hectare.toFixed(1)} 公顷
                  </div>
                </div>
                <div>
                  <div className="text-forest-500 text-xs">创建时间</div>
                  <div className="text-forest-700 text-xs">
                    {new Date(b.created_at).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              </div>

              <div className="border-t border-forest-50 pt-4 mt-4 mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-forest-50 border border-emerald-100">
                  <div className="text-xs text-emerald-600 mb-1">⚡ 时段碳增汇总量</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {b.total_carbon_sink_t.toLocaleString("zh-CN", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    <span className="text-sm font-normal">tC</span>
                  </div>
                </div>
              </div>

              {b.description && (
                <div className="text-xs text-forest-500 mb-4 line-clamp-2">{b.description}</div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Link
                  to={`/batches/${b.id}`}
                  className="flex-1 text-center py-2.5 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-700 shadow-sm"
                >
                  查看详情 →
                </Link>
                <button
                  onClick={() => handleDelete(b.id, b.batch_name)}
                  className="px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-forest-200 focus:outline-none focus:ring-2 focus:ring-forest-300 text-sm";

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs text-forest-600 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}
