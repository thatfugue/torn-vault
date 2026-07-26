import MemberRoster from '@/components/MemberRoster';

export default function RosterPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Member Roster</h1>
        <p className="text-muted-foreground mt-1">Comprehensive view of all faction members and their details.</p>
      </header>

      <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
        <MemberRoster />
      </div>
    </div>
  );
}
