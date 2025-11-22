import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
