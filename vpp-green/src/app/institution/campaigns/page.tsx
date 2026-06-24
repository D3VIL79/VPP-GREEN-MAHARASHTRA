"use client";

import { useEffect, useState } from "react";
import { BarChart3, Plus, Calendar, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApi } from "@/lib/use-api";
import { campaignApi, plantationApi } from "@/lib/api";
import { toast } from "sonner";

export default function InstitutionCampaigns() {
  const { data: campaigns, isLoading: isLoadingCampaigns, execute: fetchCampaigns } = useApi(campaignApi.list);
  const { data: plantations, execute: fetchPlantations } = useApi(plantationApi.list);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetTrees, setTargetTrees] = useState("");

  useEffect(() => {
    fetchCampaigns();
    fetchPlantations();
  }, [fetchCampaigns, fetchPlantations]);

  const handleCreateCampaign = async () => {
    if (!name || !startDate || !endDate || !targetTrees) {
      toast.warning("Please fill in all required fields.");
      return;
    }
    setIsCreating(true);
    try {
      await campaignApi.create({
        name,
        code: code || undefined,
        startDate,
        endDate,
        targetTrees: Number(targetTrees),
        status: 'active'
      });
      setIsDialogOpen(false);
      // Reset form
      setName("");
      setCode("");
      setStartDate("");
      setEndDate("");
      setTargetTrees("");
      fetchCampaigns();
      toast.success("Campaign created successfully!");
    } catch (err) {
      console.error("Failed to create campaign", err);
      toast.error("Failed to create campaign.");
    } finally {
      setIsCreating(false);
    }
  };

  const getCampaignProgress = (campId: string, target: number) => {
    if (!plantations) return { current: 0, percent: 0 };
    const current = plantations.filter((p: any) => p.campaign_id === campId && p.verificationStatus === 'verified').length;
    const percent = target > 0 ? Math.round((current / target) * 100) : 0;
    return { current, percent };
  };

  if (isLoadingCampaigns && !campaigns) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Plantation Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage institutional environmental drives.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> New Campaign
            </Button>
          } />
          <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Launch a new campus plantation drive for students and departments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="campName">Campaign Name *</Label>
                <Input id="campName" placeholder="e.g. VPP Greening Drive 2026" value={name} onChange={e => setName(e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campCode">Campaign Code (Optional)</Label>
                <Input id="campCode" placeholder="e.g. CAMP-VPP-2026" value={code} onChange={e => setCode(e.target.value)} className="bg-background/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Saplings *</Label>
                <Input id="target" type="number" placeholder="e.g. 5000" value={targetTrees} onChange={e => setTargetTrees(e.target.value)} className="bg-background/50" />
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button className="bg-primary hover:bg-primary/95 text-white" onClick={handleCreateCampaign} disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns?.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-background/50 rounded-xl border border-dashed text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No Campaigns Found</h3>
            <p className="text-sm mt-1">Get started by creating your first environmental plantation campaign.</p>
          </div>
        ) : (
          campaigns?.map((camp: any, i: number) => {
            const { current, percent } = getCampaignProgress(camp.id, camp.target_trees);
            return (
              <Card key={camp.id} className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{camp.campaign_name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 font-mono text-[10px]">
                    Code: {camp.campaign_code}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-primary">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(percent, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>{current} Verified</span>
                      <span>{camp.target_trees} Target</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-[10px] text-muted-foreground pt-0 border-t border-border/10 mt-3 p-4 flex items-center justify-between">
                  <span>Start: {new Date(camp.start_date).toLocaleDateString()}</span>
                  <span>End: {new Date(camp.end_date).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
