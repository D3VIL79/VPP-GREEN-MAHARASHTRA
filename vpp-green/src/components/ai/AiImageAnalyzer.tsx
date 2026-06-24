"use client";

import { useState } from "react";
import { Upload, Cpu, Leaf, AlertCircle, Droplet, TreePine, ShieldCheck, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";

export function AiImageAnalyzer() {
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    species: any;
    health: any;
    survival: any;
    fraud: any;
    carbon: any;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64.split(",")[1] || base64);
      setResults(null);
    };
    reader.readAsDataURL(file);
  };

  const runAiAnalysis = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setResults(null);

    try {
      // Step 1: Run image-based neural networks
      const [speciesRes, healthRes, fraudRes] = await Promise.all([
        aiApi.predictImage("species_recognition", imageFile),
        aiApi.predictImage("tree_health", imageFile),
        aiApi.predictImage("duplicate_detection", imageFile),
      ]);

      const detectedSpecies = speciesRes.data?.recognized_species?.species_name || "Neem";

      // Generate some dynamic environmental context for the preview
      const soils = ["loamy", "clay", "sandy"];
      const randomSoil = soils[Math.floor(Math.random() * soils.length)];
      const randomRainfall = Math.floor(600 + Math.random() * 1200); // 600mm to 1800mm
      const randomTemp = Math.floor(22 + Math.random() * 14); // 22C to 36C
      const randomAge = 0.5 + Math.random() * 4.5; // 0.5 to 5.0 years

      // Step 2: Run tabular predictions feeding off the detected species
      const [survivalRes, carbonRes] = await Promise.all([
        aiApi.predict("survival_prediction", { 
          plantation_id: "preview_123", 
          species_name: detectedSpecies, 
          tree_age: randomAge, 
          soil_type: randomSoil, 
          rainfall_mm: randomRainfall, 
          temperature_c: randomTemp 
        }),
        aiApi.predict("carbon_sequestration", {
          user_id: "preview_123",
          trees: [{
            species_name: detectedSpecies,
            age_years: randomAge,
            count: 1,
            height: randomAge * 1.5,
            trunk_diameter: randomAge * 2.5,
            crown_area: randomAge * 1.2,
            soil_type: randomSoil,
            rainfall: randomRainfall,
            temperature: randomTemp,
            sunlight_hours: 6.0,
            leaf_density: 0.7
          }],
          formula: "ipcc"
        })
      ]);

      // Map backend schema to frontend expectation
      const speciesData = speciesRes.data?.recognized_species ? {
        species_name: speciesRes.data.recognized_species.species_name,
        scientific_name: speciesRes.data.recognized_species.scientific_name,
        confidence: speciesRes.data.recognized_species.confidence,
      } : speciesRes.data;

      const healthData = healthRes.data?.health_status ? {
        health_status: healthRes.data.health_status,
        health_score: healthRes.data.confidence ? healthRes.data.confidence[healthRes.data.health_status] : 0.8
      } : healthRes.data;
      
      const fraudData = fraudRes.data?.action ? {
        passed: fraudRes.data.action === "accept",
        fraud_score: fraudRes.data.similarity_score ? Math.round((1 - fraudRes.data.similarity_score)*10) : 10,
        anomalies_detected: fraudRes.data.is_duplicate ? ["Duplicate image detected"] : []
      } : fraudRes.data;

      const survivalData = survivalRes.data?.prediction ? {
         survival_probability: survivalRes.data.prediction.survival_probability,
         risk_level: survivalRes.data.prediction.risk_level
      } : survivalRes.data;

      const carbonData = carbonRes.data?.carbon_data ? {
        total_co2_kg: carbonRes.data.carbon_data.total_co2_absorbed_kg,
        class: carbonRes.data.carbon_data.breakdown_by_species?.[0]?.ml_carbon_class || "Unknown",
        badge: carbonRes.data.carbon_data.badge
      } : carbonRes.data;

      setResults({
        species: speciesData,
        health: healthData,
        survival: survivalData,
        fraud: fraudData,
        carbon: carbonData,
      });
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row h-full">
      {/* Upload Section */}
      <div className="flex-1 p-6 flex flex-col border-r border-border bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              AI Image Analyzer
            </h3>
            <p className="text-sm text-muted-foreground">Upload a plant image for multi-engine analysis.</p>
          </div>
        </div>

        <div
          className={`flex-1 relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          } ${imagePreview ? "border-solid p-2" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="relative w-full h-full min-h-[200px] flex items-center justify-center bg-black/5 rounded-lg overflow-hidden group">
              <img src={imagePreview} alt="Preview" className="max-w-full max-h-[300px] object-contain rounded-md" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" onClick={() => document.getElementById('ai-image-upload')?.click()}>
                  Change Image
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">Drag and drop your image here</p>
              <p className="text-xs text-muted-foreground mb-4">Support for JPG, PNG (Max 5MB)</p>
              <Button onClick={() => document.getElementById('ai-image-upload')?.click()} variant="outline" size="sm">
                Browse Files
              </Button>
            </>
          )}
          <input id="ai-image-upload" type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </div>

        {imagePreview && (
          <Button 
            className="w-full mt-4" 
            onClick={runAiAnalysis} 
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing across 4 AI Engines...</>
            ) : (
              <><Cpu className="w-4 h-4 mr-2" /> Analyze Image</>
            )}
          </Button>
        )}
      </div>

      {/* Results Section */}
      <div className="flex-[1.2] p-6 bg-card relative">
        {!results && !isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Cpu className="w-12 h-12 mb-4 opacity-20" />
            <p>Upload an image and run the analysis to see predictions powered by the VPP Green Maharashtra Data Platform.</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <Cpu className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="mt-4 font-medium text-primary animate-pulse">Running Neural Networks...</p>
          </div>
        )}

        {results && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-semibold text-lg">AI Analysis Results</h4>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium border border-primary/20">
                  Confidence: {((results.species?.confidence || 0.85) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Species Engine */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <TreePine className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Species Engine</span>
                  </div>
                  <div className="text-lg font-bold">
                    {results.species?.species_name || "Unknown Species"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 italic">
                    {results.species?.scientific_name || ""}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded font-medium">
                      {((results.species?.confidence || 0) * 100).toFixed(0)}% conf
                    </div>
                  </div>
                </div>

                {/* Health Engine */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Leaf className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Health Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold">
                      {results.health?.health_status || "Analyzing..."}
                    </div>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${(results.health?.health_score || 0) > 0.7 ? 'bg-green-500' : (results.health?.health_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${(results.health?.health_score || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Survival Engine */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Droplet className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Survival Prediction</span>
                  </div>
                  <div className="text-lg font-bold">
                    {((results.survival?.survival_probability || 0.85) * 100).toFixed(1)}% Prob.
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Risk: {results.survival?.risk_level || "Low"}
                  </div>
                </div>

                {/* Fraud Engine */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Fraud Scoring</span>
                  </div>
                  <div className={`text-lg font-bold ${results.fraud?.passed !== false ? 'text-green-600' : 'text-red-500'}`}>
                    {results.fraud?.passed !== false ? 'Passed' : 'Failed'} (Score: {results.fraud?.fraud_score ?? 0}/10)
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {results.fraud?.anomalies_detected?.length > 0 ? results.fraud.anomalies_detected.join(", ") : "No anomalies detected"}
                  </div>
                </div>
              </div>

              {/* Carbon Sequestration Engine */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border shadow-sm w-full mt-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Carbon Sequestration Engine</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {results.carbon?.total_co2_kg !== undefined 
                        ? `${results.carbon.total_co2_kg} kg CO2 Offset` 
                        : "Estimation Pending"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ML Class: <span className="font-medium text-foreground">{results.carbon?.class || "N/A"}</span>
                    </div>
                  </div>
                  {results.carbon?.badge && (
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                      {results.carbon.badge}
                    </div>
                  )}
                </div>
              </div>

              {results.fraud?.anomalies_detected?.length > 0 && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-amber-700 dark:text-amber-400">Anomalies Detected</h5>
                    <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-1">
                      {results.fraud.anomalies_detected.join(", ")}. Please review the image manually.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
