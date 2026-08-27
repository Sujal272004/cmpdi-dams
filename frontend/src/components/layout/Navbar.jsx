import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Bell, Moon, Sun, User, LogOut, ShieldCheck, MapPin, Building2, Menu, CheckCheck, KeyRound } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 2,
      title: 'Report Approved',
      message: 'Anandwan Camp report #101 approved by Dr. Sunita Deshmukh.',
      type: 'APPROVED',
      isRead: false,
      createdAt: 'Yesterday'
    },
    {
      id: 3,
      title: 'New Report Submitted',
      message: 'Anandwan Camp submitted report #102 for HQ review.',
      type: 'SUBMITTED',
      isRead: false,
      createdAt: '3 days ago'
    }
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const data = await apiService.getNotifications();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setNotifications(data.map(item => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type || 'SYSTEM',
            isRead: item.isRead || item.read || false,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'
          })));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
    return () => { isMounted = false; };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await apiService.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await apiService.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cmpdi-navy text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs border border-amber-400/30">
              ⛏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-cmpdi-navy dark:text-sky-400 tracking-tight text-base">CMPDI</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-600">
                  Exploration Dept.
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drilling Activity Management System (DAMS)</p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Active Camp Badge if Camp Executive */}
          {user?.campName && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.campName}</span>
            </div>
          )}

          {/* Role badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-600">
            <Building2 className="w-3.5 h-3.5 text-cmpdi-navy dark:text-sky-400" />
            <span>{user?.role === 'ROLE_ADMIN' ? 'Administrator' : user?.role === 'ROLE_DEPT_EXEC' ? 'Department Exec (HQ)' : 'Camp Executive'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 dark:text-sky-400 font-medium hover:underline flex items-center gap-1 focus:outline-hidden"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                      All read
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map(n => {
                      const isUnread = !n.isRead;
                      let bgClass = "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700";
                      let titleColor = "text-slate-800 dark:text-slate-200";

                      if (n.type === 'RETURNED') {
                        bgClass = isUnread
                          ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75";
                        titleColor = "text-amber-800 dark:text-amber-300";
                      } else if (n.type === 'APPROVED') {
                        bgClass = isUnread
                          ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75";
                        titleColor = "text-emerald-800 dark:text-emerald-300";
                      } else if (n.type === 'SUBMITTED') {
                        bgClass = isUnread
                          ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75";
                        titleColor = "text-blue-800 dark:text-blue-300";
                      }

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleMarkSingleRead(n.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-xs relative ${bgClass}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className={`font-semibold ${titleColor}`}>{n.title}</p>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" title="Unread"></span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">{n.createdAt}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <div className="w-8 h-8 rounded-full bg-cmpdi-navy text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.designation}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="pt-1 space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-amber-500" /> Account Settings &amp; Password
                  </Link>
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

