// app/dashboard/layout.tsx
import Navbar from '@/components/Navbar';

export default function TrainingLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
