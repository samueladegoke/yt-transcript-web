export function StatCard({ title, value, icon, glowContext = 'info' }) {
    // Map glow context to utility classes
    const glowClass = {
        primary: 'neon-glow-primary',
        info: 'neon-glow-info',
        danger: 'neon-glow-danger'
    }[glowContext] || 'neon-glow-info';

    const titleColor = {
        primary: 'text-primary',
        info: 'text-info',
        danger: 'text-destructive'
    }[glowContext] || 'text-info';

    return (
        <div className={`glassmorphism p-8 rounded-xl ${glowClass} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="scale-150 origin-top-right">{icon}</div>
            </div>
            <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{title}</p>
            <div className="flex items-baseline gap-3">
                <h3 className={`text-5xl font-bold tracking-tighter ${titleColor}`}>{value || '0'}</h3>
            </div>
            <div className="mt-6 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className={`h-full w-full opacity-50 ${glowContext === 'primary' ? 'bg-primary' : glowContext === 'danger' ? 'bg-destructive' : 'bg-info'}`}></div>
            </div>
        </div>
    );
}
