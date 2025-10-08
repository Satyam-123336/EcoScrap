import React from 'react';
import DroneIllustration from './drone-illustration';

interface DroneSceneProps {
  className?: string;
  showParticles?: boolean;
  showEnvironment?: boolean;
}

export default function DroneScene({ 
  className = '', 
  showParticles = true, 
  showEnvironment = true 
}: DroneSceneProps) {
  return (
    <div className={`relative ${className}`}>
      {}
      <div className="relative z-10">
        <DroneIllustration size="lg" className="mx-auto" />
      </div>
      
      {}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {}
          <div className="absolute top-2 left-4">
            <div className="w-1.5 h-1.5 bg-eco-primary/40 rounded-full"></div>
          </div>
          
          {}
          <div className="absolute top-3 right-6">
            <div className="w-1 h-1 bg-eco-green/50 rounded-full"></div>
          </div>
          
          {}
          <div className="absolute bottom-3 left-6">
            <div className="w-1 h-1 bg-eco-amber/40 rounded-full"></div>
          </div>
          
          {}
          <div className="absolute bottom-2 right-4">
            <div className="w-1.5 h-1.5 bg-eco-blue/30 rounded-full"></div>
          </div>
        </div>
      )}
      
      {}
      {showEnvironment && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 border border-eco-primary/15 rounded-full"></div>
          </div>
          
          {}
          <div className="absolute top-1 left-1/3">
            <div className="w-2 h-2 bg-eco-green/30 rounded-full"></div>
          </div>
          <div className="absolute bottom-1 right-1/3">
            <div className="w-2 h-2 bg-eco-green/30 rounded-full"></div>
          </div>
        </div>
      )}
      
      {}
      <div className="absolute inset-0 bg-gradient-to-r from-eco-primary/5 via-eco-green/3 to-eco-amber/5 rounded-full blur-lg"></div>
    </div>
  );
}

