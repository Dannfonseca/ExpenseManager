import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Settings,
  Menu,
  X,
  Terminal,
  LogOut,
  Users,
  Repeat,
  BookOpen,
  Calculator,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: Receipt },
  { name: "Recorrências", href: "/recurring", icon: Repeat },
  { name: "Adicionar", href: "/add-transaction", icon: Plus },
  { name: "Calculadora", href: "/calculator", icon: Calculator },
  { name: "Configurações", href: "/settings", icon: Settings },
  { name: "Guia de Uso", href: "/guide", icon: BookOpen },
];

const adminNavigation = [
  { name: "Logs Dev", href: "/dev-logs", icon: Terminal },
  { name: "Usuários", href: "/users", icon: Users },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  const isAdmin = userInfo?.role === "admin";

  const handleLogout = async () => {
    try {
      const token = userInfo?.token;
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Falha ao notificar o logout no backend:", error);
    } finally {
      localStorage.removeItem("userInfo");
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    }
  };

  const navigation = isAdmin
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "border-border transition-colors duration-200",
            mobileMenuOpen ? "bg-card/50 backdrop-blur-sm" : "bg-card"
          )}
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-border">
            <h2 className="text-xl font-bold text-primary">ExpenseManager</h2>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-card-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start mb-2"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">
                {userInfo?.email}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;