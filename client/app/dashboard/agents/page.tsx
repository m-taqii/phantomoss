"use client"

import React from 'react';
import { Play, Pause, Activity, Terminal, RefreshCw } from 'lucide-react';

import { mockAgents } from '@/lib/data/agents';

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-5 text-foreground pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-xl p-4 md:p-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-0.5">Autonomous Swarm</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Monitor the health and activity of your AI workforce.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary border border-border hover:bg-foreground/5 text-foreground px-3 md:px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Restart Swarm</span><span className="sm:hidden">Restart</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm font-bold">
            <Pause className="w-4 h-4" /> <span className="hidden sm:inline">Emergency Stop</span><span className="sm:hidden">Stop</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {mockAgents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div key={agent.id} className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
              {/* Agent Header */}
              <div className="p-4 md:p-5 border-b border-border bg-background/30 flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shrink-0 ${agent.bgConfig}`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap">
                      {agent.name}
                      {agent.status === 'running' && <span className={`w-2 h-2 rounded-full bg-${agent.color} animate-ping`} />}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${agent.bgConfig} hidden sm:inline-block`}>
                    {agent.status}
                  </span>
                  <button className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-foreground/5 transition-colors">
                    {agent.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status & Metrics */}
              <div className="p-4 md:p-5 border-b border-border">
                <div className="flex items-start gap-2 mb-4 text-sm flex-wrap">
                  <Activity className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground shrink-0">Current Task:</span>
                  <span className="font-medium text-foreground">{agent.currentTask}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {agent.metrics.map((metric, i) => (
                    <div key={i} className="bg-background border border-border/50 rounded-lg p-2.5 md:p-3">
                      <span className="block text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 leading-tight">{metric.label}</span>
                      <span className={`block text-base md:text-lg font-bold text-${agent.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="flex-1 bg-[#0A0A0A] min-h-[120px] md:min-h-[150px]">
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-black/40">
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live Execution Log</span>
                </div>
                <div className="p-3 md:p-4 font-mono text-xs flex flex-col gap-2">
                  {agent.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 md:gap-3">
                      <span className="text-white/30 shrink-0 text-[10px] md:text-xs">[{log.time}]</span>
                      <span className={`text-[10px] md:text-xs leading-relaxed ${log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                          log.type === 'error' ? 'text-red-400' :
                            'text-white/70'
                        }`}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/30 text-[10px]">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                    <span className="w-2 h-3 bg-white/50 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
