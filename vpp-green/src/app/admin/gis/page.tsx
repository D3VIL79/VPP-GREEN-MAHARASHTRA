"use client";

import { useEffect, useState } from "react";
import { MapPin, Layers, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicMap } from "@/components/map/DynamicMap";
import { plantationApi } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminGIS() {
  const [plantations, setPlantations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setIsLoading(true);
      const res = await plantationApi.list();
      setPlantations(res.data);
    } catch (err) {
      console.error("Failed to fetch GIS data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (plantations.length === 0) return toast.error("No map data available to export.");
    const mapped = plantations.map(p => ({
      Tree_ID: p.id,
      Species: p.species_name,
      Latitude: p.lat,
      Longitude: p.lng,
      Status: p.status,
      Accuracy_Meters: p.location_accuracy_meters,
      Created_At: p.created_at
    }));
    downloadCSV(mapped, "SuperAdmin_GIS_Extract.csv");
  };

  const markers = plantations.filter(p => p.lat && p.lng).map(p => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    title: p.species_name || "Unknown Species",
    subtitle: `Status: ${p.status}`
  }));

  return (
    <div className="space-y-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">GIS Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Satellite and geographical tracking of state-wide plantations.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-card/50 backdrop-blur-sm" onClick={() => toast.info("Map layers feature coming in next update.")}>
            <Layers className="h-4 w-4 mr-2" /> Map Layers
          </Button>
          <Button variant="default" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Map Data
          </Button>
        </div>
      </div>

      <Card className="flex-1 border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
        <CardContent className="flex-1 p-0 relative bg-muted/20">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/50 backdrop-blur-sm z-10">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading GIS coordinates...</p>
            </div>
          ) : null}
          
          <div className="w-full h-full">
            <DynamicMap markers={markers} zoom={6} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
