'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchAdminUsageApi,
  pruneExpiredJobsApi,
  toggleAiKillSwitchApi,
  triggerKeepaliveApi,
  triggerTestErrorApi,
} from '@/lib/api';
import {
  ZapIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  StopCircleIcon,
  BellIcon,
  TrashIcon,
  ActivityIcon,
  RefreshCwIcon,
  CpuIcon,
  DatabaseIcon,
  BarChartIcon,
} from '@/components/Icons';

export default function AdminUsagePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adminKey, setAdminKey] = useState<string>('playdrop-admin-secret-2026');
  const [actionPending, setActionPending] = useState(false);

  const loadData = async (key = adminKey) => {
    setLoading(true);
    setError(null);
    try {
      const report = await fetchAdminUsageApi(key);
      setData(report);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePruneJobs = async () => {
    setActionPending(true);
    try {
      const res = await pruneExpiredJobsApi(adminKey);
      setActionMsg({ text: res.message, type: 'success' });
      await loadData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!data) return;
    setActionPending(true);
    const newTarget = !data.globalKillSwitch.aiEnabled;
    try {
      const res = await toggleAiKillSwitchApi(newTarget, adminKey);
      setActionMsg({ text: res.message, type: 'success' });
      await loadData();
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleKeepalive = async () => {
    setActionPending(true);
    try {
      const res = await triggerKeepaliveApi(adminKey);
      setActionMsg({ text: res.message, type: 'success' });
    } catch (err: any) {
      setActionMsg({ text: err.message, type: 'error' });
    } finally {
      setActionPending(false);
    }
  };

  const handleTestError = async () => {
    setActionPending(true);
    try {
      await triggerTestErrorApi(adminKey);
      setActionMsg({ text: 'Test error triggered and captured for telemetry verification', type: 'success' });
    } catch (err: any) {
      setActionMsg({ text: `Test error dispatched: ${err.message}`, type: 'success' });
    } finally {
      setActionPending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const getBarColor = (percent: number, alertThreshold: number) => {
    if (percent >= 100) return 'bg-rose-500';
    if (percent >= alertThreshold) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3">
              <ZapIcon size={24} className="text-cyan-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                PlayDrop Zero-Cost Usage Dashboard
              </h1>
              {data && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusColor(
                    data.overallStatus
                  )}`}
                >
                  SYSTEM {data.overallStatus}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm mt-1">
              Live monitoring of Section 6 Zero-Cost Plan limits
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 transition-colors"
            >
              Back to App
            </Link>
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCwIcon size={13} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>
        </div>

        {actionMsg && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              actionMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMsg.type === 'success' ? (
                <CheckCircleIcon size={16} className="text-emerald-400" />
              ) : (
                <AlertTriangleIcon size={16} className="text-rose-400" />
              )}
              <span>{actionMsg.text}</span>
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs opacity-75 hover:opacity-100"
            >
              Close
            </button>
          </div>
        )}

        {data?.alerts && data.alerts.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm space-y-1">
            <div className="font-semibold flex items-center gap-2">
              <AlertTriangleIcon size={16} className="text-amber-400" />
              <span>Active Budget Alerts ({data.alerts.length})</span>
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 opacity-90 pl-1">
              {data.alerts.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {data && (
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                Emergency Cost Protection
              </div>
              <div className="text-lg font-bold mt-1 flex items-center gap-2">
                <span>AI Generation Pipeline:</span>
                <span
                  className={
                    data.globalKillSwitch.aiEnabled
                      ? 'text-emerald-400 font-semibold'
                      : 'text-rose-400 font-semibold'
                  }
                >
                  {data.globalKillSwitch.aiEnabled ? 'ACTIVE (Allowed)' : 'BLOCKED (Kill Switch Engaged)'}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {data.globalKillSwitch.reason}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleKillSwitch}
                disabled={actionPending}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  data.globalKillSwitch.aiEnabled
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {data.globalKillSwitch.aiEnabled ? (
                  <>
                    <StopCircleIcon size={14} />
                    <span>Engage AI Kill Switch</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size={14} />
                    <span>Re-enable AI Generation</span>
                  </>
                )}
              </button>
              <button
                onClick={handleKeepalive}
                disabled={actionPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <BellIcon size={14} />
                <span>Trigger DB Keepalive</span>
              </button>
              <button
                onClick={handlePruneJobs}
                disabled={actionPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <TrashIcon size={14} />
                <span>Prune Expired Jobs ({data.jobsOverview.prunable7DaysOld})</span>
              </button>
              <button
                onClick={handleTestError}
                disabled={actionPending}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <ActivityIcon size={14} />
                <span>Test Alert</span>
              </button>
            </div>
          </div>
        )}

        {data && (
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-200 mb-4 flex items-center gap-2">
              <BarChartIcon size={18} className="text-cyan-400" />
              <span>Section 6 Zero-Cost Resource Quotas</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.metrics).map(([key, item]: [string, any]) => (
                <div
                  key={key}
                  className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">{item.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-2xl font-black text-white">
                        {item.formattedUsed}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Cap: <span className="text-zinc-300 font-medium">{item.formattedLimit}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                        <span>{item.percentUsed}% utilized</span>
                        <span>Alert: {item.alertThresholdPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                            item.percentUsed,
                            item.alertThresholdPercent
                          )}`}
                          style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800/60">
                    {item.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.aiLedgerToday && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                  <CpuIcon size={18} className="text-cyan-400" />
                  <span>AI Token Ledgers Today</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Atomic accounting via public.ai_usage at 80% daily safety caps.
                </p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Date: UTC Today</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {data.aiLedgerToday.map((p: any) => (
                <div
                  key={p.provider}
                  className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold capitalize text-white">{p.provider}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getStatusColor(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-cyan-400 font-mono">
                    {p.tokens.toLocaleString()} <span className="text-xs text-zinc-400 font-normal">tokens</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Daily Cap: <span className="text-zinc-200">{p.dailyTokenCap.toLocaleString()}</span> ({p.requests} requests)
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${getBarColor(p.percentUsed, 80)}`}
                      style={{ width: `${Math.min(100, p.percentUsed)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.dbDetails?.tables && data.dbDetails.tables.length > 0 && (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <h3 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <DatabaseIcon size={18} className="text-cyan-400" />
              <span>Supabase Postgres Table Size Breakdown (500 MB Cap)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Table Name</th>
                    <th className="py-2.5 px-3">Total Size</th>
                    <th className="py-2.5 px-3">Estimated Rows</th>
                    <th className="py-2.5 px-3">Budget Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {data.dbDetails.tables.map((t: any) => (
                    <tr key={t.tableName} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-mono font-medium text-cyan-300">
                        {t.tableName}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-200 font-mono">
                        {t.totalSizeFormatted}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">
                        {t.rowCountEstimate.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400">
                        OK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
