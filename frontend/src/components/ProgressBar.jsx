export function ProgressBar({ completed, total, duration }) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const proxiesPerSecond = duration > 0 ? (completed / duration).toFixed(1) : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                    Checking proxies... {completed}/{total}
                </span>
                <span className="text-primary font-medium">
                    {percentage}%
                </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{proxiesPerSecond} proxies/sec</span>
                <span>{duration.toFixed(1)}s elapsed</span>
            </div>
        </div>
    );
}
