"use client";

import dynamic from 'next/dynamic';
import { MapMarker } from './Map';

// Dynamically import the Map component with SSR disabled
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-muted/30 border-2 border-dashed rounded-xl">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm">Loading GIS Map...</p>
      </div>
    </div>
  ),
});

interface DynamicMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function DynamicMap(props: DynamicMapProps) {
  return <Map {...props} />;
}
