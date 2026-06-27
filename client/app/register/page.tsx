"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal, ShieldAlert, Cpu, Check, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const RegisterPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    ownerName: '',
    agencyName: '',
    website: '',
    email: '',
    password: ''
  });

  const [regStatus, setRegStatus] = useState<'idle' | 'linking' | 'failed' | 'success'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (regStatus === 'linking') return;

    setRegStatus('linking');
    setTerminalLogs([
      'INITIATING SWARM REGISTRATION...',
      `ALLOCATING RESOURCES FOR: ${formData.agencyName.toUpperCase()}`,
      'SECURING CONNECTION...'
    ]);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register`, formData, {
        withCredentials: true,
      });
      
      const successLogs = [
        'WORKSPACE PROVISIONED [OK]',
        'INITIALIZING AI AGENTS... [OK]',
        'GENERATING SECURE ACCESS KEYS...',
        'REGISTRATION SUCCESSFUL // WORKSPACE READY',
        'BOOTING UP DASHBOARD...',
        'REDIRECTING TO COMMAND CENTER...'
      ];

      let currentIndex = 0;
      const logInterval = setInterval(() => {
        if (currentIndex < successLogs.length) {
          setTerminalLogs(prev => [...prev, successLogs[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(logInterval);
          setRegStatus('success');
          toast({
            title: "Success",
            description: "Agency registered successfully",
            type: "success",
          });
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
        }
      }, 400);

    } catch (error: any) {
      console.error(error);
      const resMessage = error.response?.data?.message;
      const errorMsg = typeof resMessage === 'string' 
        ? resMessage 
        : Array.isArray(resMessage) 
          ? resMessage.join(' // ') 
          : "REGISTRATION ABORTED: SYSTEM REJECTED SPECIFICATION";
      
      const failLogs = [
        'NODE PROVISIONING TIMEOUT',
        `[CRITICAL] ERROR: ${errorMsg.toUpperCase()}`,
        'CLEANING VOLATILE ALLOCATED RESIDUALS...',
        'ABORTING SWARM INITIALIZATION.'
      ];

      let currentIndex = 0;
      const logInterval = setInterval(() => {
        if (currentIndex < failLogs.length) {
          setTerminalLogs(prev => [...prev, failLogs[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(logInterval);
          setRegStatus('failed');
          toast({
            title: "Error",
            description: errorMsg,
            type: "error",
          });
        }
      }, 400);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-black text-white font-mono selection:bg-accent selection:text-black overflow-hidden flex flex-col justify-between">
      {/* Background HUD elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,208,182,0.05),transparent_50%)] pointer-events-none" />
      <div className="grid-overlay" />
      <div className="absolute top-4 left-6 text-[10px] text-white/30 font-mono tracking-widest hidden sm:block">
        PHANTOM_SECURE_AUTH_v1.0.8 // REG_NODE // {typeof window !== 'undefined' ? window.location.hostname : 'SERVER'}
      </div>
      <Link href="/" className="absolute top-4 right-6 text-[10px] text-accent hover:text-white transition-colors tracking-widest font-bold z-15">
        &lt;- EXIT PROTOCOL
      </Link>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center grow px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-white/2 border border-white/10 rounded-[28px] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          {/* Neon scanline accent inside card */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-accent/3 to-transparent animate-scanline pointer-events-none" />
          
          {/* Card Corner ticks */}
          <span className="absolute top-3 left-3 text-[9px] text-white/20 select-none">+</span>
          <span className="absolute top-3 right-3 text-[9px] text-white/20 select-none">+</span>
          <span className="absolute bottom-3 left-3 text-[9px] text-white/20 select-none">+</span>
          <span className="absolute bottom-3 right-3 text-[9px] text-white/20 select-none">+</span>

          {/* Header */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-10 h-10 flex items-center justify-center mb-3 relative group">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image src="/phantom-logo.png" alt="Phantom Logo" width={40} height={40} className="object-contain relative z-10" />
            </div>
            <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white mb-1 text-center flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-accent animate-pulse" /> SWARM REGISTER
            </h1>
            <div className="text-[9px] font-mono text-white/40 tracking-wider">
              {regStatus === 'linking' ? (
                <span className="text-accent animate-pulse font-bold">BOOTSTRAPPING SWARM NODE...</span>
              ) : regStatus === 'failed' ? (
                <span className="text-rose-500 font-bold">REGISTRATION REJECTED</span>
              ) : (
                <span>PROVISION NEW OUTREACH COMMAND NODE</span>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {regStatus === 'idle' || regStatus === 'failed' ? (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 relative z-10"
              >
                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    // AGENCY OWNER NAME
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-accent select-none">&gt;</span>
                    <input
                      type="text"
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/10"
                      placeholder="John Doe"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    // AGENCY DESCRIPTOR NAME
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-accent select-none">&gt;</span>
                    <input
                      type="text"
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/10"
                      placeholder="Acme Outbound"
                      name="agencyName"
                      value={formData.agencyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    // DIGITAL DOMAIN URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-accent select-none">&gt;</span>
                    <input
                      type="url"
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/10"
                      placeholder="https://acme.com"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    // AUTHENTICATION EMAIL
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-accent select-none">&gt;</span>
                    <input
                      type="email"
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/10"
                      placeholder="founder@acme.com"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    // SWARM CLEARANCE PASSWORD
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-accent select-none">&gt;</span>
                    <input
                      type="password"
                      required
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/10"
                      placeholder="••••••••••••"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {regStatus === 'failed' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex gap-2 items-center text-[10px] text-rose-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>REGISTRY CRITICAL FAULT. REVIEW SPECIFICATION AND RETRY.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-black font-black uppercase tracking-widest text-xs rounded-xl px-4 py-4 mt-1 transition-all hover:shadow-[0_0_30px_rgba(0,208,182,0.3)] active:scale-[0.98] cursor-pointer"
                >
                  Deploy Node Swarm
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="terminal-logger"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-black/60 border border-white/10 rounded-xl p-4 min-h-[220px] flex flex-col justify-end gap-1.5 font-mono text-[11px] leading-relaxed relative">
                  <div className="absolute top-2 right-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    <span className="text-[8px] text-white/30 tracking-widest">REG_LOGS</span>
                  </div>
                  
                  <div className="grow flex flex-col justify-end gap-1 select-none">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <span className="text-accent font-bold shrink-0">&gt;</span>
                        <span className={log?.includes?.('[CRITICAL]') ? 'text-rose-500 font-bold' : log?.includes?.('[OK]') || log?.includes?.('SUCCESSFUL') ? 'text-emerald-400 font-bold' : 'text-white/60'}>
                          {log || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-white/40">
                  <Cpu className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>SYNCING DOMAIN CONFIG WITH PROTOCOL CDN...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/40 text-[10px] tracking-wider mt-6 border-t border-white/5 pt-4 relative z-10">
            ALREADY DEPLOYED SECURITY ACCESS?{' '}
            <Link href="/login" className="text-accent hover:text-white transition-colors font-bold uppercase">
              [ INITIATE LINK ]
            </Link>
          </p>
        </div>
      </div>

      {/* Footer copyright node info */}
      <div className="w-full text-center py-4 border-t border-white/5 text-[9px] text-white/20 select-none">
        PHANTOM. ALL RIGHTS RESERVED. CLIENT_PORTAL_STATION_0049
      </div>
    </div>
  );
};

export default RegisterPage;
