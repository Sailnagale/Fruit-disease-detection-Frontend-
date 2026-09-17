"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bug, Leaf, AlertTriangle } from "lucide-react";

type HistoryItem = {
  id: string;
  result: string;
  confidence: number;
  date: string;
  preview: string | null;
};

export default function DashboardPage() {
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

  const total = history.length;
  const healthyCount = history.filter(h => h.result === "Healthy").length;
  const anthracnoseCount = history.filter(h => h.result === "Anthracnose").length;
  const fruitFlyCount = history.filter(h => h.result === "Fruit Fly").length;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 flex-1 flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your recent guava health analyses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Anthracnose</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anthracnoseCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Fruit Fly</CardTitle>
            <Bug className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fruitFlyCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Recent Analyses</h2>
        <div className="rounded-md border bg-card max-w-2xl">
          {total === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No data available yet.
            </div>
          ) : (
            <div className="divide-y">
              {history.slice(0, 5).map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 hover:bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium text-sm">{item.result}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
