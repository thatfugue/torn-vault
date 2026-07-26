import ArmoryLog from '@/components/ArmoryLog';

export default function ArmoryPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Armory Intelligence</h1>
        <p className="text-muted-foreground mt-1">Track deposits, withdrawals, and asset usage across the faction.</p>
      </header>

      <ArmoryLog />
    </div>
  );
}
