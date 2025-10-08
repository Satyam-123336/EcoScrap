import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  MapPin, 
  Calendar,
  Truck,
  Package,
  Map
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationDropdownProps {
  userId: string;
}

const getNotificationIcon = (type: string, message: string) => {
  
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return <MapPin className="w-4 h-4 text-blue-600" />;
  }
  if (message.toLowerCase().includes("pickup") && !message.toLowerCase().includes("complet")) {
    return <Truck className="w-4 h-4 text-purple-600" />;
  }
  if (message.toLowerCase().includes("schedul")) {
    return <Calendar className="w-4 h-4 text-teal-600" />;
  }
  if (message.toLowerCase().includes("e-waste") || message.toLowerCase().includes("recycl")) {
    return <Package className="w-4 h-4 text-amber-600" />;
  }
  
  
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Info className="w-4 h-4 text-blue-600" />;
  }
};

const getNotificationBadge = (type: string, message: string) => {
  
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return <Badge className="bg-blue-100 text-blue-800 text-xs">Location</Badge>;
  }
  if (message.toLowerCase().includes("pickup") && message.toLowerCase().includes("schedul")) {
    return <Badge className="bg-purple-100 text-purple-800 text-xs">Pickup</Badge>;
  }
  
  
  switch (type) {
    case "success":
      return <Badge className="bg-green-100 text-green-800 text-xs">Success</Badge>;
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Warning</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-800 text-xs">Error</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Info</Badge>;
  }
};


const getNotificationBg = (type: string, message: string, isRead: boolean) => {
  if (isRead) return '';
  
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return 'bg-blue-50';
  }
  if (message.toLowerCase().includes("pickup") && message.toLowerCase().includes("schedul")) {
    return 'bg-purple-50';
  }
  
  switch (type) {
    case "success":
      return 'bg-green-50';
    case "warning":
      return 'bg-yellow-50';
    case "error":
      return 'bg-red-50';
    default:
      return 'bg-blue-50';
  }
};


const formatMessagePreview = (message: string) => {
  
  let preview = message.substring(0, 60);
  if (message.length > 60) preview += '...';
  
  
  const coordMatch = preview.match(/([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)/);
  if (coordMatch) {
    return preview.replace(
      /([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)/g, 
      '<span class="font-mono bg-gray-100 px-1 rounded text-xs">$1, $2</span>'
    );
  }
  
  return preview;
};

export default function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${userId}`],
    refetchInterval: 30000, 
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`, {});
      refetch(); 
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n: Notification) =>
          apiRequest('PUT', `/api/notifications/${n.id}/read`, {})
        )
      );
      refetch(); 
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  
  const groupedNotifications = notifications.reduce((groups: {[key: string]: Notification[]}, notification) => {
    const date = new Date(notification.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 h-auto"
        >
          <Bell className="w-5 h-5 text-eco-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                  <div key={date}>
                    <div className="px-3 py-1 bg-gray-50 border-t border-b text-xs font-medium text-gray-500">
                      {date === new Date().toLocaleDateString() ? 'Today' : date}
                    </div>
                    {dateNotifications.map((notification: Notification) => {
                      const isLocationRelated = notification.message.toLowerCase().includes("location") || 
                                               notification.message.toLowerCase().includes("address") ||
                                               notification.title.toLowerCase().includes("location");
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-50 transition-colors ${
                            getNotificationBg(notification.type, notification.message, notification.isRead)
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {getNotificationIcon(notification.type, notification.message)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </h4>
                                  {getNotificationBadge(notification.type, notification.message)}
                                </div>
                                <p 
                                  className="text-sm text-gray-600 mb-2"
                                  dangerouslySetInnerHTML={{ __html: formatMessagePreview(notification.message) }}
                                ></p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  
                                  <div className="flex items-center gap-1">
                                    {}
                                    {isLocationRelated && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          
                                          const coordMatch = notification.message.match(/([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)/);
                                          if (coordMatch) {
                                            window.open(`https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`);
                                          } else {
                                            
                                            const address = encodeURIComponent(notification.message.split('\n')[0]);
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`);
                                          }
                                        }}
                                        className="text-xs h-6 w-6 p-0"
                                        title="View on map"
                                      >
                                        <Map className="w-3 h-3" />
                                      </Button>
                                    )}
                                    
                                    {!notification.isRead && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="text-xs h-6 px-2"
                                      >
                                        Mark read
                                      </Button>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="text-xs h-6 w-6 p-0"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

