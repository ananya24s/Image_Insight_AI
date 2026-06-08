import { useState, useRef } from "react";
import { Upload, X, AlertCircle, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { CATEGORIES, CategoryKey } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { getGetHistoryQueryKey, type Analysis } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
      setResult(null); // Reset previous result
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!category || !file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", category);

      const res = await fetch(`${import.meta.env.BASE_URL}api/analyze`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Analysis failed");
      }

      const data = await res.json();
      setResult(data);
      
      queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
      
      toast({
        title: "Analysis Complete",
        description: "Diagnostics report generated successfully.",
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the device.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-mono tracking-tight font-bold">New Diagnostics Scan</h1>
        <p className="text-muted-foreground">Select a category and upload an image for AI-powered analysis.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Card className="border-border bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">1. Configuration</CardTitle>
              <CardDescription>Target component type</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={category} onValueChange={(val) => setCategory(val as CategoryKey)}>
                <SelectTrigger className="w-full bg-background border-border font-mono" data-testid="select-category">
                  <SelectValue placeholder="Select Category..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key} data-testid={`category-${key}`}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {category && (
            <Card className="border-border bg-card/30">
              <CardHeader>
                <CardTitle className="text-lg">2. Visual Input</CardTitle>
                <CardDescription>Upload image of component</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!preview ? (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-area"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 10MB</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      data-testid="input-file"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-md overflow-hidden border border-border bg-black aspect-video flex items-center justify-center group">
                      <img src={preview} alt="Preview" className="max-h-full object-contain" />
                      <button 
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-destructive text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        data-testid="btn-clear-image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <Button 
                      className="w-full font-mono font-bold tracking-wide" 
                      size="lg"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      data-testid="btn-analyze"
                    >
                      {isAnalyzing ? (
                        <>
                          <Activity className="mr-2 h-4 w-4 animate-pulse" />
                          ANALYZING...
                        </>
                      ) : (
                        "RUN DIAGNOSTICS"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {isAnalyzing ? (
            <Card className="h-full min-h-[400px] border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-primary relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] animate-[slide_2s_linear_infinite]" style={{ backgroundSize: '100% 200%' }} />
              <Activity className="h-12 w-12 animate-pulse mb-4" />
              <div className="font-mono text-sm tracking-[0.2em] font-medium">SCANNING IMAGE DATA...</div>
              <div className="text-xs mt-2 opacity-50 font-mono">Running neural diagnostics</div>
            </Card>
          ) : result ? (
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border bg-secondary/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-mono text-primary flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      ANALYSIS COMPLETE
                    </CardTitle>
                    <CardDescription className="mt-2 font-mono text-xs uppercase tracking-wider">
                      ID: {result.id} | TS: {new Date(result.createdAt).toISOString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono bg-background">
                    {CATEGORIES[result.category]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                
                <div className="space-y-3">
                  <h3 className="text-sm font-mono font-bold tracking-wider text-muted-foreground uppercase">Findings</h3>
                  <div className="p-4 rounded-md bg-secondary/30 border border-border text-sm leading-relaxed whitespace-pre-wrap">
                    {result.analysisText}
                  </div>
                </div>

                {result.issues && result.issues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold tracking-wider text-destructive uppercase flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Identified Issues
                    </h3>
                    <ul className="space-y-2">
                      {result.issues.map((issue, i) => (
                        <li key={i} className="flex gap-3 text-sm items-start p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                          <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 opacity-50" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold tracking-wider text-primary uppercase flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Actionable Suggestions
                    </h3>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-3 text-sm items-start p-3 rounded bg-primary/10 border border-primary/20 text-foreground">
                          <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[400px] border-border bg-card/20 flex flex-col items-center justify-center text-muted-foreground/50 border-dashed">
              <Activity className="h-12 w-12 mb-4 opacity-20" />
              <div className="font-mono text-sm tracking-widest uppercase">Waiting for input</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
