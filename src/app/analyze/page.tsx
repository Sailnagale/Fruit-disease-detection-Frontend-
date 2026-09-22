"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, Image as ImageIcon, X, AlertCircle, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

type AnalysisState = "EMPTY" | "IMAGE_SELECTED" | "VALIDATING" | "UPLOADING" | "ANALYZING" | "RESULT" | "ERROR";

type AnalysisResult = {
  class: string;
  confidence: number;
  probabilities: {
    Anthracnose: number;
    fruit_fly: number;
    healthy_guava: number;
  };
  model_version: string;
};

export default function AnalyzePage() {
  const [state, setState] = useState<AnalysisState>("EMPTY");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setState("VALIDATING");
    
    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg("Unsupported file format. Please upload a JPG, PNG, or WEBP image.");
      setState("ERROR");
      return;
    }

    // Validate size (10 MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg("Image exceeds the 10 MB limit.");
      setState("ERROR");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setFile(selectedFile);
    setState("IMAGE_SELECTED");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "EMPTY" && state !== "ERROR") return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;

    setState("UPLOADING");
    setProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate upload progress
      setTimeout(() => setProgress(40), 500);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fruit-disease-detection-backend.onrender.com";
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      setState("ANALYZING");
      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Analysis service is temporarily unavailable. Please try again." }));
        throw new Error(errorData.detail || "Failed to analyze image");
      }

      const data: AnalysisResult = await response.json();
      setProgress(100);
      setResult(data);
      
      // Save to history (localStorage)
      const historyItem = {
        id: Date.now().toString(),
        result: data.class,
        confidence: data.confidence,
        date: new Date().toISOString(),
        preview: preview // Storing data URL would be large, but for MVP it's OK, or we can just skip image in history
      };
      
      try {
        const existingHistory = JSON.parse(localStorage.getItem("guava_history") || "[]");
        localStorage.setItem("guava_history", JSON.stringify([historyItem, ...existingHistory].slice(0, 50)));
      } catch (e) {
        console.error("Could not save to localStorage", e);
      }

      setTimeout(() => setState("RESULT"), 500);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setState("ERROR");
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setState("EMPTY");
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 flex-1 flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis Workspace</h1>
        <p className="text-muted-foreground">Upload a guava image to detect Anthracnose or Fruit Fly infestation.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        {/* EMPTY STATE */}
        {state === "EMPTY" && (
          <Card 
            className="w-full max-w-2xl border-dashed border-2 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & Drop Image</h3>
              <p className="text-muted-foreground mb-6">or click to browse from your device</p>
              <div className="flex items-center text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                <ImageIcon className="h-3 w-3 mr-2" />
                JPG / PNG / WEBP up to 10 MB
              </div>
            </CardContent>
          </Card>
        )}

        {/* IMAGE SELECTED STATE */}
        {state === "IMAGE_SELECTED" && preview && (
          <div className="w-full max-w-2xl space-y-6">
            <div className="relative rounded-xl overflow-hidden border bg-black/5 aspect-video flex items-center justify-center">
              <img src={preview} alt="Selected Guava" className="max-h-full max-w-full object-contain" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full shadow-md"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={resetState}>Cancel</Button>
              <Button size="lg" onClick={analyzeImage} className="px-8">Analyze Image</Button>
            </div>
          </div>
        )}

        {/* LOADING STATES (VALIDATING, UPLOADING, ANALYZING) */}
        {(state === "VALIDATING" || state === "UPLOADING" || state === "ANALYZING") && (
          <Card className="w-full max-w-xl shadow-lg">
            <CardContent className="py-12 px-8 flex flex-col items-center text-center space-y-8">
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <RefreshCw className="h-8 w-8 text-primary animate-pulse" />
              </div>
              
              <div className="space-y-4 w-full">
                <h3 className="text-xl font-semibold">
                  {state === "VALIDATING" && "Validating image..."}
                  {state === "UPLOADING" && "Uploading to server..."}
                  {state === "ANALYZING" && "Running AI model..."}
                </h3>
                
                <Progress value={progress} className="h-2 w-full" />
                
                <div className="text-sm text-muted-foreground flex flex-col items-start space-y-2 max-w-[200px] mx-auto">
                  <div className="flex items-center w-full justify-between">
                    <span>Preparing image</span>
                    {state === "UPLOADING" || state === "ANALYZING" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <span className="w-4 h-4 rounded-full border-2 border-muted-foreground"></span>}
                  </div>
                  <div className="flex items-center w-full justify-between">
                    <span>Running AI model</span>
                    {state === "ANALYZING" ? <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div> : <span className="w-4 h-4 rounded-full border-2 border-muted-foreground"></span>}
                  </div>
                  <div className="flex items-center w-full justify-between text-muted-foreground/50">
                    <span>Generating result</span>
                    <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/50"></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESULT STATE */}
        {state === "RESULT" && result && preview && (
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">GUAVA IMAGE</h3>
              <div className="rounded-xl overflow-hidden border bg-muted aspect-square flex items-center justify-center p-2">
                <img src={preview} alt="Analyzed Guava" className="max-h-full rounded-lg object-contain" />
              </div>
            </div>
            
            <div className="space-y-6 flex flex-col justify-center">
              <div>
                <h2 className="text-sm font-bold text-primary tracking-widest mb-1 uppercase">Analysis Complete</h2>
                <h1 className="text-4xl font-extrabold mb-2">{result.class}</h1>
                <p className="text-muted-foreground text-lg">
                  {result.confidence > 0.9 ? "High confidence" : result.confidence > 0.7 ? "Medium confidence" : "Low confidence result"}
                </p>
              </div>

              <Card className="shadow-sm border-primary/20">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Overall Confidence</span>
                      <span className="font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={result.confidence * 100} className="h-3" />
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Anthracnose</span>
                      <span className="font-medium">{(result.probabilities.Anthracnose * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Fruit Fly</span>
                      <span className="font-medium">{(result.probabilities.fruit_fly * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Healthy</span>
                      <span className="font-medium">{(result.probabilities.healthy_guava * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result.confidence < 0.6 && (
                <div className="bg-amber-50 text-amber-900 p-4 rounded-lg flex gap-3 text-sm border border-amber-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>The image may not contain enough visual information for a reliable classification. Try uploading a clearer image.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={resetState} size="lg" className="flex-1">Analyze Another</Button>
                <Button variant="outline" size="lg" className="flex-1 group">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {state === "ERROR" && (
          <Card className="w-full max-w-md border-destructive/50 shadow-md">
            <CardContent className="py-10 px-6 flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Analysis Failed</h3>
                <p className="text-muted-foreground">{errorMsg}</p>
              </div>
              <Button onClick={resetState} variant="outline" className="mt-4">Try Again</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/jpeg, image/png, image/webp"
      />
    </div>
  );
}
