import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Toast({ message, type = 'info', onClose, duration = 5000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColor = {
        success: 'bg-green-500/90',
        error: 'bg-red-500/90',
        warning: 'bg-yellow-500/90',
        info: 'bg-blue-500/90'
    }[type];

    const icon = {
        success: <CheckCircle2 className="w-5 h-5" />,
        error: <AlertTriangle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    }[type];

    return (
        <div className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg animate-in fade-in slide-in-from-right",
            bgColor
        )}>
            {icon}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
