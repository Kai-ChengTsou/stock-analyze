import { useState } from 'react';
import { Bell, Blocks, BriefcaseBusiness, Factory, Globe2, Home, Link2, MoreHorizontal, Newspaper, Radar, Route, Search, Target } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { dailyReport } from '../data/report';

const navItems = [
  { to: '/dashboard', label: '總覽', icon: Home },
  { to: '/us-market', label: '美股', icon: Globe2 },
  { to: '/taiwan-market', label: '台股', icon: BriefcaseBusiness },
  { to: '/cross-market', label: '連動', icon: Link2 },
  { to: '/market-radar', label: '雷達', icon: Radar },
  { to: '/news', label: '新聞', icon: Newspaper },
  { to: '/themes', label: '主題', icon: Blocks },
  { to: '/supply-chain', label: '供應鏈', icon: Factory },
  { to: '/beneficiaries', label: '受惠', icon: Target },
  { to: '/company-research', label: '公司', icon: Search },
  { to: '/watchlist', label: '清單', icon: Bell },
  { to: '/idea-pipeline', label: '脈絡', icon: Route },
];

const primaryMobileItems = navItems.filter((item) =>
  ['/dashboard', '/taiwan-market', '/us-market'].includes(item.to),
);

export function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const isPrimaryRoute = primaryMobileItems.some((item) => item.to === location.pathname);

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-white/10 bg-[#0a0f18]/90 p-5 lg:block">
        <Brand />
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] lg:ml-64 lg:px-8 lg:pt-5">
        <div className="mb-5 lg:hidden">
          <Brand />
        </div>
        {children}
      </main>

      {isMobileNavOpen ? (
        <button
          aria-label="收合手機選單"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          type="button"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080b12]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        {isMobileNavOpen ? (
          <div className="mb-2 rounded-2xl border border-white/10 bg-[#0c1220]/95 p-2 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-4 gap-1">
              {navItems.map((item) => (
                <BottomNavLink key={item.to} {...item} onNavigate={() => setIsMobileNavOpen(false)} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-1">
          {primaryMobileItems.map((item) => (
            <BottomNavLink key={item.to} {...item} compact onNavigate={() => setIsMobileNavOpen(false)} />
          ))}
          <button
            type="button"
            className={`flex h-14 flex-col items-center justify-center rounded-lg text-[10px] transition ${
              isMobileNavOpen || !isPrimaryRoute ? 'bg-gradient-to-br from-cyan-300/16 to-violet-300/12 text-cyan-50' : 'text-slate-500'
            }`}
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            <MoreHorizontal className="mb-1 h-4 w-4" />
            <span>更多</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10">
        <BriefcaseBusiness className="h-5 w-5 text-cyan-100" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">全市場研究儀表板</p>
        <p className="text-xs text-slate-400">更新 {dailyReport.date}</p>
      </div>
    </div>
  );
}

function SideNavLink({ to, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          isActive
            ? 'bg-gradient-to-r from-cyan-300/16 via-emerald-300/10 to-violet-300/12 text-cyan-50'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function BottomNavLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: (typeof navItems)[number] & { compact?: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-14 flex-col items-center justify-center rounded-lg text-[10px] transition ${
          isActive ? 'bg-gradient-to-br from-cyan-300/16 to-violet-300/12 text-cyan-50' : 'text-slate-500'
        }`
      }
    >
      <Icon className="mb-1 h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}
