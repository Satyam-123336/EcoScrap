import { useState, useEffect } from "react";
import { Notification } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, MapPin, Map, Truck, Calendar, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const getNotificationIcon = (type: string, message: string) => {
  
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return <MapPin className="w-5 h-5 text-blue-600" />;
  }
  if (message.toLowerCase().includes("pickup") && !message.toLowerCase().includes("complet")) {
    return <Truck className="w-5 h-5 text-purple-600" />;
  }
  if (message.toLowerCase().includes("schedul")) {
    return <Calendar className="w-5 h-5 text-teal-600" />;
  }
  if (message.toLowerCase().includes("e-waste") || message.toLowerCase().includes("recycl")) {
    return <Package className="w-5 h-5 text-amber-600" />;
  }
  
  
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case "location":
      return <MapPin className="w-5 h-5 text-blue-600" />;
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
};

const getNotificationBadge = (type: string, message: string) => {
  
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return <Badge className="bg-blue-100 text-blue-800">Location</Badge>;
  }
  if (message.toLowerCase().includes("pickup") && message.toLowerCase().includes("schedul")) {
    return <Badge className="bg-purple-100 text-purple-800">Pickup</Badge>;
  }
  
  
  switch (type) {
    case "success":
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    case "location":
      return <Badge className="bg-blue-100 text-blue-800">Location</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
  }
};


const getBorderColor = (type: string, message: string) => {
  if (message.toLowerCase().includes("location") || message.toLowerCase().includes("address")) {
    return "border-l-blue-500";
  }
  if (message.toLowerCase().includes("pickup") && message.toLowerCase().includes("schedul")) {
    return "border-l-purple-500";
  }
  
  switch (type) {
    case "success":
      return "border-l-green-500";
    case "warning":
      return "border-l-yellow-500";
    case "error":
      return "border-l-red-500";
    case "location":
      return "border-l-blue-500";
    default:
      return "border-l-blue-500";
  }
};


const formatMessage = (message: string) => {
  
  if (message.match(/[0-9]+\.[0-9]+,\s*[0-9]+\.[0-9]+/)) {
    const parts = message.split(/(([0-9]+\.[0-9]+,\s*[0-9]+\.[0-9]+))/);
    return (
      <>
        {parts.map((part, index) => {
          if (part.match(/[0-9]+\.[0-9]+,\s*[0-9]+\.[0-9]+/)) {
            return <span key={index} className="font-mono bg-gray-100 px-1 rounded text-xs">{part}</span>;
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  }
  
  
  if (message.match(/[0-9]+\s+[A-Za-z\s]+,/)) {
    return (
      <div>
        {message.split("\n").map((line, i) => (
          <p key={i} className={line.match(/[0-9]+\s+[A-Za-z\s]+,/) ? "bg-gray-50 p-1 rounded my-1 border-l-2 border-blue-300 pl-2" : ""}>
            {line}
          </p>
        ))}
      </div>
    );
  }
  
  
  return message;
};

export default function NotificationPopup({ notification, onClose, onMarkAsRead }: NotificationPopupProps) {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);

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
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onClose]);

  
  const isLocationRelated = notification.message.toLowerCase().includes("location") || 
                           notification.message.toLowerCase().includes("address") ||
                           notification.title.toLowerCase().includes("location");

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right duration-300">
      <Card className={`shadow-lg border-l-4 ${getBorderColor(notification.type, notification.message)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getNotificationIcon(notification.type, notification.message)}
              <CardTitle className="text-lg">{notification.title}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {getNotificationBadge(notification.type, notification.message)}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 relative"
              >
                <X className="h-4 w-4" />
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{
                    background: `conic-gradient(rgba(0,0,0,0.1) ${(timeRemaining/10)*100}%, transparent 0)`,
                    opacity: 0.3
                  }}
                ></div>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-gray-700 mb-4">
            {formatMessage(notification.message)}
            
            {}
            {isLocationRelated && (
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => {
                    
                    const coordMatch = notification.message.match(/([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)/);
                    if (coordMatch) {
                      window.open(`https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`);
                    } else {
                      
                      const address = encodeURIComponent(notification.message.split('\n')[0]);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`);
                    }
                  }}
                >
                  <Map className="h-3 w-3 mr-1" />
                  View on Map
                </Button>
              </div>
            )}
          </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
