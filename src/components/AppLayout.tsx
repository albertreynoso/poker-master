import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutGrid, GraduationCap, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navItems = [
    { path: '/ranges', label: 'Rangos', icon: LayoutGrid },
    { path: '/training', label: 'Training', icon: GraduationCap },
    { path: '/rangos-cash', label: 'Rangos Cash', icon: LayoutGrid },
  ];

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar con botón integrado */}
      <aside 
        className={cn(
          "border-r bg-card flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20" // Ancho reducido cuando está colapsado
        )}
      >
        {/* Header con botón toggle integrado */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold text-foreground">Poker Range Pro</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors w-full flex justify-center"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Navegación - se adapta al estado del sidebar */}
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
                      "flex items-center gap-3 rounded-lg transition-colors group",
                      "hover:bg-accent/50",
                      isActive && "bg-accent text-accent-foreground font-medium",
                      sidebarOpen ? "px-4 py-3" : "px-3 py-3 justify-center" // Centrado cuando está colapsado
                    )}
                    title={sidebarOpen ? item.label : item.label} // Tooltip cuando está colapsado
                  >
                    <Icon className="h-5 w-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      
      {/* Contenido principal */}
      <main 
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out"
        )}
      >
        {children}
      </main>
    </div>
  );
}