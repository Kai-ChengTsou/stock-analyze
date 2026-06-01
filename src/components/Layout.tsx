import { Bell, Blocks, BriefcaseBusiness, Factory, Home, Newspaper, Route, Search, Target } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { dailyReport } from '../data/report';

const navItems = [
  { to: '/dashboard', label: '總覽', icon: Home },
  { to: '/news', label: '新聞', icon: Newspaper },
  { to: '/themes', label: '主題', icon: Blocks },
  { to: '/supply-chain', label: '供應鏈', icon: Factory },
  { to: '/beneficiaries', label: '受惠', icon: Target },
  { to: '/company-research', label: '公司', icon: Search },
  { to: '/watchlist', label: '清單', icon: Bell },
  { to: '/idea-pipeline', label: '脈絡', icon: Route },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-white/10 bg-[#0a0f18]/90 p-5 lg:block">
        <Brand />
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <SideNavLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:ml-64 lg:px-8">
        <div className="mb-5 lg:hidden">
          <Brand />
        </div>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080b12]/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-8 gap-1">
          {navItems.map((item) => (
            <BottomNavLink key={item.to} {...item} />
          ))}
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
        <p className="text-sm font-semibold text-white">AI 股票研究儀表板</p>
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

function BottomNavLink({ to, label, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={to}
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
