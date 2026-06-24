"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, TreePine, ArrowRight, UploadCloud, Loader2, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiApi, speciesApi, plantationApi, SpeciesResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import exifr from 'exifr';
import { DynamicMap } from "@/components/map/DynamicMap";
import { toast } from "sonner";

export default function AddTree() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [speciesList, setSpeciesList] = useState<SpeciesResponse[]>([]);
  
  // Form State
  const [selectedSpeciesId, setSelectedSpeciesId] = useState("");
  const [plantedDate, setPlantedDate] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load species catalog
    speciesApi.list().then(res => setSpeciesList(res.data)).catch(console.error);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        // Extract EXIF data
        const metadata = await exifr.parse(file);
        
        if (metadata && metadata.latitude && metadata.longitude) {
          // Save the GPS location securely extracted from the photo
          setLocation({ lat: metadata.latitude, lng: metadata.longitude });
          setImageFile(file);
          
          const dateStr = metadata.DateTimeOriginal 
            ? new Date(metadata.DateTimeOriginal).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
          setPlantedDate(dateStr);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setImageBase64(reader.result as string);
            setIsLoading(false);
          };
          reader.readAsDataURL(file);
        } else {
          // Camera GPS missing fallback to device live browser geolocation
          console.warn("No camera EXIF GPS data found in photo. Accessing device browser geolocation...");
          setImageFile(file);
          
          const getDeviceLocation = () => {
            return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    resolve({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                  },
                  (error) => reject(error),
                  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
              } else {
                reject(new Error("Browser geolocation not supported"));
              }
            });
          };

          try {
            const coords = await getDeviceLocation();
            setLocation(coords);
            toast.warning("Notice: No camera GPS coordinates found in the photo. Using your device's live browser location instead.");
          } catch (geoErr) {
            console.error("Device geolocation failed", geoErr);
            // Default coords (Maharashtra area)
            const defaultCoords = { lat: 19.0760, lng: 72.8777 };
            setLocation(defaultCoords);
            toast.error("Notice: No camera GPS or device location services available. Tagging to default location.");
          }

          setPlantedDate(new Date().toISOString().split('T')[0]);

          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setImageBase64(reader.result as string);
            setIsLoading(false);
          };
          reader.readAsDataURL(file);
        }
      } catch (err) {
        toast.error("Error analyzing photo metadata. Please upload a valid JPEG.");
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          toast.error("Could not get high-accuracy location. Please check device GPS settings.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleVerifyImage = async () => {
    if (!imageFile || !location) return;
    setIsVerifying(true);
    try {
      // Call Backend AI Engine for both species and geotag verification
      const [speciesRes, geotagRes] = await Promise.all([
        aiApi.predictImage('tree_species', imageFile),
        aiApi.predictImage('geotag_verification', imageFile, location.lat, location.lng)
      ]);
      
      if (speciesRes.data) {
        const geotagOk = geotagRes.data?.valid ?? true;
        const mode = geotagRes.data?.mode ?? "unknown";
        
        const speciesData = speciesRes.data.recognized_species || speciesRes.data;
        
        setAiResult({
          species: speciesData.species_name || "Unknown",
          scientificName: speciesData.scientific_name || "Unknown",
          confidence: speciesData.confidence || 0,
          co2Offset: speciesData.calculated_co2_offset_kg_per_year || 0,
          geotagValid: geotagOk,
          geotagMode: mode
        });
      }
    } catch (error) {
      console.error("AI Verification failed", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    const instId = user?.institutionId;
    if (!user || !instId || !selectedSpeciesId || !location || !imageBase64) return;
    
    setIsLoading(true);
    try {
      await plantationApi.create({
        institutionId: instId,
        speciesId: selectedSpeciesId,
        lat: location.lat,
        lng: location.lng,
        locationAccuracyMeters: 10,
        initialPhotoUrl: imageBase64, // Store base64 data directly as the image URL in our DB setup
      });
      router.push("/student/trees");
    } catch (error) {
      console.error("Failed to plant tree", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = selectedSpeciesId !== "" && plantedDate !== "";
  const isStep2Valid = imageBase64 !== null;
  const isStep3Valid = location !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Plant a New Tree</h1>
        <p className="text-muted-foreground mt-1">Register your newly planted tree to track its growth and earn certificates.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" 
          style={{ width: `${((step - 1) / 2) * 100}%` }} 
        />
        
        {[
          { icon: TreePine, label: "Details" },
          { icon: Camera, label: "Photo & AI Verification" },
          { icon: MapPin, label: "Location" }
        ].map((item, i) => {
          const Icon = item.icon;
          const isActive = step >= i + 1;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-card border-border text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'} whitespace-nowrap text-center`}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Tree Details</CardTitle>
                  <CardDescription>What kind of tree did you plant?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Species Name</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-background/50"
                      value={selectedSpeciesId}
                      onChange={(e) => setSelectedSpeciesId(e.target.value)}
                    >
                      <option value="" className="bg-background text-foreground">Select a species...</option>
                      {speciesList.map(s => (
                        <option key={s.id} value={s.id} className="bg-background text-foreground">
                          {s.species_name} ({s.scientific_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Plantation Date</Label>
                    <Input 
                      type="date" 
                      className="bg-background/50" 
                      value={plantedDate}
                      onChange={(e) => setPlantedDate(e.target.value)}
                    />
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>AI Image Verification</CardTitle>
                  <CardDescription>Upload a clear photo of the sapling. Our AI will verify the species.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  
                  {!imagePreview ? (
                    <div 
                      className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer bg-background/50 group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium">Click to Upload Photo</h3>
                      <p className="text-sm text-muted-foreground mt-1">JPEG, PNG up to 5MB</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border border-border/50 h-64 bg-black/5 flex items-center justify-center group">
                        <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                        
                        {/* Scanning Animation Overlay */}
                        {isVerifying && (
                          <motion.div 
                            className="absolute inset-0 bg-primary/20"
                            initial={{ top: 0, height: "0%" }}
                            animate={{ top: ["0%", "100%", "0%"], height: ["10%", "2%", "10%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          />
                        )}

                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setImagePreview(null);
                            setImageBase64(null);
                            setAiResult(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {!aiResult && !isVerifying && (
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90" 
                          onClick={handleVerifyImage}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Verify with AI Engine
                        </Button>
                      )}

                      {isVerifying && (
                        <div className="flex items-center justify-center p-4 text-primary font-medium gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Running ONNX Inference Model...
                        </div>
                      )}

                      {aiResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className={`border p-4 rounded-xl flex flex-col gap-2 ${
                            aiResult.confidence < 0.75 
                              ? 'bg-warning/10 border-warning/50 text-warning-foreground' 
                              : 'bg-success/10 border-success/20 text-success'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-semibold">
                            {aiResult.confidence < 0.75 ? <AlertCircle className="h-5 w-5 text-warning" /> : <CheckCircle className="h-5 w-5 text-success" />}
                            {aiResult.confidence < 0.75 ? 'Low Confidence Detected' : 'AI Verification Successful'}
                          </div>
                          
                          {aiResult.confidence < 0.75 ? (
                            <p className="text-sm text-foreground">
                              The AI is only <span className="font-bold text-warning">{Math.round(aiResult.confidence * 100)}%</span> confident this is <span className="font-bold">{aiResult.species}</span>. 
                              Please retake the photo. Make sure you are not too close or too far, and the leaves are clearly visible.
                            </p>
                          ) : (
                            <>
                              <p className="text-sm text-foreground">
                                Detected Species: <span className="font-bold">{aiResult.species}</span> ({aiResult.scientificName})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Confidence Score: <span className="text-primary font-medium">{Math.round(aiResult.confidence * 100)}%</span>
                              </p>
                              {aiResult.co2Offset > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Actually Calculated CO2 Offset: <span className="text-success font-medium">{aiResult.co2Offset} kg/yr</span>
                                </p>
                              )}
                            </>
                          )}
                          
                          {aiResult.geotagMode && (
                            <p className="text-xs text-muted-foreground border-t border-success/20 pt-1 mt-1">
                              Verification Mode: <span className="font-medium capitalize">{aiResult.geotagMode.replace('_', ' ')}</span>
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Location Data</CardTitle>
                  <CardDescription>Tag the exact GPS location of your tree for tracking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-64 rounded-xl border border-border bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    {!location ? (
                      <div className="text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No GPS coordinates found.</p>
                        <p className="text-xs">Please go back and upload a valid GPS photo.</p>
                      </div>
                    ) : (
                      <DynamicMap 
                        markers={[{id: 'new', lat: location.lat, lng: location.lng, title: "Planted Location", subtitle: "Extracted from photo EXIF"}]} 
                        zoom={16}
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Latitude</Label>
                      <Input 
                        disabled 
                        value={location ? location.lat.toFixed(6) : ""} 
                        placeholder="Auto-filled" 
                        className="bg-muted/50 font-mono" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Longitude</Label>
                      <Input 
                        disabled 
                        value={location ? location.lng.toFixed(6) : ""} 
                        placeholder="Auto-filled" 
                        className="bg-muted/50 font-mono" 
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            <CardFooter className="flex justify-between border-t border-border/50 p-6">
              <Button 
                variant="outline" 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1 || isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  if (step === 3) {
                    handleSubmit();
                  } else {
                    setStep(s => Math.min(3, s + 1));
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={
                  (step === 1 && !isStep1Valid) || 
                  (step === 2 && (!isStep2Valid || !aiResult)) || 
                  (step === 3 && !isStep3Valid) ||
                  isLoading || isVerifying
                }
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {step === 3 ? "Submit Verification" : "Continue"} 
                {step !== 3 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
