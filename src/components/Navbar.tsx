import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification, Role } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  MapPin,
  Compass,
  FolderKanban,
  BarChart3,
  PlusCircle,
  Bell,
  User,
  Shield,
  Building2,
  Lightbulb,
  CheckCheck,
  ChevronDown,
  LogOut,
  Mail,
  Headphones
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth, onOpenReport }) => {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    async function loadNotifs() {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
      } catch {
        // Ignore
      }
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // Ignore
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'admin':
        return { label: 'Govt Admin', icon: Shield, color: 'bg-slate-900 text-white' };
      case 'institution':
        return { label: 'University / Lab', icon: Building2, color: 'bg-indigo-600 text-white' };
      case 'expert':
        return { label: 'Domain Expert', icon: Lightbulb, color: 'bg-amber-600 text-white' };
      default:
        return { label: 'Citizen', icon: User, color: 'bg-emerald-600 text-white' };
    }
  };

  const roleInfo = getRoleBadge(role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-display font-black tracking-tight text-slate-900">
                  CIVIC<span className="text-indigo-600">SETU</span>
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 -mt-0.5 hidden sm:block tracking-wide">
                Problems into Innovation Projects
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`px-3 py-2 rounded-xl transition-colors ${currentTab === 'landing' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('explore')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${currentTab === 'explore' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Compass className="w-4 h-4 text-indigo-500" />
              Explore Challenges
            </button>
            <button
              onClick={() => setCurrentTab('map')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${currentTab === 'map' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <MapPin className="w-4 h-4 text-emerald-500" />
              GIS Map
            </button>
            <button
              onClick={() => setCurrentTab('projects')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${currentTab === 'projects' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <FolderKanban className="w-4 h-4 text-amber-500" />
              Projects
            </button>
            <button
              onClick={() => setCurrentTab('impact')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${currentTab === 'impact' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Impact Hub
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${currentTab === 'contact' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Mail className="w-4 h-4 text-rose-500" />
              Contact Us
            </button>

            {/* Role-Specific Workspace Button */}
            <button
              onClick={() => {
                if (role === 'admin') setCurrentTab('admin');
                else if (role === 'institution') setCurrentTab('institution');
                else if (role === 'expert') setCurrentTab('expert');
                else setCurrentTab('citizen');
              }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all border ${
                ['admin', 'institution', 'expert', 'citizen'].includes(currentTab)
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              My Portal ({roleInfo.label})
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Contact Button for Mobile/Tablet */}
            <button
              type="button"
              onClick={() => setCurrentTab('contact')}
              className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                currentTab === 'contact' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Contact Us Helpdesk"
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* User Account & Authentication */}
            <button
              type="button"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs hover:opacity-90 transition-all ${roleInfo.color}`}
              title="Account & Authentication"
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user?.name ? user.name.split(' ')[0] : roleInfo.label}</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Activity Notifications</h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {unreadCount} new
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 py-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs transition-colors ${
                            !n.is_read ? 'bg-indigo-50/60 border border-indigo-100' : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action: Report a Problem Button */}
            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Problem</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
