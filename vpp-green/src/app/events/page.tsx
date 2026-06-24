"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Trophy, Award, Users, ChevronLeft, CalendarDays, Sparkles, CheckCircle2, User, Building2, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CampusEvent {
  id: string;
  name: string;
  description: string;
  scope: "departmental" | "institutional";
  department?: string;
  institutionId?: string;
  target: number;
  current: number;
  points: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
  creator: string;
}

const DEFAULT_EVENTS: CampusEvent[] = [
  {
    id: "evt-01",
    name: "Monsoon Neem Drive 2026",
    description: "Help plant 500 Neem saplings across the campus to improve canopy cover. Participants receive an additional 100 carbon points per sapling.",
    scope: "institutional",
    institutionId: "00000000-0000-0000-0000-000000000001",
    target: 500,
    current: 312,
    points: 100,
    startDate: "2026-06-01",
    endDate: "2026-07-31",
    status: "active",
    creator: "VVPCOE & VA Admin"
  },
  {
    id: "evt-02",
    name: "AI & ML Green Campus Challenge",
    description: "A departmental challenge for CSE students to plant trees and verify them using the AI health analyzer. Get +50 carbon points bonus.",
    scope: "departmental",
    department: "Computer Science & Engineering (AI & ML, Data Science)",
    institutionId: "00000000-0000-0000-0000-000000000001",
    target: 100,
    current: 64,
    points: 50,
    startDate: "2026-06-10",
    endDate: "2026-06-30",
    status: "active",
    creator: "Dr. Anand Joshi"
  },
  {
    id: "evt-03",
    name: "Fine Art Green Sculptures Drive",
    description: "Planting Ashoka and Gulmohar trees around the arts building to create beautiful landscape arches. Get +50 carbon points bonus.",
    scope: "departmental",
    department: "Fine Art",
    institutionId: "00000000-0000-0000-0000-000000000001",
    target: 80,
    current: 45,
    points: 50,
    startDate: "2026-06-05",
    endDate: "2026-06-25",
    status: "active",
    creator: "Prof. Swati Mehta"
  }
];

import { eventsApi } from "@/lib/api";

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myParticipations, setMyParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"departmental" | "institutional">("departmental");
  const [target, setTarget] = useState("");
  const [points, setPoints] = useState("50");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load events and user participations from Supabase
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, participations } = await eventsApi.list();
      
      const mappedEvents: CampusEvent[] = data.map((e: any) => ({
        id: e.id,
        name: e.event_name,
        description: e.description,
        scope: e.scope,
        department: e.department || undefined,
        institutionId: e.institution_id,
        target: e.target_trees,
        current: e.current_trees,
        points: e.bonus_points,
        startDate: e.start_date,
        endDate: e.end_date,
        status: e.status,
        creator: 'Campus Coordinator'
      }));

      setEvents(mappedEvents);
      setMyParticipations(participations);
    } catch (err: any) {
      console.error("Failed to load events:", err);
      toast.error("Failed to load events: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateEvent = async () => {
    if (!name.trim() || !description.trim() || !target || !startDate || !endDate) {
      toast.warning("Please fill in all fields.");
      return;
    }
    if (!user?.institutionId) {
      toast.error("No institution associated with your account.");
      return;
    }

    setSubmitting(true);
    try {
      await eventsApi.create({
        name: name.trim(),
        description: description.trim(),
        scope,
        department: scope === "departmental" ? (user?.departmentId || undefined) : undefined,
        institutionId: user.institutionId,
        target: Number(target),
        points: Number(points),
        startDate,
        endDate
      });

      toast.success("Drive created successfully! Campus notified.");
      
      // Reset form
      setName("");
      setDescription("");
      setScope("departmental");
      setTarget("");
      setPoints("50");
      setStartDate("");
      setEndDate("");
      setIsCreateOpen(false);
      
      loadData();
    } catch (err: any) {
      toast.error("Failed to create drive: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleParticipate = async (eventId: string) => {
    try {
      await eventsApi.participate(eventId);
      toast.success(`Registered for event! Submit tree plantations during the drive to earn bonus carbon points.`);
      loadData();
    } catch (err: any) {
      toast.error("Failed to participate: " + err.message);
    }
  };

  const getBackUrl = () => {
    if (!user) return "/login";
    const role = user.role?.toLowerCase();
    if (role === "student") return "/student/dashboard";
    if (role === "faculty") return "/faculty/dashboard";
    if (role === "department_hod") return "/hod/dashboard";
    if (role === "institution_admin") return "/institution/dashboard";
    if (role === "super_admin") return "/admin/dashboard";
    return "/student/dashboard";
  };

  // Roles permission check
  const isHOD = user?.role === "department_hod" || user?.role === "institution_admin" || user?.role === "super_admin";

  // Filter events based on HOD department or user department
  const filteredEvents = events.filter(e => {
    if (e.scope === "departmental") {
      // HOD or Student only sees events matching their department
      return e.department === user?.departmentId;
    }
    // Institutional events are visible to users matching their institution
    return e.institutionId === user?.institutionId;
  });

  return (
    <div className="min-h-screen bg-muted/20 pb-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="h-16 bg-card border-b border-border/50 sticky top-0 z-30 backdrop-blur-md bg-card/80">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(getBackUrl())} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-lg text-primary">Campus Drives & Events</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground">{user?.name || "Guest User"}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{user?.role || "Visitor"}</span>
            </div>
            {isHOD && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/95 text-white rounded-full">
                <Plus className="h-4 w-4 mr-2" /> Launch Drive
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: Events List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Active Drives</h1>
            <p className="text-muted-foreground mt-1">
              Participate in ongoing campus greening events to earn extra bonus carbon points.
            </p>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40 text-primary" />
                <h3 className="text-lg font-medium text-foreground">No Active Drives</h3>
                <p className="text-sm mt-1 px-4">There are no environmental campaigns active for your department or college right now.</p>
              </Card>
            ) : (
              filteredEvents.map((evt) => {
                const percent = Math.round((evt.current / evt.target) * 100);
                const participated = myParticipations.includes(evt.id);
                return (
                  <motion.div key={evt.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      {/* Points tag */}
                      <div className="absolute top-0 right-0 bg-primary/10 border-l border-b border-primary/20 text-primary font-bold text-xs px-4 py-2 rounded-bl-xl flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />
                        +{evt.points} Carbon Points
                      </div>

                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={evt.scope === 'institutional' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'}>
                            {evt.scope === 'institutional' ? 'INSTITUTION' : 'DEPARTMENT'}
                          </Badge>
                          {evt.department && (
                            <span className="text-[10px] text-muted-foreground font-mono">{evt.department}</span>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight text-foreground pr-32">{evt.name}</CardTitle>
                        <CardDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {evt.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6 pb-6">
                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold text-foreground">
                            <span>Plantation Progress</span>
                            <span>{evt.current} / {evt.target} saplings ({percent}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-primary to-green-600 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>

                        {/* Footer Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4 text-primary" />
                              <span>Ends: {new Date(evt.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-4 w-4 text-primary" />
                              <span>Organized by: {evt.creator}</span>
                            </div>
                          </div>

                          {participated ? (
                            <Button disabled className="bg-success/10 text-success border border-success/20 rounded-full flex items-center gap-1.5 px-6">
                              <CheckCircle2 className="h-4 w-4" /> Registered
                            </Button>
                          ) : (
                            <Button onClick={() => handleParticipate(evt.id)} className="bg-primary hover:bg-primary/95 text-white rounded-full px-6 flex items-center gap-1.5 group-hover:translate-y-[-2px] transition-transform">
                              <Sparkles className="h-4 w-4" /> Participate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Stats & Participations */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary animate-pulse" /> My Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Subscribed Drives</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{myParticipations.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Carbon Points Gained</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {myParticipations.reduce((acc, curr) => {
                      const evt = events.find(e => e.id === curr);
                      return acc + (evt ? evt.points : 0);
                    }, 0)} pts
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Registered Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myParticipations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No active participations yet. Join a drive to start tracking.</p>
              ) : (
                myParticipations.map(id => {
                  const evt = events.find(e => e.id === id);
                  if (!evt) return null;
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{evt.name}</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Deadline: {new Date(evt.endDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-success/15 text-success hover:bg-success/20 border-none font-bold">+{evt.points} pts</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Launch Drive Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle>Launch Campus Drive</DialogTitle>
            <DialogDescription>
              Create a new targeted tree planting campaign for your Sion campus and reward participants with carbon points.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="evtName">Drive Name *</Label>
              <Input id="evtName" placeholder="e.g. CSE Banyan Plantation Week" value={name} onChange={e => setName(e.target.value)} className="bg-background/50 border-muted-foreground/20" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evtDesc">Description *</Label>
              <Textarea id="evtDesc" placeholder="Describe the goal and specific guidelines (e.g. species to plant, locations)..." value={description} onChange={e => setDescription(e.target.value)} className="bg-background/50 border-muted-foreground/20 min-h-20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scope">Scope *</Label>
                <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                  <SelectTrigger id="scope" className="bg-background/50 border-muted-foreground/20">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="institutional">Institutional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Bonus Reward *</Label>
                <Select value={points} onValueChange={setPoints}>
                  <SelectTrigger id="points" className="bg-background/50 border-muted-foreground/20">
                    <SelectValue placeholder="Carbon Points" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="30">+30 Carbon Points</SelectItem>
                    <SelectItem value="50">+50 Carbon Points</SelectItem>
                    <SelectItem value="100">+100 Carbon Points</SelectItem>
                    <SelectItem value="150">+150 Carbon Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Saplings *</Label>
                <Input id="target" type="number" placeholder="e.g. 150" value={target} onChange={e => setTarget(e.target.value)} className="bg-background/50 border-muted-foreground/20" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background/50 border-muted-foreground/20" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-background/50 border-muted-foreground/20" />
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/95 text-white" onClick={handleCreateEvent} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Launch Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
