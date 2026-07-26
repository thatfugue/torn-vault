import OCPlanner from '@/components/OCPlanner';

export default function CrimesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">OC Command Center</h1>
        <p className="text-muted-foreground mt-1">Organized Crime 2.0 planner, team optimization, and readiness tracking.</p>
      </header>

      <OCPlanner />
    </div>
  );
}
