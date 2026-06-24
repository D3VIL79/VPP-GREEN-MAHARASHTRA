"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Users, ShieldAlert, AwardIcon, Sparkles, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function GlobalLeaderboardPage() {
  const { user } = useAuthStore();
  const currentRole = user?.role?.toUpperCase() || "";
  const canManage = currentRole === "SUPER_ADMIN" || currentRole === "INSTITUTION_ADMIN";

  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("Computer Engineering");
  const [loading, setLoading] = useState(true);

  // Fetch all users with their verified plantations and points
  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, plantations!plantations_user_id_fkey(*), leaderboard_points(points)');

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedUsers = data.map((u: any) => {
          const verifiedTrees = u.plantations?.filter((p: any) => p.verification_status === 'verified').length || 0;
          const totalPoints = u.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
          return {
            id: u.id,
            name: u.full_name,
            role: u.role || 'student',
            department: u.department || 'Computer Engineering',
            trees: verifiedTrees,
            points: totalPoints,
            institutionId: u.institution_id || '00000000-0000-0000-0000-000000000001',
            roll: u.mobile ? `VPP-${u.role === 'faculty' ? 'FAC' : 'STU'}-${u.mobile.slice(-4)}` : 'VPP-MOCK'
          };
        });
        setUsersList(mappedUsers);
      } else {
        // GENERATE OFFLINE MOCK USERS matching 8 departments, 3 faculty, 7 students per department!
        const depts = [
          { name: 'Computer Engineering', phoneIdx: 30, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 4 },
          { name: 'Information Technology', phoneIdx: 37, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 7 },
          { name: 'Computer Science & Engineering (AI & ML, Data Science)', phoneIdx: 44, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 10 },
          { name: 'Electronics & Computer Science', phoneIdx: 51, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 13 },
          { name: 'Mechatronics Engineering', phoneIdx: 58, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 16 },
          { name: 'Fine Art', phoneIdx: 65, instId: '00000000-0000-0000-0000-000000000001', facPhoneIdx: 19 },
          { name: 'Department of Architecture', phoneIdx: 72, instId: '00000000-0000-0000-0000-000000000003', facPhoneIdx: 22 },
          { name: 'Department of Law', phoneIdx: 79, instId: '00000000-0000-0000-0000-000000000002', facPhoneIdx: 25 }
        ];

        const studentNames: Record<number, string> = {
          30: 'Amit Sharma', 31: 'Yash Shinde', 32: 'Sneha Reddy', 33: 'Aditya Kulkarni', 34: 'Neha Gokhale', 35: 'Yuvraj Patil', 36: 'Tanvi Mehta',
          37: 'Priya Patel', 38: 'Abhishek Rane', 39: 'Komal Thorat', 40: 'Rohit Pawar', 41: 'Divya Salve', 42: 'Rahul Deshmukh', 43: 'Vikram Singh',
          44: 'Riya Sawant', 45: 'Siddharth Patil', 46: 'Pranav Raje', 47: 'Shreya Kale', 48: 'Sneha Joshi', 49: 'Ananya Rane', 50: 'Ishita Verma',
          51: 'Dev Thakkar', 52: 'Pooja Nair', 53: 'Gaurav Kadam', 54: 'Tanmay Joshi', 55: 'Nidhi Desai', 56: 'Sanket Patil', 57: 'Tejaswini Rane',
          58: 'Aryan Sawant', 59: 'Kiran Shinde', 60: 'Sameer Gawde', 61: 'Asha Pawar', 62: 'Nitin Kadam', 63: 'Radhika Patil', 64: 'Kunal Sawant',
          65: 'Ketan Sawant', 66: 'Mansi Patil', 67: 'Aniket Rane', 68: 'Arjun Naik', 69: 'Kavita Bhosle', 70: 'Manish Gaikwad', 71: 'Sachin Kadam',
          72: 'Priyanka Patil', 73: 'Rahul Sawant', 74: 'Siddharth Rane', 75: 'Prisha Gokhale', 76: 'Neel Shinde', 77: 'Gauri Sawant', 78: 'Jayesh Patil',
          79: 'Kunal More', 80: 'Divya Joshi', 81: 'Aakash Salvi', 82: 'Deepa Kulkarni', 83: 'Harsh Rane', 84: 'Shruti Pawar', 85: 'Mayur Kadam'
        };

        const facultyNames: Record<number, string> = {
          4: 'Dr. M. Kadam', 5: 'Prof. A. Sawant', 6: 'Prof. S. Rane',
          7: 'Prof. S. Patil', 8: 'Dr. R. Naik', 9: 'Prof. J. Mehta',
          10: 'Dr. A. Joshi', 11: 'Prof. K. Shah', 12: 'Dr. S. Shinde',
          13: 'Prof. S. Deshpande', 14: 'Dr. M. Rao', 15: 'Prof. N. Kadam',
          16: 'Dr. N. Rane', 17: 'Prof. P. Shinde', 18: 'Prof. D. Pawar',
          19: 'Prof. S. Mehta', 20: 'Dr. V. Gawde', 21: 'Prof. R. Patil',
          22: 'Prof. K. Shinde', 23: 'Dr. P. Sawant', 24: 'Prof. A. Kulkarni',
          25: 'Dr. A. Naik', 26: 'Prof. V. Thorat', 27: 'Prof. G. Bhosle'
        };

        const offlineList: any[] = [];

        depts.forEach((dept) => {
          // Generate 7 students per dept
          for (let i = 0; i < 7; i++) {
            const idx = dept.phoneIdx + i;
            const name = studentNames[idx];
            const points = Math.floor(Math.random() * 5000) + 100;
            offlineList.push({
              id: `stu-${idx}`,
              name: name,
              role: 'student',
              department: dept.name,
              trees: 5,
              points: points,
              institutionId: dept.instId,
              roll: `VPP-STU-00${idx}`
            });
          }

          // Generate 3 faculty per dept
          for (let i = 0; i < 3; i++) {
            const idx = dept.facPhoneIdx + i;
            const name = facultyNames[idx];
            const points = Math.floor(Math.random() * 5000) + 100;
            offlineList.push({
              id: `fac-${idx}`,
              name: name,
              role: 'faculty',
              department: dept.name,
              trees: 5,
              points: points,
              institutionId: dept.instId,
              roll: `VPP-FAC-00${idx}`
            });
          }
        });

        setUsersList(offlineList);
      }
    } catch (err: any) {
      toast.error("Error fetching leaderboard: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const handleGiveBonus = async (deptName: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const members = usersList.filter((u: any) => u.department === deptName);
      if (members.length === 0) {
        toast.info("No members in this department to reward.");
        return;
      }

      // Award 50 bonus points to all members in this department
      const bonusPromises = members.map(m => 
        supabase.from('leaderboard_points').insert({
          user_id: m.id,
          activity_type: 'departmental_bonus',
          points: 50
        })
      );
      await Promise.all(bonusPromises);

      toast.success(`Awarded 50 bonus points to all ${members.length} members of ${deptName}!`);
      fetchLeaderboardData();
    } catch (err: any) {
      toast.error("Failed to issue bonus: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Personal Leaderboard (Free-for-All: student & faculty)
  const personalRankings = [...usersList]
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 2. Department-Level Rankings (within department)
  const deptFilterRankings = [...usersList]
    .filter((u) => u.department.toLowerCase() === selectedDept.toLowerCase())
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 3. Department-wise Standings (Accumulated Points)
  const deptTeamsGroup: Record<string, { dept: string; totalPoints: number; totalTrees: number; membersCount: number; instId: string }> = {};
  usersList.forEach((u) => {
    const dept = u.department || "General";
    if (!deptTeamsGroup[dept]) {
      deptTeamsGroup[dept] = { dept, totalPoints: 0, totalTrees: 0, membersCount: 0, instId: u.institutionId || '00000000-0000-0000-0000-000000000001' };
    }
    deptTeamsGroup[dept].totalPoints += u.points;
    deptTeamsGroup[dept].totalTrees += u.trees;
    deptTeamsGroup[dept].membersCount += 1;
  });

  const departmentRankings = Object.values(deptTeamsGroup)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 4. Institutional-wise Standings (Accumulated Points)
  const instGroup: Record<string, { id: string; name: string; totalPoints: number; totalTrees: number; membersCount: number; deptsCount: number }> = {
    '00000000-0000-0000-0000-000000000001': { id: '00000000-0000-0000-0000-000000000001', name: "College of Engineering and Visual Arts (VVPCOE & VA)", totalPoints: 0, totalTrees: 0, membersCount: 0, deptsCount: 6 },
    '00000000-0000-0000-0000-000000000003': { id: '00000000-0000-0000-0000-000000000003', name: "Manohar Phalke College of Architecture", totalPoints: 0, totalTrees: 0, membersCount: 0, deptsCount: 1 },
    '00000000-0000-0000-0000-000000000002': { id: '00000000-0000-0000-0000-000000000002', name: "VPP Law College", totalPoints: 0, totalTrees: 0, membersCount: 0, deptsCount: 1 }
  };

  usersList.forEach((u) => {
    let instId = u.institutionId;
    if (!instId) {
      if (u.roll?.includes('VPP-HOD') || u.roll?.includes('VPP-STU') || u.roll?.includes('VPP-FAC')) {
        instId = '00000000-0000-0000-0000-000000000001';
      }
    }
    if (instId && instGroup[instId]) {
      instGroup[instId].totalPoints += u.points;
      instGroup[instId].totalTrees += u.trees;
      instGroup[instId].membersCount += 1;
    }
  });

  const institutionalRankings = Object.values(instGroup)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const departmentsList = [
    "Computer Engineering",
    "Information Technology",
    "Computer Science & Engineering (AI & ML, Data Science)",
    "Electronics & Computer Science",
    "Mechatronics Engineering",
    "Fine Art",
    "Department of Architecture",
    "Department of Law"
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Trophy className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Maharashtra Leadership Board</h1>
            <p className="text-muted-foreground mt-1">
              Earn Carbon Points for verified tree plantations and check-in milestones.
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5 py-1 px-3 text-xs">
              <Sparkles className="h-3 w-3" /> Gamification Admin Active
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue={currentRole === "DEPARTMENT_HOD" ? "my_department" : "personal"} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full border border-border/40">
          <TabsTrigger value="personal" className="rounded-full px-6 flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Personal Standings
          </TabsTrigger>
          <TabsTrigger value="my_department" className="rounded-full px-6 flex items-center gap-2">
            <Users className="h-4 w-4" /> My Department
          </TabsTrigger>
          <TabsTrigger value="departmental" className="rounded-full px-6 flex items-center gap-2">
            <Award className="h-4 w-4" /> Department Standings
          </TabsTrigger>
          <TabsTrigger value="institutional" className="rounded-full px-6 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Institutional Rankings
          </TabsTrigger>
        </TabsList>

        {/* 1. Personal Standings */}
        <TabsContent value="personal">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Individual Standings</CardTitle>
              <CardDescription>
                State-wide standings of all student planters and faculty coordinators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Verified Trees</TableHead>
                    <TableHead>Carbon Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personalRankings.map((row) => (
                    <TableRow key={row.id} className={row.id === user?.id ? "bg-primary/5 font-semibold" : ""}>
                      <TableCell className="font-heading font-bold">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          row.rank === 1 ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' :
                          row.rank === 2 ? 'bg-zinc-300 text-zinc-800' :
                          row.rank === 3 ? 'bg-orange-300 text-orange-900' : 'text-muted-foreground'
                        }`}>
                          #{row.rank}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold">{row.name} {row.id === user?.id && "(You)"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0">
                            {row.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{row.roll}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground uppercase">{row.department}</TableCell>
                      <TableCell className="text-sm font-medium">{row.trees} Trees</TableCell>
                      <TableCell className="font-bold text-primary text-base">{row.points} pts</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 1b. My Department Standings */}
        <TabsContent value="my_department">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>My Department ({user?.department || 'Unassigned'})</CardTitle>
              <CardDescription>
                Standings for members specifically within your department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Verified Trees</TableHead>
                    <TableHead>Carbon Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList
                    .filter((u) => u.department === user?.department)
                    .sort((a, b) => b.points - a.points)
                    .map((item, idx) => ({ ...item, rank: idx + 1 }))
                    .map((row) => (
                    <TableRow key={row.id} className={row.id === user?.id ? "bg-primary/5 font-semibold" : ""}>
                      <TableCell className="font-heading font-bold">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          row.rank === 1 ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' :
                          row.rank === 2 ? 'bg-zinc-300 text-zinc-800' :
                          row.rank === 3 ? 'bg-orange-300 text-orange-900' : 'text-muted-foreground'
                        }`}>
                          #{row.rank}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold">{row.name} {row.id === user?.id && "(You)"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0">
                            {row.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{row.roll}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{row.trees} Trees</TableCell>
                      <TableCell className="font-bold text-primary text-base">{row.points} pts</TableCell>
                    </TableRow>
                  ))}
                  {usersList.filter((u) => u.department === user?.department).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No members found in your department yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Departmental Standings */}
        <TabsContent value="departmental" className="space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Department Standings (Accumulated Carbon Points)</CardTitle>
              <CardDescription>
                Compare total cumulative carbon points earned by departments acting as teams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Department Team</TableHead>
                    <TableHead>College Campus</TableHead>
                    <TableHead>Active Members</TableHead>
                    <TableHead>Total Trees Planted</TableHead>
                    <TableHead>Cumulative Carbon Points</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentRankings.map((row) => (
                    <TableRow key={row.dept}>
                      <TableCell className="font-heading font-bold">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          row.rank === 1 ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' :
                          row.rank === 2 ? 'bg-zinc-300 text-zinc-800' :
                          row.rank === 3 ? 'bg-orange-300 text-orange-900' : 'text-muted-foreground'
                        }`}>
                          #{row.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{row.dept}</TableCell>
                      <TableCell className="text-xs text-muted-foreground uppercase">
                        {row.instId === '00000000-0000-0000-0000-000000000002' ? 'VPP Law' : 
                         row.instId === '00000000-0000-0000-0000-000000000003' ? 'Phalke Architecture' : 
                         'VVPCOE & VA'}
                      </TableCell>
                      <TableCell>{row.membersCount} active members</TableCell>
                      <TableCell>{row.totalTrees} verified trees</TableCell>
                      <TableCell className="font-bold text-primary">{row.totalPoints} pts</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGiveBonus(row.dept)}
                            className="text-primary border-primary/20 hover:bg-primary/5 rounded-full"
                          >
                            +50 Bonus
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Institutional Rankings */}
        <TabsContent value="institutional">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Institutional Standings (Accumulated Carbon Points)</CardTitle>
              <CardDescription>
                Compare total cumulative carbon points earned by institutions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Institution Name</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Total Active Planters</TableHead>
                    <TableHead>Total Trees Planted</TableHead>
                    <TableHead>Cumulative Carbon Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutionalRankings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-heading font-bold">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          row.rank === 1 ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' :
                          row.rank === 2 ? 'bg-zinc-300 text-zinc-800' :
                          row.rank === 3 ? 'bg-orange-300 text-orange-900' : 'text-muted-foreground'
                        }`}>
                          #{row.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{row.name}</TableCell>
                      <TableCell>{row.deptsCount} Departments</TableCell>
                      <TableCell>{row.membersCount} members</TableCell>
                      <TableCell>{row.totalTrees} verified trees</TableCell>
                      <TableCell className="font-bold text-primary text-lg">{row.totalPoints} pts</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
