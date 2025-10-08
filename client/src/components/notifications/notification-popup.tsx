import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { Notification } from "@shared/schema";

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "warning":
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
};

const getNotificationBadge = (type: string) => {
  switch (type) {
    case "success":
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
  }
};

export default function NotificationPopup({ notification, onClose, onMarkAsRead }: NotificationPopupProps) {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const handleMarkAsRead = async () => {
    setIsMarkingAsRead(true);
    try {
      await apiRequest('PUT', `/api/notifications/${notification.id}/read`, {});
      onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  useEffect(() => {
    
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full animate-in slide-in-from-right duration-300">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {notification.title}
                </h4>
                {getNotificationBadge(notification.type)}
              </div>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAsRead}
                    disabled={isMarkingAsRead}
                  >
                    {isMarkingAsRead ? "Marking..." : "Mark as Read"}
                  </Button>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close notification</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

