import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  CheckCircle2, AlertTriangle, ShieldCheck, Play, Monitor, Search, RefreshCw,
  X, Info, ChevronUp, ChevronDown, ArrowUpDown, Clipboard, Trash2, Bell,
  BellOff, Settings, Volume2, VolumeX, Zap, Star
} from 'lucide-react'
import { cn } from './lib/utils'
import { soundNotifier } from './lib/sound'
import { Toast } from './components/Toast'
import { ProgressBar } from './components/ProgressBar'
import { SettingsPanel } from './components/SettingsPanel'
import { StatCard } from './components/StatCard'
import { RiskBadge } from './components/RiskBadge'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_BASE_URL.replace('http', 'ws');

/**
 * Custom hook for WebSocket connection
 */
function useWebSocket(onMessage, enabled = true) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        wsRef.current = new WebSocket(`${WS_URL}/ws/tracking`);

        wsRef.current.onopen = () => {
          // Connected
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ip_change') {
              onMessage(data.data);
            }
          } catch (_e) {
            // Error parsing message
          }
        };

        wsRef.current.onclose = () => {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        wsRef.current.onerror = () => {
          // Error occurred
        };
      } catch (_error) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled, onMessage]);

  return wsRef;
}

/**
 * Helper to identify TARGET proxies based on the backend criteria:
 * - Clean Risk
 * - Mobile True
 * - In Abuja FCT area
 * - Specific carrier (MTN, AIRTEL, SPECTRANET, GLOBACOM, 9MOBILE, SP 217 in FCT)
 */
const isTargetProxy = (p) => {
  if (p.status !== 'success') return false;
  if (p.risk_level !== 'CLEAN') return false;
  if (!p.mobile) return false;

  const city = p.local_city || p.city || '';
  const fctCities = ['Bwari', 'Abaji', 'Gwagwalada', 'Kuje', 'Kwali'];
  const cityInFct = city.startsWith('Abuja') || fctCities.includes(city);
  if (!cityInFct) return false;

  const ispUpper = (p.isp || '').toUpperCase();
  const carrierList = ['AIRTEL', 'MTN', 'SPECTRANET', 'GLOBACOM', '9MOBILE'];

  let isTargetCarrier = carrierList.some(c => ispUpper.includes(c));
  if (ispUpper.includes('AIRTEL RWANDA')) isTargetCarrier = false;

  const isSp217Verified = ispUpper.includes('SP 217') && fctCities.includes(city);

  return isTargetCarrier || isSp217Verified;
};

// Components have been extracted to /src/components/

/**
 * Proxy Sentinel Frontend - High Performance Version with Streaming Results
 */
function App() {
  // Core state
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const trackingRef = useRef(null); // Keep in sync for websocket handler
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [protocol, setProtocol] = useState('http');

  // Progress state for streaming
  const [progress, setProgress] = useState({ completed: 0, total: 0, duration: 0 });
  const [checkStartTime, setCheckStartTime] = useState(null);

  // New state for dynamic proxy input
  const [customProxyInput, setCustomProxyInput] = useState('');
  const [showProxyInput, setShowProxyInput] = useState(true);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: 'asc'
  });

  // Notification state
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    toastEnabled: true,
    volume: 0.5,
    frequency: 800,
    trackingInterval: 5
  });

  // IP change history for display
  const [ipChanges, setIpChanges] = useState([]);

  // WebSocket ref for streaming
  const checkWsRef = useRef(null);

  // Apply settings to sound notifier
  useEffect(() => {
    soundNotifier.setEnabled(settings.soundEnabled);
    soundNotifier.setVolume(settings.volume);
    soundNotifier.setFrequency(settings.frequency);
  }, [settings]);

  // Keep trackingRef in sync with tracking state
  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  // Update duration during checking
  useEffect(() => {
    if (loading && checkStartTime) {
      const interval = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          duration: (Date.now() - checkStartTime) / 1000
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading, checkStartTime]);

  // WebSocket message handler for tracking
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'tracking_check_complete') {
      setLastUpdate(new Date().toLocaleTimeString());
    } else if (data.type === 'ip_change') {
      if (trackingRef.current && data.session !== trackingRef.current) {
        return; // Ignore updates for previously tracked sessions
      }

      setIpChanges(prev => [{
        session: data.session,
        oldIp: data.old_ip,
        newIp: data.new_ip,
        city: data.city,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));

      if (settings.soundEnabled) {
        soundNotifier.playAlert();
      }

      if (settings.toastEnabled) {
        setToast({
          message: `IP Changed: ${data.old_ip} → ${data.new_ip}`,
          type: 'warning'
        });
      }
    }
  }, [settings]);

  // WebSocket connection (only when tracking)
  useWebSocket(handleWebSocketMessage, !!tracking);

  // Update tracking interval on server
  const updateTrackingInterval = useCallback(async (interval) => {
    try {
      await fetch(`${API_BASE_URL}/api/track/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval_minutes: interval })
      });
    } catch (_err) {
      // Error updating tracking interval
    }
  }, []);

  // Stats calculation - uses authoritative risk_level field from backend
  const stats = useMemo(() => {
    const total = proxies.length;
    // Clean Mobile = succeeded, marked mobile by carrier, and risk_level is CLEAN
    const clean = proxies.filter(p =>
      p.status === 'success' &&
      p.mobile === true &&
      p.risk_level === 'CLEAN'
    ).length;
    // Risky = any proxy flagged as hosting or proxy (datacenter/VPN)
    const risky = proxies.filter(p =>
      p.status === 'success' && (p.hosting === true || p.proxy === true)
    ).length;
    const failed = proxies.filter(p => p.status !== 'success').length;

    return { total, clean, risky, failed };
  }, [proxies]);

  // Parse proxy input into array
  const parsedProxies = useMemo(() => {
    if (!customProxyInput.trim()) return [];
    return customProxyInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }, [customProxyInput]);

  // Map session ID → original proxy string (for custom proxy tracking)
  const sessionProxyMap = useMemo(() => {
    const map = {};
    parsedProxies.forEach(proxyStr => {
      // Extract session ID using the same logic as the backend
      const match = proxyStr.match(/_session-([^_]+)/);
      if (match) {
        map[match[1]] = proxyStr;
      }
    });
    return map;
  }, [parsedProxies]);

  // Sorted proxies for display
  const sortedProxies = useMemo(() => {
    return [...proxies].sort((a, b) => {
      // 1. Primary sort: Target Match
      const aTarget = isTargetProxy(a) ? 1 : 0;
      const bTarget = isTargetProxy(b) ? 1 : 0;
      if (aTarget !== bTarget) {
        return bTarget - aTarget; // 1 (true) comes before 0 (false)
      }

      // 2. Secondary sort: Selected column
      if (!sortConfig.column) return 0;

      let aVal, bVal;

      switch (sortConfig.column) {
        case 'mobile':
          aVal = a.mobile ? 1 : 0;
          bVal = b.mobile ? 1 : 0;
          break;
        case 'ip': {
          aVal = a.query || '';
          bVal = b.query || '';
          const aParts = aVal.split('.').map(Number);
          const bParts = bVal.split('.').map(Number);
          for (let i = 0; i < 4; i++) {
            if (aParts[i] !== bParts[i]) {
              return (aParts[i] - bParts[i]) * (sortConfig.direction === 'asc' ? 1 : -1);
            }
          }
          return 0;
        }
        case 'risk':
          aVal = (a.hosting || a.proxy) ? 1 : 0;
          bVal = (b.hosting || b.proxy) ? 1 : 0;
          break;
        case 'isp':
          aVal = (a.isp || '').toUpperCase();
          bVal = (b.isp || '').toUpperCase();
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
      }
      return (aVal - bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
  }, [proxies, sortConfig]);

  // Handle sort column click
  const handleSort = useCallback((column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Clear all state when new proxy list is pasted
  const handleProxyInputPaste = useCallback(() => {
    setTimeout(() => {
      setProxies([]);
      setTracking(null);
      setLastUpdate(null);
      setError(null);
      setSortConfig({ column: null, direction: 'asc' });
      setIpChanges([]);
      setProgress({ completed: 0, total: 0, duration: 0 });
    }, 0);
  }, []);

  // Clear proxy input
  const clearProxyInput = useCallback(() => {
    setCustomProxyInput('');
    setProxies([]);
    setTracking(null);
    setLastUpdate(null);
    setError(null);
    setSortConfig({ column: null, direction: 'asc' });
    setIpChanges([]);
    setProgress({ completed: 0, total: 0, duration: 0 });
  }, []);

  // Check proxies with WebSocket streaming
  const handleCheck = useCallback(async () => {
    setError(null);
    setToast(null);

    const inputToUse = showProxyInput ? customProxyInput : null;
    if (showProxyInput && !inputToUse.trim()) {
      setError('Please enter at least one proxy to check.');
      setLoading(false); // Ensure loading state is reset if validation fails
      return;
    }

    const proxiesToCheck = parsedProxies.length > 0 ? parsedProxies : [];

    setLoading(true);
    setProxies([]);
    setProgress({ completed: 0, total: proxiesToCheck.length, duration: 0 });
    setCheckStartTime(Date.now());

    try {
      // Create WebSocket connection for streaming results
      const ws = new WebSocket(`${WS_URL}/ws/check`);

      ws.onopen = () => {
        // Send check request
        ws.send(JSON.stringify({
          proxies: proxiesToCheck,
          protocol: protocol
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'start':
            setProgress(prev => ({ ...prev, total: data.total }));
            break;

          case 'progress':
            // Add result to list immediately
            setProxies(prev => [...prev, data.result]);
            setProgress(prev => ({
              ...prev,
              completed: data.completed,
              total: data.total
            }));
            break;

          case 'complete':
            setLastUpdate(new Date().toLocaleTimeString());
            setLoading(false);
            setCheckStartTime(null);
            if (settings.toastEnabled) {
              setToast({
                message: `Completed: ${data.total} proxies in ${data.duration}s (${data.proxies_per_second}/sec)`,
                type: 'success'
              });
            }
            ws.close();
            break;

          case 'error':
            setError(data.message);
            setLoading(false);
            setCheckStartTime(null);
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        setError('WebSocket error occurred');
        setLoading(false);
        setCheckStartTime(null);
      };

      ws.onclose = () => {
        setLoading(false);
        setCheckStartTime(null);
      };

      checkWsRef.current = ws;

    } catch (err) {
      setError(err.message || 'Failed to check proxies');
      console.error("Error checking proxies:", err);
      setLoading(false);
      setCheckStartTime(null);
    }
  }, [parsedProxies, protocol, settings.toastEnabled, showProxyInput, customProxyInput]);

  // Cancel ongoing check
  const cancelCheck = useCallback(() => {
    if (checkWsRef.current) {
      checkWsRef.current.close();
    }
    setLoading(false);
    setCheckStartTime(null);
  }, []);

  // Start tracking a proxy
  // proxyStr is the full proxy string (host:port:user:pass) - required for custom proxies
  const startTracking = useCallback(async (session, proxyStr) => {
    if (!session || session === 'N/A') {
      setError('Invalid session ID');
      return;
    }

    // Enforce strict single-session tracking: delete the old session from the backend
    if (trackingRef.current && trackingRef.current !== session) {
      try {
        await fetch(`${API_BASE_URL}/api/track/${trackingRef.current}`, { method: 'DELETE' });
      } catch (err) {
        console.error("Error clearing old tracking session:", err);
      }
    }

    setTracking(session);
    setIpChanges([]);

    try {
      // Build payload - include proxyStr so backend can track custom (non-default) proxies
      const payload = { session };
      if (proxyStr) {
        payload.proxy = proxyStr;
      }

      const response = await fetch(`${API_BASE_URL}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to start tracking: ${response.statusText}`);
      }

      await updateTrackingInterval(settings.trackingInterval);

      if (settings.toastEnabled) {
        setToast({ message: `Started tracking: ${session}`, type: 'success' });
      }

    } catch (err) {
      console.error("Error starting tracking:", err);
      setError(err.message);
      setTracking(null);
    }
  }, [settings.trackingInterval, settings.toastEnabled, updateTrackingInterval, trackingRef]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (!tracking) return;

    try {
      await fetch(`${API_BASE_URL}/api/track/${tracking}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Error stopping tracking:", err);
    } finally {
      setTracking(null);
      setIpChanges([]);
    }
  }, [tracking]);

  // Clear error
  const clearError = () => setError(null);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    if (newSettings.trackingInterval !== settings.trackingInterval && tracking) {
      updateTrackingInterval(newSettings.trackingInterval);
    }
  }, [settings.trackingInterval, tracking, updateTrackingInterval]);

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 text-primary" />
      : <ChevronDown className="w-4 h-4 ml-1 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Proxy Sentinel
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              High-Performance Proxy Monitoring
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                <Zap className="w-3 h-3 inline mr-1" />
                Streaming
              </span>
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Notification Settings"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Protocol Selector */}
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks4">SOCKS4</option>
              <option value="socks5">SOCKS5</option>
            </select>

            {tracking && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition-all"
                onClick={stopTracking}
                title="Click to stop tracking"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Tracking: {tracking}</span>
                <X className="w-3 h-3" />
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={cancelCheck}
                  className="flex justify-center items-center gap-2 px-6 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium hover:bg-destructive/20 transition-all shadow-lg"
                >
                  Cancel Check
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      const cleanIps = proxies
                        .filter(p => p.status === 'success' && p.risk_level === 'CLEAN')
                        .map(p => p.proxy.split(':')[0])
                        .join('\n');
                      if (cleanIps) {
                        navigator.clipboard.writeText(cleanIps);
                        setToast({ message: `Copied ${cleanIps.split('\n').length} clean IPs to clipboard`, type: 'success' });
                      }
                    }}
                    disabled={loading || proxies.filter(p => p.status === 'success' && p.risk_level === 'CLEAN').length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors text-slate-300"
                    title="Copy Clean IPs"
                  >
                    <Clipboard className="w-4 h-4" />
                    Copy Clean
                  </button>
                  <button
                    onClick={() => setProxies([])}
                    disabled={loading || proxies.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    title="Clear Results"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                  <button
                    onClick={handleCheck}
                    disabled={loading || (showProxyInput && !customProxyInput.trim())}
                    className="flex-[2] flex items-center justify-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold tracking-widest uppercase hover:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Play className="w-4 h-4" />
                    Check Proxies
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Paste a new list to replace. Results stream in real-time as proxies are checked.
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <StatCard title="Total Proxies" value={stats.total} icon={<Monitor className="text-blue-400" />} />
            <StatCard title="Clean Mobile IPs" value={stats.clean} icon={<ShieldCheck className="text-green-400" />} />
            <StatCard title="Risky IPs" value={stats.risky} icon={<AlertTriangle className="text-red-400" />} />
            <StatCard title="Last Update" value={lastUpdate || "Never"} icon={<CheckCircle2 className="text-purple-400" />} />
          </div>

          {/* Proxy Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 border-b border-white/5 bg-black/20">
                  <tr>
                    <th className="px-6 py-5">Session</th>
                    <th
                      className="px-6 py-5 cursor-pointer hover:text-primary transition-colors select-none"
                      onClick={() => handleSort('proxy')}
                    >
                      <div className="flex items-center">
                        Input Proxy
                        <SortIndicator column="proxy" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-5 cursor-pointer hover:text-primary transition-colors select-none"
                      onClick={() => handleSort('ip')}
                    >
                      <div className="flex items-center">
                        Resolved IP
                        <SortIndicator column="ip" />
                      </div>
                    </th>
                    <th className="px-6 py-5">Protocol</th>
                    <th className="px-6 py-5">Geo State(City)</th>
                    <th
                      className="px-6 py-5 cursor-pointer hover:text-primary transition-colors select-none"
                      onClick={() => handleSort('isp')}
                    >
                      <div className="flex items-center">
                        ISP / Carrier
                        <SortIndicator column="isp" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-5 text-center cursor-pointer hover:text-primary transition-colors select-none"
                      onClick={() => handleSort('mobile')}
                    >
                      <div className="flex items-center justify-center">
                        Mobile
                        <SortIndicator column="mobile" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-5 text-center cursor-pointer hover:text-primary transition-colors select-none"
                      onClick={() => handleSort('risk')}
                    >
                      <div className="flex items-center justify-center">
                        Risk
                        <SortIndicator column="risk" />
                      </div>
                    </th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {sortedProxies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        {loading && progress.total > 0
                          ? `Starting check for ${progress.total} proxies...`
                          : parsedProxies.length > 0
                            ? `${parsedProxies.length} proxies ready. Click "Check Proxies" to start scanning.`
                            : 'Paste a proxy list or use the default list. Click "Check Proxies" to start.'}
                      </td>
                    </tr>
                  ) : (
                    sortedProxies.map((proxy, index) => (
                      <tr
                        key={proxy.session || `proxy-${index}`}
                        className={cn(
                          "hover:bg-white/[0.02] transition-colors group",
                          proxy.status !== 'success' && "opacity-60",
                          isTargetProxy(proxy) && "bg-primary/5 hover:bg-primary/10"
                        )}
                      >
                        <td className="px-6 py-4 font-mono text-muted-foreground flex items-center gap-2">
                          {isTargetProxy(proxy) && <Star className="h-4 w-4 text-emerald-400 fill-emerald-400" title="Target Match (Clean Mobile Abuja)" />}
                          {proxy.session || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm max-w-[150px] truncate" title={proxy.proxy}>
                          {proxy.proxy}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {proxy.status === 'success' ? (
                            <div className="flex items-center gap-2">
                              <span className={isTargetProxy(proxy) ? "text-primary font-bold" : ""}>
                                {proxy.ip}
                              </span>
                              {proxy.mobile && <Monitor className="w-3 h-3 text-muted-foreground" title="Mobile Connection detected" />}
                            </div>
                          ) : (
                            <span className="text-red-400 font-medium">FAILED</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            proxy.protocol === 'socks5' && "bg-purple-500/20 text-purple-400",
                            proxy.protocol === 'socks4' && "bg-orange-500/20 text-orange-400",
                            proxy.protocol === 'https' && "bg-green-500/20 text-green-400",
                            (!proxy.protocol || proxy.protocol === 'http') && "bg-blue-500/20 text-blue-400"
                          )}>
                            {(proxy.protocol || 'http').toUpperCase()}
                          </span>
                        </td>
                        <td className={cn(
                          "px-6 py-4",
                          (proxy.local_region || proxy.local_city) ? "text-blue-300" : "text-muted-foreground"
                        )}>
                          {proxy.local_region || proxy.regionName || proxy.region || 'Unknown'}({proxy.local_city || proxy.city || 'Unknown'})
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={proxy.isp}>
                          {proxy.isp || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {proxy.mobile ? (
                            <span className="inline-flex w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                          ) : (
                            <span className="inline-flex w-2 h-2 rounded-full bg-muted" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {/* Use authoritative risk_level from backend when available */}
                          <RiskBadge
                            clean={proxy.status === 'success' && proxy.risk_level === 'CLEAN'}
                            failed={proxy.status !== 'success'}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {proxy.session && proxy.session !== 'N/A' && (
                            <button
                              onClick={() => {
                                // Pass the full proxy string so custom proxies can be tracked
                                const proxyStr = sessionProxyMap[proxy.session];
                                startTracking(proxy.session, proxyStr);
                              }}
                              disabled={tracking === proxy.session}
                              className={cn(
                                "text-xs font-medium underline decoration-cyan-400/30 underline-offset-4 transition-colors",
                                tracking === proxy.session
                                  ? "text-green-400 cursor-default"
                                  : "text-cyan-400 hover:text-cyan-300"
                              )}
                            >
                              {tracking === proxy.session ? 'Tracking' : 'Track IP'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Footer */}
          <div className="text-center text-muted-foreground text-sm">
            <p className="flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              API: {API_BASE_URL} | Protocol: {protocol.toUpperCase()}
              {sortConfig.column && ` | Sorted by: ${sortConfig.column} (${sortConfig.direction})`}
              {tracking && ` | Tracking interval: ${settings.trackingInterval}min`}
              {progress.total > 0 && ` | Max concurrent: 100`}
            </p>
          </div>
        </div>
      </div>
      );
}

      export default App
