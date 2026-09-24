import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, User, Receipt } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { addressStore, type SavedAddress } from "@/lib/address";
import { AddressManager } from "@/components/AddressManager";
import { AppNotificationPrompt } from "@/components/AppNotificationPrompt";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/catalogo", label: "Catálogo", icon: LayoutGrid },
  { to: "/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/carrito", label: "Carrito", icon: ShoppingCart },
] as const;

function useSelectedAddress() {
  const [addr, setAddr] = useState<SavedAddress | null>(null);
  useEffect(() => {
    const sync = () => setAddr(addressStore.selected());
    sync();
    window.addEventListener("tls-address-change", sync);
    return () => window.removeEventListener("tls-address-change", sync);
  }, []);
  return addr;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const address = useSelectedAddress();
  const { cart } = useCart();
  const count = cart.reduce((s, r) => s + r.quantity, 0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideBottomNav =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/producto") ||
    pathname.startsWith("/pedido") ||
    pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background">
      <WelcomeOnboarding />
      <AppNotificationPrompt />
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-2xl pt-[max(env(safe-area-inset-top),16px)] pb-2.5 border-b border-border/20">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-1">
          <div className="flex-1 min-w-0 pr-2">
            <AddressManager />
          </div>
          <Link
            to="/carrito"
            className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface-2"
            aria-label="Carrito"
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 outline-none">
                <User className="size-5 text-muted-foreground" />
                {user.role === "admin" && (
                  <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-candy-lime text-[8px] font-black text-black ring-2 ring-background">
                    ★
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-border bg-surface-2 shadow-xl">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground truncate flex items-center justify-between">
                  <span className="truncate">{user.user_metadata?.full_name || user.email}</span>
                  {user.role === "admin" && (
                    <span className="shrink-0 ml-1 rounded bg-candy-lime/20 px-1 py-0.5 text-[9px] font-extrabold text-candy-lime">
                      ADMIN
                    </span>
                  )}
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/pedidos" className="cursor-pointer font-medium">
                    Mis pedidos
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/pedidos" className="cursor-pointer font-medium text-candy-lime">
                      Panel de Administración
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/auth";
                  }}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="relative grid size-10 shrink-0 place-items-center rounded-full bg-surface-2"
              aria-label="Entrar"
            >
              <User className="size-5 text-muted-foreground" />
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4 md:pb-12">{children}</main>

      {!hideBottomNav && (
        <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-background/85 backdrop-blur-2xl border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
          <div className="flex h-16 items-center justify-around px-2">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to as any}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                    active ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    strokeWidth={active ? 2.5 : 2}
                    className={cn(
                      "size-5 transition-transform",
                      active ? "scale-110" : ""
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
