
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Trash2, AlertCircle, TrendingUp, TrendingDown, CheckCircle, Clock, X } from 'lucide-react';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemNotification {
  id: string;
  type: 'PRICE_ALERT' | 'MARKET_CONDITION' | 'SIGNAL' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  data?: any;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'trading_notifications';

export function NotificationCenter({ isOpen, onClose, isMobile = false }: NotificationCenterProps) {
  const { alerts, triggeredAlerts } = usePriceAlerts();
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setSystemNotifications(parsedNotifications);
        console.log('📚 Loaded system notifications:', parsedNotifications.length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(systemNotifications));
      // Trigger immediate notification count update
      window.dispatchEvent(new CustomEvent('notificationCountUpdated', { 
        detail: { count: unreadCount } 
      }));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [systemNotifications]);

  // Convert triggered alerts to notifications
  const alertNotifications: SystemNotification[] = triggeredAlerts.map(alert => ({
    id: `alert-${alert.id}`,
    type: 'PRICE_ALERT' as const,
    title: '🚨 Price Alert Triggered',
    message: `${alert.symbol} is now ${alert.type.toLowerCase()} $${alert.targetPrice.toLocaleString()} (Current: $${alert.currentPrice.toLocaleString()})`,
    timestamp: alert.triggeredAt || Date.now(),
    severity: 'HIGH' as const,
    isRead: false,
    data: alert
  }));

  // Add method to add new system notifications
  const addSystemNotification = (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      isRead: false
    };
    
    setSystemNotifications(prev => {
      const updated = [newNotification, ...prev];
      console.log('📨 New system notification added:', newNotification.title);
      console.log('📊 Total system notifications:', updated.length);
      
      // Force immediate notification count update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('notificationCountUpdated', { 
          detail: { count: updated.filter(n => !n.isRead).length + triggeredAlerts.length } 
        }));
      }, 50);
      
      return updated;
    });
  };

  // Make this available globally and trigger re-render when notifications change
  useEffect(() => {
    (window as any).addSystemNotification = addSystemNotification;
    return () => {
      delete (window as any).addSystemNotification;
    };
  }, [triggeredAlerts.length]);

  // Combine all notifications and ensure they're properly counted
  const allNotifications = [...alertNotifications, ...systemNotifications]
    .sort((a, b) => b.timestamp - a.timestamp);

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  // Enhanced logging and immediate count broadcasting
  useEffect(() => {
    console.log('📊 Enhanced Notification Debug Info:', {
      total: allNotifications.length,
      unread: unreadCount,
      alerts: alertNotifications.length,
      system: systemNotifications.length,
      triggered: triggeredAlerts.length,
      alertDetails: alertNotifications.map(a => ({ id: a.id, title: a.title, isRead: a.isRead })),
      systemDetails: systemNotifications.map(s => ({ id: s.id, title: s.title, isRead: s.isRead }))
    });
    
    // Force immediate update to parent component about notification count
    window.dispatchEvent(new CustomEvent('notificationCountUpdated', { 
      detail: { count: unreadCount } 
    }));
    
    // Also dispatch storage event for cross-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'trading_notifications',
      newValue: JSON.stringify(systemNotifications)
    }));
    
  }, [allNotifications.length, unreadCount, alertNotifications.length, systemNotifications.length, triggeredAlerts.length]);

  const markAsRead = (notificationId: string) => {
    if (notificationId.startsWith('alert-')) {
      console.log('📖 Alert notifications are auto-read (from triggered alerts)');
      return;
    }
    
    setSystemNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
      console.log('📖 Marked notification as read:', notificationId);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setSystemNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      console.log('📖 Marked all system notifications as read');
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setSystemNotifications([]);
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    console.log('🗑️ Cleared all notifications');
  };

  const getNotificationIcon = (type: SystemNotification['type'], severity: SystemNotification['severity']) => {
    const colorClass = severity === 'HIGH' ? 'text-red-500' : 
                      severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500';
    
    switch (type) {
      case 'PRICE_ALERT':
        return <Bell className={`w-4 h-4 ${colorClass}`} />;
      case 'MARKET_CONDITION':
        return <AlertCircle className={`w-4 h-4 ${colorClass}`} />;
      case 'SIGNAL':
        return <TrendingUp className={`w-4 h-4 ${colorClass}`} />;
      case 'SYSTEM':
        return <CheckCircle className={`w-4 h-4 ${colorClass}`} />;
    }
  };

  const getSeverityBadge = (severity: SystemNotification['severity']) => {
    const variant = severity === 'HIGH' ? 'destructive' : 
                   severity === 'MEDIUM' ? 'default' : 'secondary';
    return <Badge variant={variant} className="text-xs">{severity}</Badge>;
  };

  const filteredNotifications = allNotifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'alerts') return notification.type === 'PRICE_ALERT';
    if (activeTab === 'signals') return notification.type === 'SIGNAL';
    if (activeTab === 'market') return notification.type === 'MARKET_CONDITION';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-start ${isMobile ? 'justify-center p-2' : 'justify-end p-4'}`}>
      <Card className={`${isMobile ? 'w-full max-w-sm' : 'w-96'} max-h-[80vh] bg-card border shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-2">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} mb-4`}>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              {!isMobile && <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>}
              {!isMobile && <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>}
              {!isMobile && <TabsTrigger value="signals" className="text-xs">Signals</TabsTrigger>}
              {isMobile && <TabsTrigger value="alerts" className="text-xs">More</TabsTrigger>}
            </TabsList>

            <TabsContent value={activeTab} className={`space-y-3 ${isMobile ? 'max-h-80' : 'max-h-96'} overflow-y-auto`}>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs mt-1">
                    {activeTab === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.isRead 
                        ? 'bg-muted/30 opacity-75' 
                        : 'bg-card hover:bg-card/70 border-l-4 border-l-primary'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {getNotificationIcon(notification.type, notification.severity)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        {getSeverityBadge(notification.severity)}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {allNotifications.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Total: {allNotifications.length} notifications
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
