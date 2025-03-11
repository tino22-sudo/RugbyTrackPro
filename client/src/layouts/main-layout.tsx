import { ReactNode } from 'react';
import { useLocation } from 'wouter';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  
  // Don't show header on game tracking page for more space
  const isGameTracking = location.startsWith('/active-game');
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {!isGameTracking && (
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-heading font-bold">Rugby Stats Tracker</h1>
          </div>
        </header>
      )}
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
