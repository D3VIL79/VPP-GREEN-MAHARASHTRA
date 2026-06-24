"use client";

import { motion } from "framer-motion";
import { Target, IndianRupee, PieChart, TrendingUp, HandCoins, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CsrSponsorships() {
  const sponsorsList = [
    {
      id: "SPON-012",
      campaign: "Sion Campus Reforestation Campaign (Phase 1)",
      allocated: "₹2,50,000",
      disbursed: "₹2,50,000",
      saplingsCount: 1250,
      survivalRate: "96%",
      status: "Fully Funded",
    },
    {
      id: "SPON-013",
      campaign: "Manohar Phalke Architecture Outer Ring Greening",
      allocated: "₹1,50,000",
      disbursed: "₹1,20,000",
      saplingsCount: 750,
      survivalRate: "92%",
      status: "Active Disbursals",
    },
    {
      id: "SPON-014",
      campaign: "Eastern Express Highway Buffer Belt Drive",
      allocated: "₹2,00,000",
      disbursed: "₹0",
      saplingsCount: 1000,
      survivalRate: "N/A",
      status: "Approval Pending",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Sponsorship Tracking</h1>
          <p className="text-muted-foreground mt-1">Review funding disbursements, cost audit ledgers, and carbon impact yields of sponsored drives.</p>
        </div>
        <div>
          <Dialog>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/95 text-white rounded-full px-6">
                <Plus className="h-4 w-4 mr-2" /> Sponsor New Drive
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sponsorship Proposal</DialogTitle>
                <DialogDescription>
                  Define budget constraints and species targets for a new statewide tree drive.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="campaignName" className="text-right">Campaign</Label>
                  <Input id="campaignName" placeholder="Green Campus Phase 2" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="budget" className="text-right">Budget (₹)</Label>
                  <Input id="budget" type="number" placeholder="500000" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Sponsorship proposal submitted for review!")}>Submit Proposal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-6 w-6 text-foreground" />
              <span className="text-3xl font-bold font-heading">6,00,000</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">FY 2025-2026 Allocation</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funds Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold font-heading text-primary">3,70,000</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">61.6% disbursed</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sponsored Saplings</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-heading">3,000</span>
            <p className="text-xs text-muted-foreground mt-1">Cost average: ₹200/verified tree</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Survival Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-heading text-success">94.5%</span>
            <p className="text-xs text-muted-foreground mt-1">Higher than state benchmark (85%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Listing */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Sponsorship Allocation Details</CardTitle>
          <CardDescription>Review auditing transactions per sponsored campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Sponsorship ID</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Campaign Name</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Budget Allocated</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Disbursed</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Saplings</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Survival</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sponsorsList.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td className="py-4 px-4 font-medium text-foreground">{item.campaign}</td>
                    <td className="py-4 px-4 text-right font-medium">{item.allocated}</td>
                    <td className="py-4 px-4 text-right font-medium text-primary">{item.disbursed}</td>
                    <td className="py-4 px-4 text-right">{item.saplingsCount}</td>
                    <td className="py-4 px-4 text-right text-success font-semibold">{item.survivalRate}</td>
                    <td className="py-4 px-4 text-right">
                      <Badge className={
                        item.status === "Fully Funded" ? "bg-success text-white" :
                        item.status === "Active Disbursals" ? "bg-primary text-white" :
                        "bg-muted text-foreground"
                      }>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
