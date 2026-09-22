"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Trash2, Package, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

type QueueItem = {
  id: string;
  file: File;
  preview: string;
};

type ProcessedItem = QueueItem & {
  result: AnalysisResult;
  status: "passed" | "defective";
};

type AnimationState = "idle" | "entering" | "scanning" | "exiting";

export default function FactoryDemoPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<ProcessedItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalProcessed = history.length;
  const totalPassed = history.filter(h => h.status === "passed").length;
  const totalDefective = history.filter(h => h.status === "defective").length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file)
      }));
      setQueue(prev => [...prev, ...newItems]);
    }
  };

  const clearData = () => {
    setQueue([]);
    setHistory([]);
    setCurrentItem(null);
    setAnimationState("idle");
    setCurrentResult(null);
    setIsPlaying(false);
  };

  // Main factory engine
  useEffect(() => {
    if (!isPlaying) return;

    if (animationState === "idle" && queue.length > 0) {
      // Pick next item
      const nextItem = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentItem(nextItem);
      setAnimationState("entering");
      setCurrentResult(null);
    }
  }, [isPlaying, animationState, queue]);

  // Handle entering -> scanning
  useEffect(() => {
    if (animationState === "entering" && currentItem) {
      const timer = setTimeout(() => {
        setAnimationState("scanning");
      }, 1500); // Entering animation takes 1.5s
      return () => clearTimeout(timer);
    }
  }, [animationState, currentItem]);

  // Handle scanning -> API call -> exiting
  useEffect(() => {
    if (animationState === "scanning" && currentItem) {
      let isSubscribed = true;
      const analyze = async () => {
        const formData = new FormData();
        formData.append("file", currentItem.file);
        
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fruit-disease-detection-backend.onrender.com";
          const res = await fetch(`${API_URL}/predict`, {
            method: "POST",
            body: formData,
          });
          
          if (!res.ok) throw new Error("API Error");
          const data: AnalysisResult = await res.json();
          if (isSubscribed) {
            setCurrentResult(data);
            // Wait a bit to show scanning effect, then exit
            setTimeout(() => {
              if (isSubscribed) setAnimationState("exiting");
            }, 1000);
          }

        } catch (err) {
          console.error(err);
          if (isSubscribed) {
            // Fallback dummy result on error
            const fakeResult = {
              class: "Error",
              confidence: 0,
              probabilities: { Anthracnose: 0, fruit_fly: 0, healthy_guava: 0 },
              model_version: "v1"
            };
            setCurrentResult(fakeResult);
            setTimeout(() => {
              if (isSubscribed) setAnimationState("exiting");
            }, 1000);
          }
        }
      };
      
      analyze();
      return () => { isSubscribed = false; };
    }
  }, [animationState, currentItem]);

  // Handle exiting -> idle
  useEffect(() => {
    if (animationState === "exiting" && currentItem && currentResult) {
      const isPassed = currentResult.class === "Healthy" || currentResult.class === "healthy_guava";
      
      // Play sound effect
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          if (isPassed) {
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          } else {
            // Reject buzzer sound
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }
          
          osc.connect(gain);
          gain.connect(ctx.destination);
        }
      } catch (e) {
        console.error("Audio playback failed", e);
      }
      
      const timer = setTimeout(() => {
        // Save to history
        setHistory(prev => [{
          ...currentItem,
          result: currentResult,
          status: isPassed ? "passed" : "defective"
        }, ...prev]);
        
        setCurrentItem(null);
        setCurrentResult(null);
        setAnimationState("idle");
      }, 1500); // Exiting animation takes 1.5s
      return () => clearTimeout(timer);
    }
  }, [animationState, currentItem, currentResult]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factory Conveyor Demo</h1>
          <p className="text-muted-foreground">Stream images to simulate an automated QA process.</p>
        </div>
        
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/jpeg, image/png, image/webp"
            multiple
          />
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/jpeg, image/png, image/webp"
            {...({ webkitdirectory: "true", directory: "true" } as any)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Add Images
          </Button>
          <Button variant="outline" onClick={() => folderInputRef.current?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Folder
          </Button>
          <Button 
            variant={isPlaying ? "secondary" : "default"} 
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={queue.length === 0 && animationState === "idle" && !currentItem}
          >
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? "Pause System" : "Start System"}
          </Button>
          <Button variant="destructive" onClick={clearData}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Main Factory Area */}
        <Card className="lg:col-span-3 flex flex-col bg-slate-900 border-slate-800 text-slate-100 overflow-hidden relative min-h-[500px]">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 pb-4 z-40">
            <CardTitle className="flex justify-between items-center text-lg font-medium">
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                Main Conveyor Belt
              </span>
              <span className="text-sm font-normal text-slate-400">
                Queue: {queue.length} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 relative p-0 flex items-center justify-center overflow-hidden">
            
            {/* Background Moving Belt lines */}
            <div className="absolute inset-x-0 top-1/2 -mt-16 h-32 bg-slate-800 border-y-4 border-slate-700 flex overflow-hidden">
               <motion.div 
                 className="flex w-[200%]"
                 animate={{ x: isPlaying ? ["-50%", "0%"] : 0 }}
                 transition={{ repeat: Infinity, ease: "linear", duration: 2 }}
               >
                 {/* Generate some belt tracks */}
                 {Array.from({length: 40}).map((_, i) => (
                   <div key={i} className="h-full w-4 bg-slate-900/50 mx-8 shrink-0"></div>
                 ))}
               </motion.div>
            </div>

            {/* Packaging Box (Right) */}
            <div className="absolute right-12 top-1/2 -mt-24 h-48 w-40 bg-green-900/40 border-4 border-green-700 rounded-lg flex flex-col items-center justify-center z-10">
              <Package className="h-10 w-10 text-green-500 mb-2 opacity-80" />
              <span className="text-green-500 font-bold tracking-widest uppercase">Passed</span>
            </div>

            {/* Discard Bin (Bottom Center) */}
            <div className="absolute bottom-0 left-1/2 -ml-24 h-32 w-48 bg-red-900/40 border-4 border-red-700 rounded-t-lg flex flex-col items-center justify-start pt-4 z-10">
              <span className="text-red-500 font-bold tracking-widest uppercase mb-2">Discard</span>
              <Trash2 className="h-8 w-8 text-red-500 opacity-80" />
            </div>

            {/* Scanner Frame (Center) */}
            <div className="absolute left-1/2 top-1/2 -ml-24 -mt-24 w-48 h-48 border-2 border-blue-500/50 rounded-xl z-20 pointer-events-none flex items-center justify-center">
              {animationState === "scanning" && (
                <motion.div 
                  className="w-full h-1 bg-blue-400 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)]"
                  initial={{ y: -90 }}
                  animate={{ y: 90 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear", repeatType: "reverse" }}
                />
              )}
              <div className="absolute -top-8 bg-slate-900/80 px-3 py-1 rounded text-xs font-mono text-blue-400 border border-blue-500/30">
                AI SCANNER
              </div>
            </div>

            {/* The Active Item */}
            <AnimatePresence>
              {currentItem && (
                <motion.div
                  key={currentItem.id}
                  className="absolute left-1/2 top-1/2 -ml-20 -mt-20 w-40 h-40 bg-white rounded-lg shadow-2xl p-2 z-30"
                  initial={{ x: -600, y: 0, rotate: -10, opacity: 0 }}
                  animate={
                    animationState === "entering" ? { x: 0, y: 0, rotate: 0, opacity: 1 } :
                    animationState === "scanning" ? { x: 0, y: 0, rotate: 0, opacity: 1 } :
                    animationState === "exiting" ? (
                      (currentResult?.class === "Healthy" || currentResult?.class === "healthy_guava")
                        ? { x: 400, y: 0, scale: 0.5, opacity: 0, rotate: 90 } // Move to package
                        : { x: 0, y: 300, scale: 0.5, opacity: 0, rotate: 45 } // Drop to bin
                    ) : {}
                  }
                  transition={{ 
                    duration: animationState === "scanning" ? 0.2 : 1.2,
                    ease: "easeInOut" 
                  }}
                >
                  <img src={currentItem.preview} alt="Current" className="w-full h-full object-cover rounded-md" />
                  
                  {/* Status Overlay while scanning/exiting */}
                  {currentResult && animationState === "exiting" && (
                    <div className={`absolute inset-0 bg-black/60 rounded-md flex items-center justify-center p-2 text-center`}>
                       {(currentResult.class === "Healthy" || currentResult.class === "healthy_guava") ? (
                         <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-lg" />
                       ) : (
                         <AlertCircle className="h-16 w-16 text-red-500 drop-shadow-lg" />
                       )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>

        {/* Dashboard Sidebar */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle className="text-lg">Batch Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center">
                 <span className="text-2xl font-bold text-green-600">{totalPassed}</span>
                 <span className="text-xs text-green-700 font-medium uppercase">Passed</span>
               </div>
               <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col items-center">
                 <span className="text-2xl font-bold text-red-600">{totalDefective}</span>
                 <span className="text-xs text-red-700 font-medium uppercase">Defective</span>
               </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <FileText className="mr-2 h-4 w-4" /> Recent Processing
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No items processed yet.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                      <img src={item.preview} className="h-12 w-12 rounded object-cover" alt="History item" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.result.class}</p>
                        <p className="text-xs text-muted-foreground">
                          Conf: {(item.result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        {item.status === "passed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
