import WarIntelligence from '@/components/WarIntelligence';
import { Swords } from 'lucide-react';

export default function WarPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Swords className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">War Intelligence</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm font-medium uppercase tracking-wider">Strategic Combat Analysis & Performance Metrics</p>
      </header>

      <WarIntelligence />
    </div>
  );
}
