"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { Home, BarChart2, Users, Layers, Inbox, FileText, Settings, ChevronDown, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2, section: null },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Layers, section: 'Acquisition' },
  { href: '/dashboard/leads', label: 'Leads', icon: Users, section: 'Acquisition', badgeKey: 'leads', badgeColor: 'bg-accent text-black' },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Home, section: 'Acquisition' },
  { href: '/dashboard/memory', label: 'Memory', icon: FileText, section: 'Agents' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, section: 'Configuration' },
]

const sections = ['Acquisition', 'Agents', 'Configuration']

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const [user, setUser] = useState<{name: string, email: string} | null>(null)
  const [activeCampaigns, setActiveCampaigns] = useState(0)
  const [currentDate, setCurrentDate] = useState('Loading date...')

  const [stats, setStats] = useState({ leads: 0, replies: 0 })

  useEffect(() => {
    // Fetch User Profile
    axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, { withCredentials: true })
      .then(res => {
        if (res.data?.data?.agency) {
          const agency = res.data.data.agency;
          setUser({ 
            name: agency.agencyName || 'Phantom Agency', 
            email: agency.email || 'hello@phantom.site' 
          })
          
          const tz = agency.settings?.timezone || 'UTC';
          try {
            const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz };
            setCurrentDate(new Intl.DateTimeFormat('en-US', dateOptions).format(new Date()));
          } catch (e) {
            const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
            setCurrentDate(new Intl.DateTimeFormat('en-US', dateOptions).format(new Date()));
          }
        }
      })
      .catch(console.error)

    // Fetch Stats for Badges & Campaigns
    Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads`, { withCredentials: true }).catch(() => ({ data: [] })),
      axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/outreach`, { withCredentials: true }).catch(() => ({ data: [] })),
      axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns`, { withCredentials: true }).catch(() => ({ data: [] }))
    ]).then(([leadsRes, outreachRes, campaignsRes]) => {
      const leads = leadsRes.data?.data || leadsRes.data || [];
      const outreach = outreachRes.data?.data || outreachRes.data || [];
      const campaigns = campaignsRes.data?.data || campaignsRes.data || [];
      
      const leadsCount = Array.isArray(leads) ? leads.filter((l: any) => l.status === 'researched').length : 0;
      const repliesCount = Array.isArray(outreach) ? outreach.filter((o: any) => o.status === 'draft' || o.status === 'replied').length : 0;
      const activeCount = Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === 'active').length : 0;
      
      setStats({ leads: leadsCount, replies: repliesCount });
      setActiveCampaigns(activeCount);
    }).catch(console.error)
  }, [])

  const closeSidebar = () => setIsMobileMenuOpen(false)

  return (
    <div className="flex h-dvh w-full bg-background text-foreground overflow-hidden font-sans relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border flex flex-col py-6 shrink-0 scrollbar-hide overflow-y-auto transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile Close Button */}
        <button
          className="absolute top-4 right-4 md:hidden text-muted-foreground hover:text-foreground p-1"
          onClick={closeSidebar}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding / Logo */}
        <div className="px-6 mb-10 mt-2 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image src="/phantom-logo.png" alt="Phantom Logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-widest leading-none">Phantom</span>
              <span className="text-[10px] font-bold text-accent uppercase tracking-tighter mt-1">Always on the case</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Dashboard link (standalone) */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              onClick={closeSidebar}
              className={`flex items-center justify-between px-6 py-2.5 border-r-4 transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-accent/10 text-accent border-accent'
                  : 'text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </Link>
          </div>

          {sections.map(section => {
            const items = navItems.filter(i => i.section === section)
            return (
              <div key={section} className="mb-6">
                <div className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section}
                </div>
                {items.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center justify-between px-6 py-2 border-r-4 transition-colors ${
                        isActive
                          ? 'bg-accent/10 text-accent border-accent'
                          : 'text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badgeKey && stats[item.badgeKey as keyof typeof stats] > 0 && (
                        <span className={`${item.badgeColor} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {stats[item.badgeKey as keyof typeof stats]}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* User Profile */}
        <div className="px-6 mt-auto pt-6 border-t border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent text-black flex items-center justify-center font-bold text-sm shrink-0 uppercase">
            {user ? user.name.substring(0, 2) : 'MT'}
          </div>
          <div className="flex flex-col overflow-hidden text-foreground">
            <span className="text-sm font-semibold truncate">{user ? user.name : 'Phantom Agency'}</span>
            <span className="text-xs text-muted-foreground truncate">{user ? user.email : 'hello@phantom.site'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-background scrollbar-hide">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-border shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 -ml-1 text-foreground rounded-lg hover:bg-foreground/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-semibold text-foreground truncate">Command Center</h1>
              <p className="text-muted-foreground text-xs hidden sm:block">{currentDate} — {activeCampaigns} campaigns active</p>
            </div>
          </div>
          <div className="shrink-0">
            <button className="flex items-center gap-2 bg-secondary border border-border hover:bg-foreground/5 text-foreground px-3 py-1.5 rounded-full text-xs transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="hidden sm:inline">Orchestrator running</span>
              <span className="sm:hidden">Live</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout