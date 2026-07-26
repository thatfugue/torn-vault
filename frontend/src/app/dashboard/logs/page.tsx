import UnifiedLogs from '@/components/UnifiedLogs';

export default function LogsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Unified Terminal</h1>
        <p className="text-muted-foreground mt-1">Comprehensive intelligence feed tracking all faction activities.</p>
      </header>

      <UnifiedLogs />
    </div>
  );
}
