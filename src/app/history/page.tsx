"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileClock, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HistoryItem = {
  id: string;
  result: string;
  confidence: number;
  date: string;
  preview: string | null;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("guava_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not load history", e);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 flex-1 flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis History</h1>
        <p className="text-muted-foreground">Review your past guava health analyses.</p>
      </div>

      {history.length === 0 ? (
        <Card className="flex-1 flex flex-col items-center justify-center min-h-[400px] border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center text-center space-y-4 py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <FileClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No history yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Your recent analyses will appear here. They are stored locally in your browser.
            </p>
            <Link href="/analyze" className="mt-4">
              <Button>Analyze a Guava</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card">
          <div className="grid grid-cols-[80px_1fr_1fr_150px] gap-4 p-4 border-b font-medium text-muted-foreground text-sm bg-muted/40">
            <div>Image</div>
            <div>Result</div>
            <div>Confidence</div>
            <div>Date</div>
          </div>
          <div className="divide-y">
            {history.map((item) => (
              <div key={item.id} className="grid grid-cols-[80px_1fr_1fr_150px] gap-4 p-4 items-center hover:bg-muted/20 transition-colors">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden border">
                  {item.preview ? (
                    <img src={item.preview} alt="Thumb" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🍈</span>
                  )}
                </div>
                <div className="font-semibold text-foreground">
                  {item.result}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{(item.confidence * 100).toFixed(1)}%</span>
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />
          <p>History is stored locally in your browser and will be cleared if you clear your site data.</p>
        </div>
      )}
    </div>
  );
}
