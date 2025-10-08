import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { User } from "@shared/schema";
import NotificationPopup from "@/components/ui/notification-popup";

interface NotificationManagerProps {
  user: User;
}

export default function NotificationManager({ user }: NotificationManagerProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<Set<string>>(new Set());
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user.id}/unread`],
    refetchInterval: 30000, 
  });

  useEffect(() => {
    
    const nextNotification = unreadNotifications.find(
      (notification: Notification) => !displayedNotifications.has(notification.id)
    );

    if (nextNotification && !currentNotification) {
      setCurrentNotification(nextNotification);
      setDisplayedNotifications(prev => new Set(prev).add(nextNotification.id));
    }
  }, [unreadNotifications, displayedNotifications, currentNotification]);

  const handleCloseNotification = () => {
    setCurrentNotification(null);
  };

  const handleMarkAsRead = (notificationId: string) => {
    
    setDisplayedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
    setCurrentNotification(null);
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <NotificationPopup
      notification={currentNotification}
      onClose={handleCloseNotification}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}

