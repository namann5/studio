import { Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Disc3 className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold font-headline text-primary/90">Nindo AI</span>
    </div>
  );
}
