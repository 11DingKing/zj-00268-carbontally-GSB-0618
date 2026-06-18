import { Routes, Route, NavLink, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Plots from "./pages/Plots.jsx";
import PlotDetail from "./pages/PlotDetail.jsx";
import Stewardship from "./pages/Stewardship.jsx";
import Researchers from "./pages/Researchers.jsx";
import Summary from "./pages/Summary.jsx";
import DataEntry from "./pages/DataEntry.jsx";
import Batches from "./pages/Batches.jsx";
import BatchDetail from "./pages/BatchDetail.jsx";

function NavItem({ to, children, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
          isActive ? "bg-forest-600 text-white shadow-md" : "text-forest-800 hover:bg-forest-100"
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{children}</span>
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-white/80 backdrop-blur border-r border-forest-100 p-5 flex flex-col sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-3 mb-8 px-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center text-white text-2xl shadow-lg">
            🌲
          </div>
          <div>
            <div className="font-bold text-forest-900 leading-tight">青山碳汇</div>
            <div className="text-xs text-forest-600">守绿代际台账</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon="🏞️">
            总览
          </NavItem>
          <NavItem to="/plots" icon="🗺️">
            人工林地块
          </NavItem>
          <NavItem to="/summary" icon="📊">
            汇总统计
          </NavItem>
          <NavItem to="/batches" icon="📦">
            核证批次
          </NavItem>
          <NavItem to="/stewardship" icon="🤝">
            守护者台账
          </NavItem>
          <NavItem to="/researchers" icon="👩‍🔬">
            科研人员
          </NavItem>
          <NavItem to="/data-entry" icon="📝">
            数据录入
          </NavItem>
        </nav>

        <div className="mt-auto pt-6 border-t border-forest-100 text-xs text-forest-500 px-2 leading-relaxed">
          <div className="font-semibold text-forest-700 mb-1">核算口径</div>
          <div>蓄积量 × BEF × (1+根茎比) × 含碳率</div>
          <div className="mt-2 text-forest-400">© {new Date().getFullYear()} 碳汇林业平台</div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-10 py-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plots" element={<Plots />} />
            <Route path="/plots/:id" element={<PlotDetail />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/stewardship" element={<Stewardship />} />
            <Route path="/researchers" element={<Researchers />} />
            <Route path="/data-entry" element={<DataEntry />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
