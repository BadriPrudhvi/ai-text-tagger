import { TextAnalyzer } from '@/components/text-analyzer';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-primary to-violet-300 bg-clip-text text-transparent">
            IntelliTag
          </h1>
          <ThemeToggle />
        </div>
        <TextAnalyzer />
      </div>
    </main>
  );
}