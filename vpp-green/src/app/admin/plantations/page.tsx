"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trees, Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/use-api";
import { plantationApi } from "@/lib/api";
import { toast } from "sonner";

export default function GlobalPlantations() {
  const { data: allTrees, execute: fetchAllTrees, isLoading } = useApi(plantationApi.list);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllTrees();
  }, [fetchAllTrees]);

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await plantationApi.verify(id, status);
      // Optimistically update or refetch
      fetchAllTrees();
      toast.success(`Tree plantation successfully ${status}.`);
    } catch (e: any) {
      toast.error(`Error updating verification: ${e.message}`);
    }
  };

  const filteredTrees = allTrees?.filter((tree: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (tree.speciesName || 'Unknown').toLowerCase().includes(searchLower) ||
      (tree.userName || 'Unknown').toLowerCase().includes(searchLower) ||
      (tree.userDept || 'Unknown').toLowerCase().includes(searchLower) ||
      (tree.id || '').toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Global Plantation Explorer</h1>
          <p className="text-muted-foreground mt-1">God Mode: View and manually override every tree plantation in the system.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trees className="h-5 w-5 text-primary" />
                Statewide Plantations Registry
              </CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search trees, planters..." 
                className="pl-9 bg-background/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Plantation ID</TableHead>
                  <TableHead>Planter Details</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Health (AI)</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Admin Override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading plantations from database...</TableCell>
                  </TableRow>
                ) : filteredTrees.length > 0 ? (
                  filteredTrees.map((tree: any) => (
                    <TableRow key={tree.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-xs text-muted-foreground">{tree.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{tree.userName}</div>
                        <div className="text-xs text-muted-foreground">{tree.userDept}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{tree.speciesName}</div>
                        <div className="text-xs text-muted-foreground italic">{tree.scientificName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          tree.status === 'HEALTHY' ? 'bg-success/10 text-success' :
                          tree.status === 'WILTING' ? 'bg-warning/10 text-warning' :
                          tree.status === 'DEAD' ? 'bg-red-500/10 text-red-500' : 'bg-muted/50'
                        }>
                          {tree.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tree.verificationStatus === 'verified' ? (
                          <div className="flex items-center text-success text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1"/> Verified</div>
                        ) : tree.verificationStatus === 'rejected' ? (
                          <div className="flex items-center text-red-500 text-sm font-medium"><XCircle className="h-4 w-4 mr-1"/> Rejected</div>
                        ) : (
                          <div className="flex items-center text-warning text-sm font-medium"><AlertCircle className="h-4 w-4 mr-1"/> Pending</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success" onClick={() => handleVerify(tree.id, 'verified')}>
                            Force Verify
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-500" onClick={() => handleVerify(tree.id, 'rejected')}>
                            Force Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No plantations found matching your search.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
