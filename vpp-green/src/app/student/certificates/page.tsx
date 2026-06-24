"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Download, Share2, Trophy, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/use-api";
import { certificateApi } from "@/lib/api";
import { toast } from "sonner";

export default function StudentCertificates() {
  const { data: certificates, isLoading, execute: fetchCertificates } = useApi(certificateApi.getMine);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Points mapping for fake rewards on the UI
  const getPointsForType = (type: string) => {
    switch (type) {
      case 'PLANTATION_MILESTONE': return 100;
      case 'SURVIVAL_AUDIT': return 50;
      case 'CAMPAIGN_PARTICIPATION': return 200;
      default: return 50;
    }
  };

  const totalPoints = certificates?.reduce((acc, c) => acc + getPointsForType(c.type), 0) || 0;

  if (isLoading && !certificates) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Environmental Certificates</h1>
          <p className="text-muted-foreground mt-1">Download and share official certificates issued by VPP Trust, corporate sponsors, and government departments.</p>
        </div>
      </div>

      {/* Certificate Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border/50 bg-card/60 backdrop-blur-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Trophy className="h-5 w-5 text-accent" /> Achievement Level: {totalPoints > 500 ? 'Gold Planter' : 'Silver Planter'}</CardTitle>
            <CardDescription>You are in the top 15% of green volunteers in Mumbai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Silver Planter (Current)</span>
                <span>Gold Planter (1000 Carbon Points)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min((totalPoints / 1000) * 100, 100)}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Earn {1000 - totalPoints} more carbon points to reach the Gold Planter level.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Carbon Credits</p>
              <h3 className="text-3xl font-bold font-heading text-primary">{totalPoints} Carbon Points</h3>
              <p className="text-xs text-muted-foreground mt-2">Earned through sapling planting, geotag verifications, and monitoring compliance.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Certificates */}
      <div className="grid grid-cols-1 gap-6">
        {certificates?.length === 0 ? (
          <div className="text-center p-12 bg-background/50 rounded-xl border border-dashed text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No Certificates Yet</h3>
            <p className="text-sm mt-1">Complete your first plantation survival audit to unlock your first certificate.</p>
          </div>
        ) : (
          certificates?.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-primary to-secondary" />
                
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground leading-tight">{cert.title || 'Official Certificate'}</h3>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                          {cert.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{cert.issuer || 'VPP Green Maharashtra'}</p>
                      <p className="text-xs text-muted-foreground max-w-2xl leading-normal">
                        Recognizing your active contribution towards environmental restoration and completing required milestones.
                      </p>
                      
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground font-mono">
                        <span>ID: {cert.id.substring(0, 8)}...</span>
                        <span>•</span>
                        <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-primary font-semibold font-sans">{getPointsForType(cert.type)} reward</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 md:w-36">
                    <Button size="sm" className="bg-primary hover:bg-primary/95 text-white w-full" onClick={() => window.open(cert.pdfUrl || '#', '_blank')}>
                      <Download className="h-4 w-4 mr-1.5" /> Download PDF
                    </Button>
                    <Button size="sm" variant="outline" className="border-border/50 bg-background/50 w-full" onClick={() => {
                      navigator.clipboard.writeText(`I just earned my ${cert.title || 'Green Certificate'} on VPP Green Maharashtra!`);
                      toast.success("Share link copied to clipboard");
                    }}>
                      <Share2 className="h-4 w-4 mr-1.5" /> Share Creds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
