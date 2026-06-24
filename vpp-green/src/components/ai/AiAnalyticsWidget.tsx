"use client";

import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cpu, Leaf, Droplet, TrendingUp } from "lucide-react";

// Mock Data derived from baseline engine statistics
const healthData = [
  { name: 'Healthy', value: 65, fill: '#22c55e' },
  { name: 'Moderate Risk', value: 20, fill: '#eab308' },
  { name: 'Diseased', value: 10, fill: '#ef4444' },
  { name: 'Dead', value: 5, fill: '#94a3b8' },
];

const speciesData = [
  { name: 'Neem', count: 420 },
  { name: 'Banyan', count: 310 },
  { name: 'Mango', count: 250 },
  { name: 'Peepal', count: 180 },
  { name: 'Jamun', count: 150 },
  { name: 'Others', count: 90 },
];

const survivalData = [
  { month: 'Jan', rate: 98 },
  { month: 'Feb', rate: 96 },
  { month: 'Mar', rate: 95 },
  { month: 'Apr', rate: 92 },
  { month: 'May', rate: 89 },
  { month: 'Jun', rate: 85 },
];

export function AiAnalyticsWidget({ title = "VPP Green Maharashtra AI Insights" }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold font-heading">{title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tree Health Engine */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-blue-500" />
                  Health Distribution
                </CardTitle>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                  Powered by Tree Health Engine
                </span>
              </div>
              <CardDescription>Computer Vision analysis of all submitted plant images.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Species Engine */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-green-600" />
                  Species Recognition
                </CardTitle>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-600/10 text-green-700 rounded">
                  Powered by Species Recognition Engine
                </span>
              </div>
              <CardDescription>AI-identified biodiversity across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={speciesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Survival Engine */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="h-full border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                  Survival Forecast
                </CardTitle>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-cyan-600/10 text-cyan-700 rounded">
                  Powered by Survival Prediction Engine
                </span>
              </div>
              <CardDescription>Tabular survival models predicting long-term tree viability.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <LineChart data={survivalData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#0891b2" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
