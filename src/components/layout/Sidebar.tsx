import { NavLink, useLocation } from 'react-router-dom';
import { Ticket, Eye, FileText, BookOpen } from 'lucide-react';

const navItems = [
  { path: '/config', label: '券包配置', icon: Ticket },
  { path: '/preview', label: '发放预览', icon: Eye },
  { path: '/summary', label: '活动摘要', icon: FileText },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-ink-900 border-r border-ink-700 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-ink-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-card flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-ink-950" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">券包配置台</h1>
            <p className="text-xs text-ink-500">Coupon Config</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ink-700">
        <div className="p-4 bg-ink-800 rounded-card border border-ink-600">
          <p className="text-xs text-ink-500 mb-2">当前状态</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse-slow"></span>
            <span className="text-sm text-paper-200">系统正常</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
