import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Notification } from "@shared/schema";

interface NotificationDropdownProps {
  userId: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "warning":
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Info className="w-4 h-4 text-blue-600" />;
  }
};

const getNotificationBadge = (type: string) => {
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

export default function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: [`notifications-${userId}`],
    queryFn: async () => {
      const response = await apiRequest<{ data: Notification[] }>('GET', `/api/notifications/user/${userId}`, {});
      return response.data;
    },
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 h-auto hover:bg-gray-100"
        >
          <Bell className="w-5 h-5 text-eco-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg border" align="end" sideOffset={8}>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs hover:bg-blue-50"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 transition-colors border-l-3 ${
                      !notification.isRead 
                        ? 'bg-blue-50/30 border-l-blue-500' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                            {notification.title}
                          </h4>
                          {getNotificationBadge(notification.type)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs h-6 px-2 hover:bg-gray-200 text-blue-600"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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

