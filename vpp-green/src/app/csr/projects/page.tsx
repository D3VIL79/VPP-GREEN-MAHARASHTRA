"use client";

import { motion } from "framer-motion";
import { Briefcase, Building2, Trees, TrendingUp, ChevronRight, Award, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CsrProjects() {
  const router = useRouter();
  
  const adoptedProjects = [
    {
      name: "VPP College of Engineering & Visual Arts",
      location: "Sion, Mumbai",
      allocated: "₹2,50,000",
      planted: 1250,
      target: 1500,
      survivalRate: "96%",
      drivesCount: 2,
      campaigns: ["Sion Campus Greening Drive 2026", "Visual Arts Green Circle Project"],
      status: "On Track",
    },
    {
      name: "Manohar Phalke College (Architecture & Poly)",
      location: "Chunabhatti, Mumbai",
      allocated: "₹1,50,000",
      planted: 750,
      target: 1000,
      survivalRate: "92%",
      drivesCount: 1,
      campaigns: ["Phalke Outer Ring Afforestation"],
      status: "On Track",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Adopted Projects</h1>
          <p className="text-muted-foreground mt-1">Manage corporate adoptions, review college campus milestones, and monitor student execution progress.</p>
        </div>
        <div>
          <Button className="bg-primary hover:bg-primary/95 text-white rounded-full px-6">
            <Plus className="h-4 w-4 mr-2" /> Adopt New Campus
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {adoptedProjects.map((proj, i) => (
          <motion.div
            key={proj.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl text-foreground font-heading">{proj.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                      <Building2 className="h-3.5 w-3.5" /> {proj.location}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-success/5 text-success border-success/20 font-semibold">{proj.status}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Budget</span>
                    <span className="font-semibold text-sm sm:text-base text-foreground">{proj.allocated}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Saplings</span>
                    <span className="font-semibold text-sm sm:text-base text-foreground">{proj.planted} / {proj.target}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Survival</span>
                    <span className="font-semibold text-sm sm:text-base text-success">{proj.survivalRate}</span>
                  </div>
                </div>

                {/* Active drives list */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Active Campaigns ({proj.drivesCount})</span>
                  <div className="space-y-1.5">
                    {proj.campaigns.map((camp) => (
                      <div key={camp} className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-border/20 text-xs">
                        <span className="font-medium text-foreground">{camp}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" className="flex-1 bg-background/50 hover:bg-muted/80 text-xs" onClick={() => {
                    toast.info(`Fetching live tree coordinates for ${proj.name}...`);
                    setTimeout(() => router.push('/csr/dashboard'), 1000);
                  }}>
                    <Trees className="h-4 w-4 mr-1.5 text-success" /> View Tree Map
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger render={
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/95 text-white text-xs">
                        <Award className="h-4 w-4 mr-1.5" /> Funding Audit
                      </Button>
                    } />
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Financial & Impact Audit</DialogTitle>
                        <DialogDescription>
                          Deep review of the budget allocation and corresponding ecological yield for {proj.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm font-medium">Funds Released</span>
                          <span className="text-sm font-bold text-primary">{proj.allocated}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm font-medium">Verified Surviving Trees</span>
                          <span className="text-sm font-bold text-success">{Math.round((parseInt(proj.survivalRate)/100)*proj.planted)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm font-medium">Estimated CO2 Offset</span>
                          <span className="text-sm font-bold">{(proj.planted * 20.5).toLocaleString()} kg/yr</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium">Cost per Surviving Tree</span>
                          <span className="text-sm font-bold">₹{Math.round(parseInt(proj.allocated.replace(/[^0-9]/g, '')) / proj.planted)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button variant="outline" onClick={() => toast.success("Ledger downloaded to local machine.")}>Download PDF Copy</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
