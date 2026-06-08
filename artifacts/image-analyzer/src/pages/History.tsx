import { useGetHistory } from "@workspace/api-client-react";
import { CATEGORIES } from "@/lib/constants";
import { format } from "date-fns";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const { data: analyses, isLoading } = useGetHistory();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 border-b border-border pb-6">
        <h1 className="text-3xl font-mono tracking-tight font-bold flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          Diagnostics History
        </h1>
        <p className="text-muted-foreground">Log of all past component analyses.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-card/30 border-border">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : analyses && analyses.length > 0 ? (
        <div className="space-y-6">
          {analyses.map(analysis => (
            <Card key={analysis.id} className="overflow-hidden border-border bg-card/30 hover:bg-card/50 transition-colors" data-testid={`history-card-${analysis.id}`}>
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 bg-black shrink-0 relative border-r border-border">
                  <img 
                    src={analysis.imageData} 
                    alt={`Analysis ${analysis.id}`} 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono bg-background text-xs">
                          {CATEGORIES[analysis.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(new Date(analysis.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      <h3 className="font-medium text-foreground line-clamp-2 text-sm">
                        {analysis.analysisText}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-bold tracking-wider text-destructive flex items-center gap-1.5 uppercase">
                        <AlertCircle className="h-3 w-3" /> Issues
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analysis.issues.slice(0, 2).map((issue, i) => (
                          <li key={i} className="line-clamp-1 border-l-2 border-destructive/50 pl-2">{issue}</li>
                        ))}
                        {analysis.issues.length > 2 && (
                          <li className="text-muted-foreground/50 pl-2">+{analysis.issues.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-bold tracking-wider text-primary flex items-center gap-1.5 uppercase">
                        <CheckCircle2 className="h-3 w-3" /> Actions
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analysis.suggestions.slice(0, 2).map((suggestion, i) => (
                          <li key={i} className="line-clamp-1 border-l-2 border-primary/50 pl-2">{suggestion}</li>
                        ))}
                        {analysis.suggestions.length > 2 && (
                          <li className="text-muted-foreground/50 pl-2">+{analysis.suggestions.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-card/20 border-dashed flex flex-col items-center justify-center text-muted-foreground">
          <History className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="font-mono text-lg font-medium mb-1 text-foreground">No History Found</h3>
          <p className="text-sm">You haven't run any diagnostics yet.</p>
        </Card>
      )}
    </div>
  );
}
