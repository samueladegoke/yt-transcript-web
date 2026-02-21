import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the return block
start_idx = content.find('  return (\n')
if start_idx == -1:
    print("Could not find start of return block")
    exit(1)

new_return_block = """  return (
    <div className="min-h-screen bg-background text-foreground font-display selection:bg-primary/30 pb-20 overflow-x-hidden">
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

      {/* Header */}
      <header className="fixed top-0 w-full z-40 glassmorphism border-b border-white/5 px-8 py-4 bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold tracking-tight uppercase">Proxy Sentinel</h1>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-8 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Live System Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-primary"
              title="Notification Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3 bg-white/5 p-1 pr-3 rounded-full border border-white/5">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold tracking-tight">ADMIN_ROOT</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28 px-8 max-w-[1600px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter mb-2">Operational Overview</h2>
            <p className="text-slate-500 font-medium tracking-wide">Real-time status of your global proxy infrastructure.</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Total Proxies"
            value={progress.total === 0 ? parsedProxies.length : progress.total}
            icon={<Monitor className="w-8 h-8 text-info" />}
            glowContext="info"
          />
          <StatCard
            title="Clean Mobile IPs"
            value={proxies.filter(p => isTargetProxy(p)).length}
            icon={<ShieldCheck className="w-8 h-8 text-primary" />}
            glowContext="primary"
          />
          <StatCard
            title="Risky IPs"
            value={proxies.filter(p => !isTargetProxy(p) && p.status === 'success').length}
            icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
            glowContext="danger"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Input Section */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-28">
            <div className="glassmorphism p-6 rounded-xl">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Bulk Input
              </h4>
              <textarea
                value={customProxyInput}
                onChange={(e) => setCustomProxyInput(e.target.value)}
                placeholder={`Paste proxy list...\n\nExamples:\n192.168.1.1:8080:user:pass\nsocks5://proxy.example.com:1080`}
                className="w-full h-80 bg-black/40 border-white/10 rounded-lg text-slate-300 font-mono text-sm focus:ring-primary focus:border-primary placeholder:text-slate-700 p-4 resize-none transition-all"
                disabled={loading}
              />
              <div className="p-6 border-t border-white/5 flex flex-col gap-4 mt-4 -mx-6 -mb-6 bg-white/[0.02]">
                {error && (
                  <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg text-sm flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col gap-3">
                    <ProgressBar completed={progress.completed} total={progress.total} duration={progress.duration} />
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
                            .join('\\n');
                          if (cleanIps) {
                            navigator.clipboard.writeText(cleanIps);
                            setToast({ message: `Copied ${len(cleanIps.split('\\n'))} clean IPs to clipboard`, type: 'success' });
                          }
                        }}
                        disabled={loading || proxies.filter(p => p.status === 'success' && p.risk_level === 'CLEAN').length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors text-slate-300"
                        title="Copy Clean IPs"
                      >
                        <Clipboard className="w-4 h-4" />
                        Copy
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
                    </div>
                    <button
                      onClick={handleCheck}
                      disabled={loading || (showProxyInput && !customProxyInput.trim())}
                      className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold tracking-widest uppercase hover:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Play className="w-4 h-4" />
                      Analyze & Import
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Results stream in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Data Table Section */}
          <div className="lg:col-span-3 glassmorphism rounded-xl overflow-hidden min-h-[800px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold tracking-widest uppercase text-slate-400">Live Traffic Logs</span>
                <div className="flex gap-2">
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="px-3 py-1 bg-black/40 border border-white/10 rounded text-xs font-bold text-slate-300 uppercase tracking-widest focus:ring-primary focus:border-primary"
                  >
                    <option value="http">HTTP/S</option>
                    <option value="socks4">SOCKS4</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
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
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        {loading && progress.total > 0
                          ? `Starting check for ${progress.total} proxies...`
                          : parsedProxies.length > 0
                            ? `${parsedProxies.length} proxies ready. Click "Analyze & Import" to start scanning.`
                            : 'Paste a proxy list. Click "Analyze & Import" to start.'}
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
                        <td className="px-6 py-4 font-mono text-slate-500 flex items-center gap-2">
                          {isTargetProxy(proxy) && <Star className="h-4 w-4 text-primary fill-primary shadow-[0_0_8px_rgba(31,249,118,0.6)]" title="Target Match (Clean Mobile Abuja)" />}
                          {proxy.session || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm max-w-[150px] truncate" title={proxy.proxy}>
                          {proxy.proxy}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {proxy.status === 'success' ? (
                            <div className="flex items-center gap-2">
                              <span className={isTargetProxy(proxy) ? "text-primary font-bold" : "text-slate-300"}>
                                {proxy.ip}
                              </span>
                              {proxy.mobile && <Monitor className="w-3 h-3 text-slate-500" title="Mobile Connection detected" />}
                            </div>
                          ) : (
                            <span className="text-destructive font-medium">FAILED</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-bold uppercase tracking-widest",
                            proxy.protocol === 'socks5' && "bg-purple-500/20 text-purple-400",
                            proxy.protocol === 'socks4' && "bg-orange-500/20 text-orange-400",
                            proxy.protocol === 'https' && "bg-primary/20 text-primary",
                            (!proxy.protocol || proxy.protocol === 'http') && "bg-info/20 text-info"
                          )}>
                            {(proxy.protocol || 'http')}
                          </span>
                        </td>
                        <td className={cn(
                          "px-6 py-4 font-medium",
                          (proxy.local_region || proxy.local_city) ? "text-info" : "text-slate-400"
                        )}>
                          {proxy.local_region || proxy.regionName || proxy.region || 'Unknown'} <span className="text-[10px] text-slate-500 ml-1">({proxy.local_city || proxy.city || 'Unknown'})</span>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-slate-300" title={proxy.isp}>
                          {proxy.isp || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {proxy.mobile ? (
                            <span className="inline-flex w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(31,249,118,0.6)] animate-pulse" />
                          ) : (
                            <span className="inline-flex w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </td>
                        <td className="px-6 py-4 flex justify-center">
                          <RiskBadge
                            clean={proxy.status === 'success' && proxy.risk_level === 'CLEAN'}
                            failed={proxy.status !== 'success'}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="opacity-0 group-hover:opacity-100 material-symbols-outlined text-slate-500 hover:text-white transition-all">
                            <MoreVertical className="w-5 h-5"/>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Info Footer */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between text-slate-500 text-xs font-bold tracking-widest uppercase">
              <span>API: {API_BASE_URL}</span>
              <span>Sorted by: {sortConfig.column || 'None'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
"""

new_content = content[:start_idx] + new_return_block
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
