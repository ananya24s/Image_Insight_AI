import { Link, useLocation } from "wouter";
import { Cpu, History, Activity } from "lucide-react";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-mono font-bold tracking-tight text-lg">
            <Activity className="h-5 w-5" />
            <span>DIAGNOSTICS_SYS</span>
          </div>
          
          <nav className="flex items-center gap-1">
            <Link 
              href="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                location === "/" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              data-testid="link-home"
            >
              <Cpu className="h-4 w-4" />
              <span>Analyzer</span>
            </Link>
            <Link 
              href="/history" 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                location === "/history" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              data-testid="link-history"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
