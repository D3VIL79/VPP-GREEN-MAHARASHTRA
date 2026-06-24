"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Mail, ExternalLink, Award, Trees, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/use-api";
import { studentApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function FacultyStudents() {
  const { user } = useAuthStore();
  const { data: students, isLoading, execute: fetchStudents } = useApi(() => 
    studentApi.list({ 
      institutionId: user?.institutionId,
      department: user?.departmentId
    })
  );

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (isLoading && !students) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredStudents = students?.filter((student: any) => 
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.dept?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Summary stats
  const totalStudents = students?.length || 0;
  const totalTrees = students?.reduce((acc: number, s: any) => acc + s.trees, 0) || 0;
  const totalPending = students?.reduce((acc: number, s: any) => acc + s.pending, 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground mt-1">Track and manage environmental participation for students assigned to your departments.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Mentored Students</p>
              <h3 className="text-3xl font-bold font-heading">{totalStudents}</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Assigned Trees Planted</p>
              <h3 className="text-3xl font-bold font-heading">{totalTrees}</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-success/10">
              <Trees className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Verifications</p>
              <h3 className="text-3xl font-bold font-heading text-warning">{totalPending}</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-warning/10">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Assigned Student Directory</CardTitle>
              <CardDescription>VPP Educational Complex Student Records.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search Roll No, Name..." 
                className="pl-9 bg-background/50" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Planted Trees</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Carbon Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{student.roll}</TableCell>
                      <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.dept}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">{student.institutionName}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{student.year}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{student.trees}</TableCell>
                      <TableCell className="text-right">
                        {student.pending > 0 ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {student.pending} Pending
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-primary font-semibold">{student.points} pts</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                            title="Contact Student"
                            onClick={() => window.open(`mailto:${student.email || ''}`)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
