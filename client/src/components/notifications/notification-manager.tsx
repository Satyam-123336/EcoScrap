import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Notification, User } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import NotificationPopup from "./notification-popup";
import NotificationDropdown from "./notification-dropdown";

interface NotificationManagerProps {
  user: User;
}

export default function NotificationManager({ user }: NotificationManagerProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<Set<string>>(new Set());
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const { data: unreadNotifications = [], refetch: refetchUnread } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/user/${user.id}/unread`],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return await res.json();
    },
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
    refetchUnread(); 
  };

  return (
    <>
      <NotificationDropdown userId={user.id} />
      {currentNotification && (
        <NotificationPopup
          notification={currentNotification}
          onClose={handleCloseNotification}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </>
  );
}

