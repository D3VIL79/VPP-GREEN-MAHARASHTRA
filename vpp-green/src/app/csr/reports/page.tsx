"use client";

import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, Sparkles, HeartHandshake, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/utils";

export default function CsrReports() {
  const csrReportsList = [
    {
      id: "CSR-REP-2026-01",
      name: "Q1 Corporate Carbon Offset Statement",
      date: "2026-05-30",
      format: "PDF (Certified)",
      size: "3.2 MB",
      desc: "Official certified document stating tree count, carbon credit yield, and equivalent vehicle emission offsets for TATA Motors.",
    },
    {
      id: "CSR-REP-2026-02",
      name: "Fund Utilization & Disbursement Ledger",
      date: "2026-05-12",
      format: "Excel (.xlsx)",
      size: "720 KB",
      desc: "Full accounting balance detailing college coordinators approvals, logistics costs, and sapling procurement payments.",
    },
    {
      id: "CSR-REP-2026-03",
      name: "Student carbon points ledger & prize sponsor audit",
      date: "2026-04-22",
      format: "PDF",
      size: "1.9 MB",
      desc: "A listing of all sponsored awards, certificates, and merchandise disbursed to VPP and Phalke students.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Impact Reports</h1>
          <p className="text-muted-foreground mt-1">Review official carbon statements, ESG summaries, and CSR auditing documents.</p>
        </div>
      </div>

      {/* Corporate ESG Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certified Carbon Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading text-primary">12.4 Tons</span>
              <span className="text-xs text-muted-foreground">CO2 Offset</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified by Maharashtra Forestry Ministry</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Corporate Tax Exemption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">Section 80G</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified receipts issued for all disbursements</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Community Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">1,840</span>
              <span className="text-xs text-muted-foreground">Students engaged</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">VPP & Phalke colleges combined</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" /> ESG & Financial Auditing Documents
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {csrReportsList.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-foreground">{doc.name}</h3>
                      <Badge variant="secondary" className="bg-muted text-[10px]">{doc.format}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl">{doc.desc}</p>
                    <p className="text-[10px] text-muted-foreground pt-1">Compiled on {doc.date} • {doc.size}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" title="View Document" onClick={() => toast.info(`Preparing preview for ${doc.name}...`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="bg-background/50 hover:bg-muted/80 text-primary border-primary/20" onClick={() => {
                      toast.success(`Downloading ${doc.name}...`);
                      downloadCSV([doc], `${doc.id}_Extract.csv`);
                    }}>
                      <Download className="h-4 w-4 mr-1.5" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
