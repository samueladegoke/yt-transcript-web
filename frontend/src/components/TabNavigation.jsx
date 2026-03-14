import { FileText, Plug } from 'lucide-react';

const tabs = [
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'mcp', label: 'MCP Integration', icon: Plug },
];

export default function TabNavigation({ activeTab, onTabChange, children }) {
  return (
    <div>
      <nav className="mb-6 flex gap-1 rounded-xl border border-slate-800 bg-[#111111] p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === id
                ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      {children}
    </div>
  );
}
