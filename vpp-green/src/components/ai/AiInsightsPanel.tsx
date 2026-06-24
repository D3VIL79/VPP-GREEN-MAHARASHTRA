"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";
import { Leaf, Flame, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { aiApi } from "@/lib/api";

const healthColors = {
  Healthy: "#22c55e",
  "At Risk": "#f59e0b",
  Deceased: "#ef4444",
};

export function AiInsightsPanel({ studentTrees = [] }: { studentTrees?: any[] }) {
  const [carbonData, setCarbonData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching or aggregating AI insights based on student trees
    const fetchInsights = async () => {
      setLoading(true);
      try {
        // Map actual DB trees to AI payload format
        const aiTreesPayload = (studentTrees || []).map(t => {
          const ageYears = Math.max(0.1, (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24 * 365));
          return {
            species_name: t.speciesName || "Neem",
            age_years: ageYears,
            count: 1
          };
        });

        // Fetch Carbon Score from AI Engine
        const carbonRes = await aiApi.getCarbonScore({ trees: aiTreesPayload.length > 0 ? aiTreesPayload : [{species_name: "Neem", age_years: 0.1, count: 1}] });
        setCarbonData(carbonRes.data?.carbon_data || { total_co2_absorbed_kg: 0, equivalent_km_driving_offset: 0, badge: 'Seed Planter' });

        // Generate Health Distribution (mocked aggregation for now, usually would be from backend view)
        setHealthData([
          { name: "Healthy", value: 8, fill: healthColors["Healthy"] },
          { name: "At Risk", value: 2, fill: healthColors["At Risk"] },
          { name: "Deceased", value: 0, fill: healthColors["Deceased"] },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, [studentTrees]);

  const mockGrowthTrend = [
    { month: "Jan", height: 20 },
    { month: "Feb", height: 25 },
    { month: "Mar", height: 32 },
    { month: "Apr", height: 45 },
    { month: "May", height: 60 },
  ];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Analyzing your plantation impact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Carbon Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="h-full border-border/70 bg-gradient-to-br from-card to-card/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Flame className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-violet-500/10 p-1.5 text-violet-500">
                <Flame className="h-4 w-4" />
              </div>
              Carbon Sequestered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {carbonData?.total_co2_absorbed_kg || 0} <span className="text-base font-normal text-muted-foreground">kg</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Offsets approx. {carbonData?.equivalent_km_driving_offset || 0} km of driving
            </p>
            <div className="mt-4 inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
              Badge: {carbonData?.badge || 'Seed Planter'}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Health Distribution */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="h-full border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-green-500/10 p-1.5 text-green-500">
                <Leaf className="h-4 w-4" />
              </div>
              Plant Health
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                  {healthData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Growth Trend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="h-full border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              Avg Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[120px] px-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <AreaChart data={mockGrowthTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="height" stroke="#f59e0b" fillOpacity={1} fill="url(#colorHeight)" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Survival Risk Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="h-full border-border/70 shadow-sm bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-500">
              <div className="rounded-md bg-amber-500/10 p-1.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground"><strong className="text-foreground font-medium">Mango Tree #4</strong> needs watering. Soil moisture appears low.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-muted-foreground">Monitoring due for <strong className="text-foreground font-medium">Neem Tree #1</strong> next week.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
