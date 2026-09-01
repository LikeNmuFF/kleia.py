'use client'

import { useState } from 'react'
import { Users, MessageSquare, Shield, Flag, LayoutDashboard, Regex, Trophy, Mail, ScrollText, ClipboardList } from 'lucide-react'
import OverviewTab from './OverviewTab'
import UsersTab from './UsersTab'
import ContentTab from './ContentTab'
import ChatTab from './ChatTab'
import SecurityTabComponent from './SecurityTabComponent'
import CTFAdminTab from './CTFAdminTab'
import RegexGolfAdminTab from './RegexGolfAdminTab'
import SeasonsAdminTab from './SeasonsAdminTab'
import EmailTab from './EmailTab'
import LogsTab from './LogsTab'
import CcoSignupsTab from './CcoSignupsTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Content', icon: MessageSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'ctf', label: 'CTF', icon: Flag },
  { id: 'seasons', label: 'Seasons', icon: Trophy },
  { id: 'regex-golf', label: 'Regex Golf', icon: Regex },
  { id: 'cco', label: 'CCO Sign-ups', icon: ClipboardList },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'security', label: 'Security', icon: Shield },
] as const

export default function AdminDashboard({ role }: { role: string }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (role !== 'admin') return null

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Admin Dashboard
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
        Manage your Kleia instance
      </p>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid var(--border-color)' : '1px solid transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'content' && <ContentTab />}
      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'ctf' && <CTFAdminTab />}
      {activeTab === 'seasons' && <SeasonsAdminTab />}
      {activeTab === 'regex-golf' && <RegexGolfAdminTab />}
      {activeTab === 'cco' && <CcoSignupsTab />}
      {activeTab === 'email' && <EmailTab />}
      {activeTab === 'logs' && <LogsTab />}
      {activeTab === 'security' && <SecurityTabComponent />}
    </div>
  )
}
