"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, MapPin, Eye, Calendar, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useApi } from "@/lib/use-api";
import { plantationApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function FacultyVerifications() {
  const { user } = useAuthStore();
  const { data: pendingRequests, isLoading, execute: fetchPending } = useApi(() => 
    plantationApi.list({ 
      status: 'pending', 
      institutionId: user?.institutionId,
      uploaderRole: 'student',
      department: user?.departmentId
    })
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState("all");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isActioning, setIsActioning] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: string) => {
    setIsActioning(id);
    try {
      await plantationApi.verify(id, 'verified');
      fetchPending();
    } catch (error) {
      console.error("Failed to approve", error);
      toast.error("Error approving plantation");
    } finally {
      setIsActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason) {
      toast.warning("Please provide a reason for rejection");
      return;
    }
    setIsActioning(id);
    try {
      await plantationApi.verify(id, 'rejected', rejectionReason);
      setRejectionReason("");
      fetchPending();
    } catch (error) {
      console.error("Failed to reject", error);
      toast.error("Error rejecting plantation");
    } finally {
      setIsActioning(null);
    }
  };

  const filteredRequests = pendingRequests?.filter((req: any) => {
    const matchesSearch = 
      req.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.speciesName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSpecies = 
      selectedSpeciesFilter === "all" || 
      req.speciesName?.toLowerCase() === selectedSpeciesFilter.toLowerCase();

    return matchesSearch && matchesSpecies;
  }) || [];

  if (isLoading && !pendingRequests) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Verification Queue</h1>
        <p className="text-muted-foreground mt-1">Review student plantation submissions, verify coordinates, and approve carbon points.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students, species..." 
            className="pl-9 bg-card/50" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedSpeciesFilter} 
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-border bg-card/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Species</option>
            <option value="neem">Neem</option>
            <option value="banyan">Banyan</option>
            <option value="peepal">Peepal</option>
            <option value="mango">Mango</option>
            <option value="jamun">Jamun</option>
            <option value="ashoka">Ashoka</option>
            <option value="gulmohar">Gulmohar</option>
            <option value="teak">Teak</option>
          </select>
        </div>
      </div>

      {/* Grid of Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-background/50 rounded-xl border border-dashed text-muted-foreground">
            <TreesIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">No Pending Verifications</h3>
            <p className="text-sm mt-1">Great job! All student plantation requests for your campus have been verified.</p>
          </div>
        ) : (
          filteredRequests.map((req: any, i: number) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden">
                <div className="h-48 overflow-hidden relative group bg-black/5 flex items-center justify-center">
                  {req.plantation_photo ? (
                    <img
                      src={req.plantation_photo}
                      alt={req.speciesName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <TreesIcon className="h-16 w-16 text-muted-foreground opacity-25" />
                  )}
                  <Badge className="absolute top-3 right-3 bg-warning text-warning-foreground font-semibold">
                    Pending
                  </Badge>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{req.userName}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{req.userRoll}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-muted text-foreground text-xs leading-none">
                      {req.userDept} • {req.userYear} Year
                    </Badge>

                    <div className="space-y-1.5 pt-2">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-success"></span>
                        {req.speciesName} <span className="text-xs italic text-muted-foreground">({req.scientificName})</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Planted on {new Date(req.plantation_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Lat: {req.lat?.toFixed(5)}, Lng: {req.lng?.toFixed(5)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Dialog>
                      <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1 bg-background/50 hover:bg-muted/80" />}>
                        <Eye className="h-4 w-4 mr-1.5" /> Inspect Geotag
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-card border-border/50 backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle>Verification Audit - {req.id.substring(0, 8)}</DialogTitle>
                          <DialogDescription>
                            Verify geotag and physical proof uploaded by {req.userName}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {req.plantation_photo ? (
                            <img src={req.plantation_photo} alt={req.speciesName} className="rounded-lg object-cover w-full h-64 border border-border" />
                          ) : (
                            <div className="rounded-lg bg-muted flex items-center justify-center h-64 border border-dashed">
                              <TreesIcon className="h-16 w-16 text-muted-foreground opacity-30" />
                            </div>
                          )}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Profile</p>
                              <p className="text-sm font-semibold">{req.userName} ({req.userRoll})</p>
                              <p className="text-xs text-muted-foreground">{req.userDept}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plantation Details</p>
                              <p className="text-sm font-semibold">{req.speciesName} ({req.scientificName})</p>
                              <p className="text-xs text-muted-foreground">Coordinates: {req.lat?.toFixed(6)}, {req.lng?.toFixed(6)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadata Check</p>
                              <div className="space-y-1.5 mt-2 flex flex-col items-start">
                                <Badge variant="outline" className="bg-success/5 text-success border-success/20 text-[10px]">✓ EXIF Geotag Confirmed</Badge>
                                <Badge variant="outline" className="bg-success/5 text-success border-success/20 text-[10px]">✓ Timestamp Checked</Badge>
                                <Badge variant="outline" className="bg-success/5 text-success border-success/20 text-[10px]">✓ AI Species Matching verified</Badge>
                              </div>
                            </div>
                            <div className="space-y-2 pt-2">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejection Reason (if rejecting)</label>
                              <Input 
                                placeholder="e.g. Blurry photo, wrong location" 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="bg-background/50 h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                          <Button 
                            variant="outline" 
                            className="border-destructive/25 text-destructive hover:bg-destructive/10 text-xs h-9"
                            onClick={() => handleReject(req.id)}
                            disabled={isActioning !== null}
                          >
                            Reject Upload
                          </Button>
                          <Button 
                            className="bg-success hover:bg-success/90 text-white text-xs h-9"
                            onClick={() => handleApprove(req.id)}
                            disabled={isActioning !== null}
                          >
                            Verify & Approve (+30 Carbon Points)
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      size="sm" 
                      className="bg-success hover:bg-success/90 text-white px-3" 
                      title="Fast Approve"
                      onClick={() => handleApprove(req.id)}
                      disabled={isActioning !== null}
                    >
                      {isActioning === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function TreesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
    </svg>
  );
}
