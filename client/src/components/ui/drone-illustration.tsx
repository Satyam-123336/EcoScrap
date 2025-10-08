import React from 'react';

interface DroneIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DroneIllustration({ className = '', size = 'lg' }: DroneIllustrationProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#backgroundGradient)"
          opacity="0.1"
        />
        
        {}
        <rect
          x="35"
          y="55"
          width="50"
          height="10"
          rx="5"
          fill="url(#droneBodyGradient)"
          stroke="url(#droneBodyStroke)"
          strokeWidth="1.5"
        />
        
        {}
        <circle
          cx="60"
          cy="60"
          r="8"
          fill="url(#hubGradient)"
          stroke="url(#hubStroke)"
          strokeWidth="1"
        />
        
        {}
        <g>
          {}
          <rect
            x="30"
            y="58"
            width="60"
            height="4"
            rx="2"
            fill="url(#armGradient)"
            stroke="url(#armStroke)"
            strokeWidth="0.5"
          />
          
          {}
          <rect
            x="58"
            y="30"
            width="4"
            height="60"
            rx="2"
            fill="url(#armGradient)"
            stroke="url(#armStroke)"
            strokeWidth="0.5"
          />
        </g>
        
        {}
        <g>
          {}
          <ellipse
            cx="60"
            cy="32"
            rx="6"
            ry="1.5"
            fill="url(#propellerGradient)"
            opacity="0.9"
          />
          
          {}
          <ellipse
            cx="60"
            cy="88"
            rx="6"
            ry="1.5"
            fill="url(#propellerGradient)"
            opacity="0.9"
          />
          
          {}
          <ellipse
            cx="32"
            cy="60"
            rx="1.5"
            ry="6"
            fill="url(#propellerGradient)"
            opacity="0.9"
          />
          
          {}
          <ellipse
            cx="88"
            cy="60"
            rx="1.5"
            ry="6"
            fill="url(#propellerGradient)"
            opacity="0.9"
          />
        </g>
        
        {}
        <g>
          <circle cx="45" cy="55" r="1.5" fill="#00ff88" opacity="0.8" />
          <circle cx="75" cy="55" r="1.5" fill="#00ff88" opacity="0.8" />
          <circle cx="45" cy="65" r="1.5" fill="#00ff88" opacity="0.8" />
          <circle cx="75" cy="65" r="1.5" fill="#00ff88" opacity="0.8" />
        </g>
        
        {}
        <circle
          cx="60"
          cy="60"
          r="3"
          fill="url(#cameraGradient)"
          stroke="url(#cameraStroke)"
          strokeWidth="0.5"
        />
        
        {}
        <rect
          x="40"
          y="70"
          width="40"
          height="8"
          rx="4"
          fill="url(#basketGradient)"
          stroke="url(#basketStroke)"
          strokeWidth="1"
          opacity="0.8"
        />
        
        {}
        <g opacity="0.6">
          <line x1="45" y1="72" x2="45" y2="76" stroke="url(#basketStroke)" strokeWidth="0.5" />
          <line x1="55" y1="72" x2="55" y2="76" stroke="url(#basketStroke)" strokeWidth="0.5" />
          <line x1="65" y1="72" x2="65" y2="76" stroke="url(#basketStroke)" strokeWidth="0.5" />
          <line x1="75" y1="72" x2="75" y2="76" stroke="url(#basketStroke)" strokeWidth="0.5" />
        </g>
        
        {}
        <g>
          {}
          <rect
            x="42"
            y="72"
            width="6"
            height="4"
            rx="1"
            fill="url(#phoneGradient)"
            opacity="0.7"
          />
          
          {}
          <rect
            x="50"
            y="72"
            width="8"
            height="4"
            rx="1"
            fill="url(#laptopGradient)"
            opacity="0.7"
          />
          
          {}
          <rect
            x="60"
            y="72"
            width="4"
            height="4"
            rx="1"
            fill="url(#batteryGradient)"
            opacity="0.7"
          />
          
          {}
          <rect
            x="66"
            y="72"
            width="6"
            height="4"
            rx="1"
            fill="url(#chargerGradient)"
            opacity="0.7"
          />
        </g>
        
        {}
        <g>
          <path
            d="M 85 45 Q 90 40 95 45 Q 90 50 85 45"
            fill="url(#leafGradient)"
            opacity="0.8"
          />
          <path
            d="M 25 45 Q 30 40 35 45 Q 30 50 25 45"
            fill="url(#leafGradient)"
            opacity="0.8"
          />
        </g>
        
        {}
        <g opacity="0.6">
          <path
            d="M 60 20 L 65 25 L 60 30 L 55 25 Z"
            fill="url(#recycleGradient)"
          />
          <path
            d="M 60 90 L 65 85 L 60 80 L 55 85 Z"
            fill="url(#recycleGradient)"
          />
          <path
            d="M 20 60 L 25 65 L 30 60 L 25 55 Z"
            fill="url(#recycleGradient)"
          />
          <path
            d="M 100 60 L 95 65 L 90 60 L 95 55 Z"
            fill="url(#recycleGradient)"
          />
        </g>
        
        {}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="droneBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          <linearGradient id="droneBodyStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          
          <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          <linearGradient id="hubStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          
          <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          
          <linearGradient id="armStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          
          <linearGradient id="propellerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          
          <linearGradient id="cameraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          
          <linearGradient id="cameraStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          
          <linearGradient id="basketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
          
          <linearGradient id="basketStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          
          <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="laptopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          
          <linearGradient id="batteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          
          <linearGradient id="chargerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          
          <linearGradient id="recycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

