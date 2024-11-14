'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  MessageSquare, 
  Tag,
  Smile,
  Frown,
  Meh,
  Package,
  AlertCircle,
  ChevronRight,
  Layers,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const MAX_CHARS = 300;

type Analysis = {
  sentiment: {
    label: 'Positive' | 'Negative' | 'Neutral';
    color: string;
  };
  products: string[];
  issues: string[];
};

const getSentimentIcon = (label: string) => {
  switch (label) {
    case 'Positive':
      return <Smile className="w-4 h-4" />;
    case 'Negative':
      return <Frown className="w-4 h-4" />;
    default:
      return <Meh className="w-4 h-4" />;
  }
};

export function TextAnalyzer() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const result = await response.json();
      setAnalysis(result as Analysis);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze text. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5" />
                Text Analysis
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your Cloudflare-related feedback or inquiry below
              </CardDescription>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary hover:bg-primary/20 w-fit"
            >
              AI-Powered Analysis
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Type your text here..."
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              className="min-h-[120px] sm:min-h-[150px] resize-none px-4 py-3 text-base
                focus-visible:ring-2 focus-visible:ring-primary/30
                transition-all duration-200"
            />
            <div className="absolute bottom-3 right-3">
              <Badge 
                variant="secondary"
                className={cn(
                  "text-xs font-normal",
                  text.length >= MAX_CHARS ? "bg-red-500/10 text-red-500" : "bg-muted"
                )}
              >
                {text.length}/{MAX_CHARS}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center 
            justify-between gap-4 pt-2">
            <div className="flex flex-col xs:flex-row items-start xs:items-center 
              gap-3 xs:gap-2 text-sm text-muted-foreground w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 shrink-0" />
                <span>Detects Sentiment</span>
              </div>
              <span className="hidden xs:block mx-2">•</span>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 shrink-0" />
                <span>Identifies Cloudflare Products</span>
              </div>
            </div>
            
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="relative group w-full sm:w-auto min-w-[140px] 
                transition-all duration-200 hover:shadow-md"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Tag className="w-4 h-4" />
                  Analyze Text
                  <span className="absolute inset-x-0 h-px bottom-0 bg-primary/20 
                    scale-x-0 group-hover:scale-x-100 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full 
          -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none 
          opacity-75 sm:opacity-100" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full 
          translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none 
          opacity-75 sm:opacity-100" />
      </Card>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sentiment Analysis */}
                <div className="flex flex-col gap-3 pb-6 border-b">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(analysis.sentiment.label)}
                    <h3 className="font-medium">Sentiment Analysis</h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      analysis.sentiment.color,
                      'text-sm py-1.5 px-3 flex items-center gap-2 w-fit'
                    )}
                  >
                    {analysis.sentiment.label}
                  </Badge>
                </div>

                {/* Products Section */}
                <div className="flex flex-col gap-3 pb-6 border-b">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <h3 className="font-medium">Cloudflare Products Detected</h3>
                  </div>
                  {analysis.products.length > 0 ? (
                    <div className="inline-flex flex-wrap items-center gap-1.5">
                      {analysis.products.map((product) => (
                        <div
                          key={product}
                          className="inline-flex items-center gap-2 bg-blue-500/5 text-blue-500 
                            rounded-lg py-1.5 px-3 text-sm"
                        >
                          <Package className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{product}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      No products mentioned
                    </span>
                  )}
                </div>

                {/* Issues Section */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <h3 className="font-medium">Category Identified</h3>
                  </div>
                  {analysis.issues.length > 0 ? (
                    <div className="inline-flex flex-wrap items-center gap-1.5">
                      {analysis.issues.map((issue) => (
                        <div
                          key={issue}
                          className="inline-flex items-center gap-2 bg-orange-500/5 text-orange-500 
                            rounded-lg py-1.5 px-3 text-sm"
                        >
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      No issues identified
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}