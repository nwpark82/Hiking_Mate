import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function Loading() {
  return (
    <>
      <Header title="등산로 상세" />
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    </>
  );
}
