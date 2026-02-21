export function RiskBadge({ clean, failed }) {
    if (failed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(250,85,56,0.6)]"></span>
                <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">Failed</span>
            </div>
        );
    }
    if (clean) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(31,249,118,0.6)]"></span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Clean</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-info/10 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-info shadow-[0_0_8px_rgba(0,240,255,0.6)]"></span>
            <span className="text-[10px] font-bold text-info uppercase tracking-widest">Risky</span>
        </div>
    );
}
