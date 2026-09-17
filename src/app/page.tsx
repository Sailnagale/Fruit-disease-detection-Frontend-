import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
                AI-powered guava health analysis
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Upload a guava image and get an AI-based classification for Anthracnose, Fruit Fly infestation, or Healthy fruit in seconds.
              </p>
            </div>
            <div className="space-x-4 pt-4">
              <Link href="/analyze">
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full">
                  Analyze a Guava
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works & Capabilities */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Fast Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Powered by EfficientNet-B0, our model processes your image and delivers accurate results almost instantly.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">High Accuracy</h3>
                <p className="text-muted-foreground text-sm">
                  Trained on thousands of agricultural samples to detect minute signs of Anthracnose and Fruit Fly damage.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground text-sm">
                  Images are processed securely and not stored permanently. Built with production-level security in mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-8 flex items-center justify-center mt-auto">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GUAVA AI. Built for modern agriculture.
        </p>
      </footer>
    </div>
  );
}
