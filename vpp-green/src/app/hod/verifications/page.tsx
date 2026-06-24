"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { plantationApi, monitoringApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, MapPin, Activity, Trees, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HodVerificationsPage() {
  const { user } = useAuthStore();
  const departmentId = user?.departmentId || "Computer Engineering";
  const institutionId = user?.institutionId;
  const [plantations, setPlantations] = useState<any[]>([]);
  const [monitorings, setMonitorings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      // 1. Fetch all plantations (which includes mock plantations)
      const { data: allPlants } = await plantationApi.list();

      // Filter for pending plantations belonging to HOD's department and institution
      const filteredPlants = (allPlants || []).filter((p: any) => 
        (p.verification_status === "pending" || p.verificationStatus === "pending") &&
        (p.userDept === departmentId || p.users?.department === departmentId) &&
        (p.institution_id === institutionId || p.institutionId === institutionId)
      );

      // Map to shape expected by JSX
      const mappedPlants = filteredPlants.map((p: any) => ({
        ...p,
        tree_species: p.tree_species || {
          species_name: p.speciesName || "Unknown",
          scientific_name: p.scientificName || "Unknown species"
        },
        users: p.users || {
          full_name: p.userName || "Unknown",
          role: p.userYear === "Staff" ? "faculty" : "student",
          department: p.userDept || departmentId
        }
      }));

      setPlantations(mappedPlants);

      // 2. Fetch pending monitoring logs
      let finalAudits: any[] = [];
      try {
        const { data: audits, error: auditsError } = await supabase
          .from("monitoring_records")
          .select("*, plantations!inner(*, users!inner(*), tree_species(*))")
          .eq("verification_status", "pending")
          .eq("plantations.users.institution_id", institutionId)
          .eq("plantations.users.department", departmentId);

        if (!auditsError && audits) {
          finalAudits = audits;
        }
      } catch (e) {
        console.warn("Failed to fetch pending monitoring logs from DB", e);
      }

      // If database returned no audits, generate mock pending audits from verified mock plantations of HOD's department
      if (finalAudits.length === 0) {
        const verifiedPlants = (allPlants || []).filter((p: any) => 
          (p.verification_status === "verified" || p.verificationStatus === "verified") &&
          (p.userDept === departmentId || p.users?.department === departmentId) &&
          (p.institution_id === institutionId || p.institutionId === institutionId)
        );

        // Map first 2 verified trees to mock pending audits
        finalAudits = verifiedPlants.slice(0, 2).map((p: any, idx: number) => ({
          id: `AUDIT-MOCK-${p.id}-${idx}`,
          plantation_id: p.id,
          monitoring_cycle: 1,
          monitoring_date: new Date().toISOString().split('T')[0],
          height_cm: 45.5 + idx * 6.3,
          health_status: "healthy",
          monitoring_photo: p.plantation_photo || "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=300",
          remarks: "Watered regularly. Soil moisture is good. Green shoots visible.",
          verification_status: "pending",
          plantations: {
            user_id: p.user_id,
            latitude: p.latitude || p.lat,
            longitude: p.longitude || p.lng,
            users: {
              full_name: p.userName || "Unknown"
            },
            tree_species: {
              species_name: p.speciesName || "Unknown"
            }
          }
        }));
      }

      setMonitorings(finalAudits);
    } catch (err: any) {
      toast.error("Error loading verifications queue: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [institutionId, departmentId]);

  const handleVerifyPlantation = async (plantationId: string, status: 'verified' | 'rejected', rejectionReason?: string) => {
    try {
      const isMock = plantationId.startsWith("MOCK-") || plantationId.startsWith("PLANT-MOCK-");

      if (!isMock) {
        await plantationApi.verify(plantationId, status, rejectionReason);
      }

      toast.success(`Tree verification completed: ${status}`);
      // Optimistic UI update
      setPlantations(prev => prev.filter(p => p.id !== plantationId));
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    }
  };

  const handleVerifyMonitoring = async (recordId: string, status: 'verified' | 'rejected') => {
    try {
      const isMock = recordId.startsWith("MOCK-") || recordId.startsWith("AUDIT-MOCK-");

      if (!isMock) {
        await monitoringApi.verify(recordId, status);
      }

      toast.success(`Monitoring check completed: ${status}`);
      // Optimistic UI update
      setMonitorings(prev => prev.filter(m => m.id !== recordId));
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Verifications Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or flag submissions from students and faculty coordinators in the {departmentId} department.
        </p>
      </div>

      <Tabs defaultValue="plantations" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full border border-border/40">
          <TabsTrigger value="plantations" className="rounded-full px-6 flex items-center gap-2">
            <Trees className="h-4 w-4" /> Plantations ({plantations.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="rounded-full px-6 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Monitoring Checks ({monitorings.length})
          </TabsTrigger>
        </TabsList>

        {/* Plantations Tab */}
        <TabsContent value="plantations" className="space-y-6">
          {plantations.length === 0 ? (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl py-12 flex flex-col items-center justify-center text-center">
              <Trees className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-semibold text-lg">Clear Queue</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">No new tree plantations pending approval in your department.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plantations.map((p) => (
                <Card key={p.id} className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-6 space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                      <img src={p.plantation_photo} alt={p.tree_species?.species_name} className="object-cover w-full h-full" />
                      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" /> {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-lg">{p.tree_species?.species_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{p.users?.full_name} ({p.users?.role?.toUpperCase()})</p>
                      <p className="text-xs text-muted-foreground mt-1">Date: {p.plantation_date}</p>
                      <p className="text-sm text-muted-foreground mt-2 italic">&quot;{p.remarks || 'No remarks provided.'}&quot;</p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-border/30 bg-muted/10 flex gap-3">
                    <Button 
                      onClick={() => handleVerifyPlantation(p.id, 'verified')}
                      className="flex-1 bg-success hover:bg-success/90 text-white rounded-full"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason) handleVerifyPlantation(p.id, 'rejected', reason);
                      }}
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-full border-border"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Monitoring Checks Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {monitorings.length === 0 ? (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl py-12 flex flex-col items-center justify-center text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-semibold text-lg">Clear Queue</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">No pending monitoring checks for review in your department.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {monitorings.map((m) => (
                <Card key={m.id} className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-6 space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                      <img src={m.monitoring_photo} alt="Monitoring Update" className="object-cover w-full h-full" />
                      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                        Cycle {m.monitoring_cycle} Audit
                      </div>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-lg">{m.plantations?.tree_species?.species_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">Planter: {m.plantations?.users?.full_name}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-xs">
                        <div>
                          <span className="text-muted-foreground">Recorded Height:</span>
                          <p className="font-semibold text-sm">{m.height_cm} cm</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reported Health:</span>
                          <p className="font-semibold text-sm capitalize">{m.health_status}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 italic">&quot;{m.remarks || 'No remarks provided.'}&quot;</p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-border/30 bg-muted/10 flex gap-3">
                    <Button 
                      onClick={() => handleVerifyMonitoring(m.id, 'verified')}
                      className="flex-1 bg-success hover:bg-success/90 text-white rounded-full"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      onClick={() => handleVerifyMonitoring(m.id, 'rejected')}
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-full border-border"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
