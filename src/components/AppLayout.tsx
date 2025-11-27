import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutGrid, GraduationCap } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/ranges', label: 'Rangos', icon: LayoutGrid },
    { path: '/training', label: 'Training', icon: GraduationCap },
    { path: '/rangos-cash', label: 'Rangos Cash', icon: LayoutGrid },
  ];

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-foreground">Poker Range Pro</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      "hover:bg-accent/50",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
