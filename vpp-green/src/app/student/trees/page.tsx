"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trees, Plus, MapPin, Calendar, Sparkles, PlusCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useApi } from "@/lib/use-api";
import { plantationApi, monitoringApi, PlantationResponse } from "@/lib/api";

export default function StudentTrees() {
  const { user } = useAuthStore();
  const { data: trees, isLoading, execute: fetchTrees } = useApi(() => plantationApi.list({ userId: user?.id }));
  const [selectedTree, setSelectedTree] = useState<PlantationResponse | null>(null);
  
  // Monitoring form state
  const [healthStatus, setHealthStatus] = useState("HEALTHY");
  const [heightCm, setHeightCm] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitHealthUpdate = async () => {
    if (!selectedTree || !heightCm || !imageBase64) return;
    setIsSubmitting(true);
    try {
      await monitoringApi.addUpdate({
        plantationId: selectedTree.id,
        heightCm: Number(heightCm),
        healthStatus,
        photoUrl: "https://minio.vpp.com/placeholder.jpg", // Replace with actual base64 upload to MinIO later
      });
      setIsDialogOpen(false);
      // Reset form
      setHeightCm("");
      setImageBase64(null);
      setHealthStatus("HEALTHY");
      
      // Refresh trees
      fetchTrees();
    } catch (error) {
      console.error("Failed to submit monitoring update", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !trees) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Planted Trees</h1>
          <p className="text-muted-foreground mt-1">Review the growth status of your trees, update monitoring photos, and track carbon metrics.</p>
        </div>
        <Link href="/student/add-tree">
          <Button className="bg-primary hover:bg-primary/95 text-white rounded-full px-6">
            <Plus className="h-4 w-4 mr-2" /> Plant New Tree
          </Button>
        </Link>
      </div>

      {!trees?.length ? (
        <Card className="border-dashed border-2 bg-background/50 flex flex-col items-center justify-center p-12 text-center">
          <Trees className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Trees Planted Yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Start your environmental impact journey by planting your first tree.</p>
          <Link href="/student/add-tree">
            <Button>Plant a Tree</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trees.map((tree, i) => (
            <motion.div
              key={tree.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden">
                <div className="h-40 overflow-hidden relative bg-muted flex items-center justify-center">
                  {tree.plantation_photo ? (
                    <img src={tree.plantation_photo} alt={tree.speciesName} className="w-full h-full object-cover" />
                  ) : (
                    <Trees className="h-16 w-16 text-muted-foreground opacity-20" />
                  )}
                  <Badge className={`absolute top-3 right-3 font-semibold ${
                    tree.status === "HEALTHY" ? "bg-success text-white" :
                    tree.status === "WILTING" ? "bg-warning text-warning-foreground" :
                    tree.status === "DEAD" ? "bg-destructive text-white" :
                    "bg-primary text-white"
                  }`}>
                    {tree.status}
                  </Badge>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base text-foreground leading-tight">{tree.speciesName || 'Unknown Species'}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{tree.id.split('-')[0]}</p>

                    <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Planted on {new Date(tree.createdAt || tree.plantation_date).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-accent" /> Est. Offset: <span className="font-semibold text-success">{tree.speciesName === 'Neem' ? '22.6' : tree.speciesName === 'Mango' ? '20.0' : tree.speciesName === 'Banyan' ? '28.5' : '18.5'} kg/yr</span>
                      </p>
                      <p className="flex items-start gap-1 leading-normal">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="truncate" title={`${tree.lat || 'Unknown'}, ${tree.lng || 'Unknown'}`}>
                          {typeof tree.lat === 'number' ? tree.lat.toFixed(4) : (tree.lat ? Number(tree.lat).toFixed(4) : 'N/A')}, {typeof tree.lng === 'number' ? tree.lng.toFixed(4) : (tree.lng ? Number(tree.lng).toFixed(4) : 'N/A')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Dialog open={isDialogOpen && selectedTree?.id === tree.id} onOpenChange={(open) => {
                      if (open) setSelectedTree(tree);
                      setIsDialogOpen(open);
                    }}>
                      <DialogTrigger render={
                        <Button variant="outline" size="sm" className="flex-1 text-xs bg-background/50">
                          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Log Health
                        </Button>
                      } />
                      <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-md">
                        <DialogHeader>
                          <DialogTitle>Log Tree Growth Progress</DialogTitle>
                          <DialogDescription>
                            Upload a fresh photo of your tree to maintain your survival audit and earn carbon points.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageUpload">Upload Current Tree Photo</Label>
                            <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="statusSelect">Current Tree Status</Label>
                            <select 
                              id="statusSelect" 
                              value={healthStatus}
                              onChange={e => setHealthStatus(e.target.value)}
                              className="w-full h-10 px-3 rounded-md border border-border/50 bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="HEALTHY">Healthy (Green & Leafy)</option>
                              <option value="WILTING">Wilting (Dry / Needs Water)</option>
                              <option value="DISEASED">Diseased (Pests / Damage)</option>
                              <option value="DEAD">Dead</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="heightInput">Approximate Height (in cm)</Label>
                            <Input 
                              id="heightInput" 
                              type="number" 
                              value={heightCm}
                              onChange={e => setHeightCm(e.target.value)}
                              placeholder="e.g. 45" 
                              className="bg-background/50" 
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                          <Button 
                            className="bg-primary hover:bg-primary/95 text-white" 
                            onClick={submitHealthUpdate}
                            disabled={!imageBase64 || !heightCm || isSubmitting}
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Health Update
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="sm" className="text-xs hover:bg-muted">
                      History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
