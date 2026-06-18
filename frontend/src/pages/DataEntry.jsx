import { useEffect, useState, useMemo } from "react";
import api from "../api.js";
import { Link, useSearchParams } from "react-router-dom";

export default function DataEntry() {
  const [searchParams] = useSearchParams();
  const preSelectedPlot = searchParams.get("plotId");

  const [tab, setTab] = useState("growth");
  const [plots, setPlots] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [speciesParams, setSpeciesParams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlotId, setSelectedPlotId] = useState(preSelectedPlot || "");
  const [existingGrowth, setExistingGrowth] = useState([]);
  const [growthForm, setGrowthForm] = useState({
    record_year: new Date().getFullYear(),
    mean_height_m: "",
    mean_dbh_cm: "",
    volume_per_ha_m3: "",
    mortality_rate: 0.0,
    survey_date: new Date().toISOString().slice(0, 10),
    survey_method: "每木检尺(10%样地)",
    surveyors: "",
    remarks: "",
  });
  const [growthSaved, setGrowthSaved] = useState(null);
  const [growthError, setGrowthError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewCarbon, setPreviewCarbon] = useState(null);

  const [stewForm, setStewForm] = useState({
    plot_id: "",
    researcher_id: "",
    start_year: new Date().getFullYear(),
    end_year: "",
    role: "",
    breeding_work: "",
    management_work: "",
    key_achievements: "",
    handover_notes: "",
  });
  const [stewSaved, setStewSaved] = useState(null);
  const [stewError, setStewError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/plots"), api.get("/researchers"), api.get("/species-params")])
      .then(([p, r, s]) => {
        setPlots(p.data);
        setResearchers(r.data);
        setSpeciesParams(s.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPlotId) {
      setExistingGrowth([]);
      return;
    }
    api
      .get(`/plots/${selectedPlotId}/growth`)
      .then((r) => {
        setExistingGrowth(r.data);
      })
      .catch(console.error);
  }, [selectedPlotId]);

  const currentPlot = useMemo(
    () => plots.find((p) => p.id === Number(selectedPlotId)),
    [plots, selectedPlotId],
  );

  const spInfo = useMemo(() => {
    if (!currentPlot) return null;
    return (
      speciesParams.find(
        (s) => currentPlot.tree_species.includes(s.key) || s.key.includes(currentPlot.tree_species),
      ) || {
        bef: 0.55,
        carbon_fraction: 0.5,
        root_to_shoot: 0.24,
        name: "默认参数",
      }
    );
  }, [speciesParams, currentPlot]);

  function estimateVolume() {
    if (!currentPlot) return;
    const h = parseFloat(growthForm.mean_height_m);
    const d = parseFloat(growthForm.mean_dbh_cm);
    if (!h || !d) return;
    const standAge = parseInt(growthForm.record_year) - currentPlot.planting_year;
    const density = currentPlot.initial_density
      ? currentPlot.initial_density * (1 - 0.005 * standAge)
      : 1500;
    const singleTreeVol = 0.00005 * Math.pow(d, 1.85) * Math.pow(h, 0.9);
    const vol = (singleTreeVol * density * (1 - parseFloat(growthForm.mortality_rate || 0))) / 1;
    setGrowthForm((f) => ({ ...f, volume_per_ha_m3: vol.toFixed(2) }));
  }

  async function handleGrowthSubmit(e) {
    e.preventDefault();
    setGrowthError("");
    setGrowthSaved(null);
    if (!selectedPlotId) {
      setGrowthError("请选择地块");
      return;
    }
    if (!growthForm.record_year) {
      setGrowthError("请填写调查年份");
      return;
    }
    if (!growthForm.volume_per_ha_m3 || parseFloat(growthForm.volume_per_ha_m3) <= 0) {
      setGrowthError("请填写有效的每公顷蓄积量");
      return;
    }
    try {
      const payload = {
        plot_id: Number(selectedPlotId),
        record_year: parseInt(growthForm.record_year),
        mean_height_m: growthForm.mean_height_m ? parseFloat(growthForm.mean_height_m) : null,
        mean_dbh_cm: growthForm.mean_dbh_cm ? parseFloat(growthForm.mean_dbh_cm) : null,
        volume_per_ha_m3: parseFloat(growthForm.volume_per_ha_m3),
        mortality_rate: parseFloat(growthForm.mortality_rate || 0),
        survey_date: growthForm.survey_date || null,
        survey_method: growthForm.survey_method || null,
        surveyors: growthForm.surveyors || null,
        remarks: growthForm.remarks || null,
      };
      const res = await api.post("/growth", payload);
      setGrowthSaved(res.data);
      const latest = await api.get(`/plots/${selectedPlotId}/growth`);
      setExistingGrowth(latest.data);
      const carbon = await api.get(`/plots/${selectedPlotId}/carbon`);
      setPreviewCarbon(carbon.data);
      setShowPreview(true);
    } catch (err) {
      setGrowthError(err.response?.data?.detail || err.message);
    }
  }

  async function handleStewSubmit(e) {
    e.preventDefault();
    setStewError("");
    setStewSaved(null);
    if (!stewForm.plot_id) {
      setStewError("请选择地块");
      return;
    }
    if (!stewForm.researcher_id) {
      setStewError("请选择科研人员");
      return;
    }
    if (!stewForm.start_year) {
      setStewError("请填写起始年份");
      return;
    }
    try {
      const payload = {
        plot_id: Number(stewForm.plot_id),
        researcher_id: Number(stewForm.researcher_id),
        start_year: parseInt(stewForm.start_year),
        end_year: stewForm.end_year ? parseInt(stewForm.end_year) : null,
        role: stewForm.role || null,
        breeding_work: stewForm.breeding_work || null,
        management_work: stewForm.management_work || null,
        key_achievements: stewForm.key_achievements || null,
        handover_notes: stewForm.handover_notes || null,
      };
      const res = await api.post("/stewardships", payload);
      setStewSaved(res.data);
    } catch (err) {
      setStewError(err.response?.data?.detail || err.message);
    }
  }

  async function handleDeleteGrowth(recordId) {
    if (!confirm("确定要删除这条长势记录吗？")) return;
    try {
      await api.delete(`/growth/${recordId}`);
      const latest = await api.get(`/plots/${selectedPlotId}/growth`);
      setExistingGrowth(latest.data);
    } catch (err) {
      alert("删除失败：" + (err.response?.data?.detail || err.message));
    }
  }

  if (loading) return <div className="py-20 text-center text-forest-500">加载中...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest-900 mb-2">数据录入</h1>
        <p className="text-forest-600">
          更新人工林长势数据后，碳储量与碳增汇将根据 BEF 系数自动重新核算。
        </p>
      </div>

      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-soft inline-flex">
        <button
          onClick={() => setTab("growth")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "growth"
              ? "bg-forest-600 text-white shadow"
              : "text-forest-700 hover:bg-forest-50"
          }`}
        >
          🌱 长势 / 碳汇录入
        </button>
        <button
          onClick={() => setTab("stewardship")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "stewardship"
              ? "bg-forest-600 text-white shadow"
              : "text-forest-700 hover:bg-forest-50"
          }`}
        >
          🤝 守绿台账录入
        </button>
        <button
          onClick={() => setTab("method")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "method"
              ? "bg-forest-600 text-white shadow"
              : "text-forest-700 hover:bg-forest-50"
          }`}
        >
          📖 核算方法说明
        </button>
      </div>

      {tab === "growth" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
              <h3 className="text-lg font-bold text-forest-900 mb-4">① 选择地块</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-forest-600 mb-1.5 font-medium">
                    人工林地块
                  </label>
                  <select
                    value={selectedPlotId}
                    onChange={(e) => {
                      setSelectedPlotId(e.target.value);
                      setGrowthSaved(null);
                      setShowPreview(false);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-forest-200 focus:outline-none focus:ring-2 focus:ring-forest-300 bg-white"
                  >
                    <option value="">请选择...</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plot_code} · {p.plot_name} [{p.tree_species} · {p.planting_year}年 ·{" "}
                        {p.area_hectare}公顷]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentPlot && spInfo && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 border border-forest-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-forest-500">树种</div>
                      <div className="font-bold text-forest-800">{currentPlot.tree_species}</div>
                    </div>
                    <div>
                      <div className="text-xs text-forest-500">造林年 / 林龄</div>
                      <div className="font-bold text-forest-800">
                        {currentPlot.planting_year} /{" "}
                        {new Date().getFullYear() - currentPlot.planting_year}年
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-forest-500">面积</div>
                      <div className="font-bold text-forest-800">
                        {currentPlot.area_hectare} 公顷
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-forest-500">BEF 系数</div>
                      <div className="font-bold text-wood-700">
                        {spInfo.bef} · 含碳率 {spInfo.carbon_fraction} · 根茎比{" "}
                        {spInfo.root_to_shoot}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
              <h3 className="text-lg font-bold text-forest-900 mb-4">② 录入本年长势调查数据</h3>
              <form onSubmit={handleGrowthSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <Field label="调查年份 *">
                    <input
                      type="number"
                      value={growthForm.record_year}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          record_year: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="调查日期">
                    <input
                      type="date"
                      value={growthForm.survey_date}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          survey_date: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="调查方式">
                    <input
                      type="text"
                      value={growthForm.survey_method}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          survey_method: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="平均高 (m)">
                    <input
                      type="number"
                      step="0.1"
                      value={growthForm.mean_height_m}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          mean_height_m: e.target.value,
                        })
                      }
                      className={inputCls}
                      placeholder="例如 18.5"
                    />
                  </Field>
                  <Field label="平均胸径 (cm)">
                    <input
                      type="number"
                      step="0.1"
                      value={growthForm.mean_dbh_cm}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          mean_dbh_cm: e.target.value,
                        })
                      }
                      className={inputCls}
                      placeholder="例如 22.3"
                    />
                  </Field>
                  <Field label="死亡率 (%)">
                    <input
                      type="number"
                      step="0.01"
                      value={growthForm.mortality_rate}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          mortality_rate: e.target.value,
                        })
                      }
                      className={inputCls}
                      placeholder="0 ~ 1，如 0.02"
                    />
                  </Field>
                  <Field label="每公顷蓄积量 (m³/hm²) *">
                    <input
                      type="number"
                      step="0.01"
                      value={growthForm.volume_per_ha_m3}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          volume_per_ha_m3: e.target.value,
                        })
                      }
                      className={inputCls + " border-forest-400 ring-1 ring-forest-200"}
                      placeholder="必填，例如 185.5"
                    />
                  </Field>
                  <Field label="调查人员">
                    <input
                      type="text"
                      value={growthForm.surveyors}
                      onChange={(e) =>
                        setGrowthForm({
                          ...growthForm,
                          surveyors: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="调查备注">
                  <textarea
                    rows="2"
                    value={growthForm.remarks}
                    onChange={(e) => setGrowthForm({ ...growthForm, remarks: e.target.value })}
                    className={inputCls}
                    placeholder="特殊天气、异常情况、抚育措施说明等..."
                  />
                </Field>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={estimateVolume}
                    className="px-4 py-2 rounded-lg bg-wood-100 text-wood-700 text-sm font-medium hover:bg-wood-200"
                  >
                    🧮 根据胸径树高估算蓄积
                  </button>
                  <div className="flex-1" />
                  {growthError && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                      {growthError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-forest-600 text-white font-medium hover:bg-forest-700 shadow-md active:scale-[0.98] transition-all"
                  >
                    💾 保存并重算碳汇
                  </button>
                </div>

                {growthSaved && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-semibold text-emerald-800 mb-1">
                      ✅ 长势数据已保存，碳增汇已自动重算！
                    </div>
                    <div className="text-sm text-emerald-700">
                      {growthSaved.record_year} 年数据 · 每公顷蓄积 {growthSaved.volume_per_ha_m3}{" "}
                      m³
                      {currentPlot && (
                        <>
                          {" "}
                          · 全林蓄积 ≈{" "}
                          {(growthSaved.volume_per_ha_m3 * currentPlot.area_hectare).toFixed(1)} m³
                        </>
                      )}
                      <Link to={`/plots/${growthSaved.plot_id}`} className="ml-3 underline">
                        查看碳汇趋势 →
                      </Link>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {existingGrowth.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-forest-900">历史长势记录</h3>
                  <span className="text-xs text-forest-500">共 {existingGrowth.length} 次调查</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-forest-100 text-xs text-forest-500">
                        <th className="py-3 px-3 text-left">年份</th>
                        <th className="py-3 px-3 text-right">树高(m)</th>
                        <th className="py-3 px-3 text-right">胸径(cm)</th>
                        <th className="py-3 px-3 text-right">蓄积(m³/hm²)</th>
                        <th className="py-3 px-3 text-right">死亡率</th>
                        <th className="py-3 px-3 text-left">调查人员</th>
                        <th className="py-3 px-3 text-left">备注</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingGrowth.map((g) => (
                        <tr key={g.id} className="border-b border-forest-50 hover:bg-forest-50/40">
                          <td className="py-2.5 px-3 font-bold text-forest-800">{g.record_year}</td>
                          <td className="py-2.5 px-3 text-right">
                            {g.mean_height_m?.toFixed(1) || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {g.mean_dbh_cm?.toFixed(1) || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-wood-700">
                            {g.volume_per_ha_m3}
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-forest-500">
                            {(g.mortality_rate * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-left text-xs text-forest-600 truncate max-w-[120px]">
                            {g.surveyors || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-left text-xs text-forest-500 truncate max-w-[160px]">
                            {g.remarks || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleDeleteGrowth(g.id)}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {showPreview && previewCarbon ? (
              <div className="space-y-4 sticky top-5">
                {previewCarbon.data_quality &&
                  (previewCarbon.data_quality.has_missing_data ||
                    previewCarbon.data_quality.has_anomalies) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-amber-800 text-sm">数据质量提示</span>
                    </div>
                    <div className="text-xs text-amber-700 space-y-1">
                      {previewCarbon.data_quality.has_missing_data && (
                        <div>
                            存在 <b>{previewCarbon.data_quality.interpolated_years}</b>{" "}
                            年缺失数据，已插值补全
                        </div>
                      )}
                      {previewCarbon.data_quality.has_anomalies && (
                        <div>
                            检测到 <b>{previewCarbon.data_quality.corrected_years}</b>{" "}
                            年异常数据，已自动修正
                        </div>
                      )}
                      <div className="text-amber-600 pt-1">
                          数据完整度：{" "}
                        <b>{(previewCarbon.data_quality.data_completeness * 100).toFixed(0)}%</b>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-emerald-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🔄</span>
                    <h3 className="text-lg font-bold text-forest-900">自动重算结果</h3>
                  </div>
                  <div className="space-y-3 mb-5">
                    <Metric
                      label="更新后碳储量"
                      value={previewCarbon.total_carbon_stock_t}
                      unit="tC"
                      color="emerald"
                    />
                    <Metric
                      label="累计碳增汇"
                      value={previewCarbon.total_carbon_sink_t}
                      unit="tC"
                      color="forest"
                    />
                    <Metric
                      label="年均碳增汇"
                      value={previewCarbon.avg_annual_sink_t}
                      unit="tC/年"
                      color="lime"
                    />
                    <Metric
                      label="活立木蓄积"
                      value={previewCarbon.total_stand_volume_m3}
                      unit="m³"
                      color="wood"
                    />
                  </div>
                  <Link
                    to={`/plots/${previewCarbon.plot_id}`}
                    className="block text-center w-full py-2.5 rounded-lg bg-forest-600 text-white font-medium hover:bg-forest-700 shadow"
                  >
                    查看完整趋势图表 →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-forest-50 to-emerald-50 rounded-2xl p-6 border border-forest-100">
                <h3 className="text-lg font-bold text-forest-800 mb-3">📐 实时核算公式</h3>
                <div className="space-y-3 text-sm text-forest-800">
                  <div className="p-3 bg-white rounded-xl border border-forest-100">
                    <div className="text-xs text-forest-500 mb-1">① 林分蓄积量</div>
                    <div className="font-mono font-semibold">V = v × A</div>
                    <div className="text-xs text-forest-600 mt-1">
                      v = 每公顷蓄积, A = 面积(公顷)
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-forest-100">
                    <div className="text-xs text-forest-500 mb-1">② 总生物量</div>
                    <div className="font-mono font-semibold">B = V × BEF × (1 + R)</div>
                    <div className="text-xs text-forest-600 mt-1">BEF=生物量扩展因子, R=根茎比</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-forest-100">
                    <div className="text-xs text-forest-500 mb-1">③ 碳储量</div>
                    <div className="font-mono font-semibold">C = B × CF</div>
                    <div className="text-xs text-forest-600 mt-1">CF = 含碳率 (通常 0.5)</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-forest-100">
                    <div className="text-xs text-forest-500 mb-1">④ 年度碳增汇</div>
                    <div className="font-mono font-semibold">ΔC = C(t) − C(t−1)</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
              <h3 className="text-lg font-bold text-forest-900 mb-4">🌿 主要树种参数</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {speciesParams.map((s) => (
                  <div
                    key={s.key}
                    className="p-2.5 rounded-lg bg-forest-50/60 hover:bg-forest-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-forest-800">{s.key}</span>
                      <span className="text-xs text-wood-600 font-mono">BEF {s.bef}</span>
                    </div>
                    <div className="text-xs text-forest-600 mt-0.5">{s.name}</div>
                    <div className="text-[10px] text-forest-500 mt-0.5 font-mono">
                      含碳率 {s.carbon_fraction} · 根茎比 {s.root_to_shoot}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "stewardship" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
            <h3 className="text-lg font-bold text-forest-900 mb-5">新增守护者记录</h3>
            <form onSubmit={handleStewSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="地块 *">
                  <select
                    value={stewForm.plot_id}
                    onChange={(e) => setStewForm({ ...stewForm, plot_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">请选择...</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plot_code} · {p.plot_name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="科研人员 *">
                  <select
                    value={stewForm.researcher_id}
                    onChange={(e) =>
                      setStewForm({
                        ...stewForm,
                        researcher_id: e.target.value,
                      })
                    }
                    className={inputCls}
                  >
                    <option value="">请选择...</option>
                    {researchers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="起始年份 *">
                  <input
                    type="number"
                    value={stewForm.start_year}
                    onChange={(e) => setStewForm({ ...stewForm, start_year: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="结束年份 (仍在管护留空)">
                  <input
                    type="number"
                    value={stewForm.end_year}
                    onChange={(e) => setStewForm({ ...stewForm, end_year: e.target.value })}
                    className={inputCls}
                    placeholder="如 2020，留空=至今"
                  />
                </Field>
                <Field label="职务 / 角色" className="md:col-span-2">
                  <input
                    type="text"
                    value={stewForm.role}
                    onChange={(e) => setStewForm({ ...stewForm, role: e.target.value })}
                    className={inputCls}
                    placeholder="如：造林主持、育种负责人、总工程师..."
                  />
                </Field>
                <Field label="选育工作">
                  <textarea
                    rows="3"
                    value={stewForm.breeding_work}
                    onChange={(e) =>
                      setStewForm({
                        ...stewForm,
                        breeding_work: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="种质收集、引种、子代测定、种子园营建等..."
                  />
                </Field>
                <Field label="管护措施">
                  <textarea
                    rows="3"
                    value={stewForm.management_work}
                    onChange={(e) =>
                      setStewForm({
                        ...stewForm,
                        management_work: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="抚育、间伐、修枝、施肥、病虫害防治..."
                  />
                </Field>
                <Field label="主要成就 / 里程碑" className="md:col-span-2">
                  <textarea
                    rows="3"
                    value={stewForm.key_achievements}
                    onChange={(e) =>
                      setStewForm({
                        ...stewForm,
                        key_achievements: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="成果鉴定、发表论文、获奖情况、重要里程碑..."
                  />
                </Field>
                <Field label="交接寄语 (交给下一棒)" className="md:col-span-2">
                  <textarea
                    rows="2"
                    value={stewForm.handover_notes}
                    onChange={(e) =>
                      setStewForm({
                        ...stewForm,
                        handover_notes: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="给后续守绿人的交接注意事项、叮嘱..."
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                {stewError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    {stewError}
                  </div>
                )}
                <div className="flex-1" />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-forest-600 text-white font-medium hover:bg-forest-700 shadow-md"
                >
                  💾 保存台账记录
                </button>
              </div>

              {stewSaved && (
                <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="font-semibold text-emerald-800 mb-1">✅ 台账记录已保存</div>
                  <div className="text-sm text-emerald-700">
                    已登记 · {researchers.find((x) => x.id === stewSaved.researcher_id)?.name}
                    <Link to="/stewardship" className="ml-3 underline">
                      查看完整代际台账 →
                    </Link>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-forest-900">科研人员名单</h3>
              <span className="text-xs text-forest-500">共 {researchers.length} 人</span>
            </div>
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {researchers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-forest-50 hover:bg-forest-50/50 transition-colors"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: r.avatar_color }}
                  >
                    {r.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-forest-900">{r.name}</span>
                      {r.join_year && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-wood-50 text-wood-700 rounded-full">
                          {r.join_year}年入山
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-forest-600 mt-0.5">
                      {r.title} · {r.institution}
                    </div>
                    <div className="text-xs text-forest-500 mt-1 line-clamp-2">{r.specialty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "method" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-7 shadow-card border border-forest-50">
              <h2 className="text-xl font-bold text-forest-900 mb-4">碳储量与碳增汇核算方法</h2>
              <p className="text-forest-700 leading-relaxed mb-4">
                本平台采用 <span className="font-semibold">生物量转换因子法（BEF法）</span>，
                依据《IPCC 2006年国家温室气体清单指南》及《造林项目碳汇计量与监测指南》的推荐方法，
                对人工林碳储量与年度碳增汇进行核算。
              </p>

              <h3 className="text-lg font-bold text-forest-800 mt-6 mb-3">📐 核算步骤</h3>
              <div className="space-y-4">
                <Step num="1" title="林分蓄积量计算">
                  V = v × A，其中 v 为每公顷蓄积量（m³/ha），A 为地块面积（ha）。 v
                  来源于每年的林分调查（每木检尺法）。
                </Step>
                <Step num="2" title="地上生物量估算">
                  B_ag = V × BEF，其中 BEF（生物量扩展因子）为树干生物量到地上总生物量的扩展系数，
                  因树种而异，本平台内置 18 个主要树种的 BEF 值。
                </Step>
                <Step num="3" title="全林生物量（含地下）">
                  B_total = B_ag × (1 + R)，R 为根茎比（地下/地上生物量比）。 一般针叶树
                  R≈0.22~0.24，阔叶树 R≈0.23~0.26。
                </Step>
                <Step num="4" title="植被碳储量">
                  C = B_total × CF，CF 为植物含碳率。 IPCC 默认值为 0.5（即生物量干重中约 50%
                  为碳），本平台采用此默认。
                </Step>
                <Step num="5" title="年度碳增汇">
                  ΔC(t) = C(t) − C(t−1)，即相邻两年度的碳储量之差。
                  正值表示净碳吸收（碳汇），负值表示碳释放（碳源）。
                </Step>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-7 shadow-card border border-forest-50">
              <h3 className="text-xl font-bold text-forest-900 mb-4">📋 数据更新与重算机制</h3>
              <ol className="space-y-3 text-forest-700 leading-relaxed list-decimal list-inside">
                <li>
                  录入/更新某年地块长势调查数据后，该地块所有年度按时间顺序
                  <span className="font-semibold text-emerald-700">自动重算</span>
                  碳储量和增汇。
                </li>
                <li>
                  碳增汇为相邻年份碳储量之差，因此修改某一年的数据，会影响之后所有年份的增汇结果。
                </li>
                <li>所有计算在后端 API 层实时进行，无需人工干预，保证台账与碳汇数据的一致性。</li>
                <li>删除某条长势记录后，后续所有年份重排并重新计算增汇。</li>
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-forest-50">
              <h3 className="text-lg font-bold text-forest-900 mb-4">🌲 树种参数表</h3>
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {speciesParams.map((s) => (
                  <div
                    key={s.key}
                    className="p-3 rounded-xl bg-gradient-to-br from-forest-50/70 to-emerald-50/30 border border-forest-100"
                  >
                    <div className="font-bold text-forest-800">{s.key}</div>
                    <div className="text-xs text-forest-600 mt-0.5">{s.name}</div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                      <div className="bg-white rounded-lg py-1.5">
                        <div className="text-[10px] text-forest-500">BEF</div>
                        <div className="text-sm font-bold text-wood-700">{s.bef}</div>
                      </div>
                      <div className="bg-white rounded-lg py-1.5">
                        <div className="text-[10px] text-forest-500">含碳率</div>
                        <div className="text-sm font-bold text-forest-700">{s.carbon_fraction}</div>
                      </div>
                      <div className="bg-white rounded-lg py-1.5">
                        <div className="text-[10px] text-forest-500">根茎比</div>
                        <div className="text-sm font-bold text-emerald-700">{s.root_to_shoot}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

function Step({ num, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 shrink-0 rounded-full bg-forest-600 text-white font-bold flex items-center justify-center shadow-md">
        {num}
      </div>
      <div className="flex-1 p-4 rounded-xl bg-forest-50/60 border border-forest-100">
        <div className="font-bold text-forest-800 mb-1">{title}</div>
        <div className="text-sm text-forest-700 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color }) {
  const colorMap = {
    forest: ["text-forest-700", "bg-forest-50"],
    emerald: ["text-emerald-700", "bg-emerald-50"],
    lime: ["text-lime-700", "bg-lime-50"],
    wood: ["text-wood-700", "bg-wood-50"],
  }[color];
  return (
    <div className={`p-3.5 rounded-xl ${colorMap[1]} flex items-center justify-between`}>
      <div className={`text-xs font-medium ${colorMap[0]}`}>{label}</div>
      <div className="text-right">
        <span className={`text-lg font-bold ${colorMap[0]}`}>{Number(value).toFixed(1)}</span>
        <span className={`text-xs ml-1 ${colorMap[0]} opacity-80`}>{unit}</span>
      </div>
    </div>
  );
}
