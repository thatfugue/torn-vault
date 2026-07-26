import AdvancedWarPay from '@/components/AdvancedWarPay';
import { WarPayProvider } from '@/contexts/WarPayContext';

export default function WarPayPage() {
  return (
    <WarPayProvider>
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Ranked War Calculator</h1>
          <p className="text-muted-foreground mt-1">Advanced payout distribution for faction members based on multi-metric performance.</p>
        </header>

        <AdvancedWarPay />
      </div>
    </WarPayProvider>
  );
}
