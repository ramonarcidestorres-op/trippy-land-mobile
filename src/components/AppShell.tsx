import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, Receipt, MapPin, ShoppingCart } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { cartQuery } from "@/lib/queries";
import { addressStore, type SavedAddress } from "@/lib/address";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/catalogo", label: "Catálogo", icon: LayoutGrid },
  { to: "/carrito", label: "Carrito", icon: ShoppingBag },
  { to: "/pedidos", label: "Pedidos", icon: Receipt },
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
  const { data: cart } = useQuery(cartQuery(user?.id));
  const count = (cart ?? []).reduce((s, r) => s + r.quantity, 0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 glow-top opacity-60" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="shrink-0">
            <Logo className="h-9 w-auto" />
          </Link>
          <Link
            to="/checkout"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs text-muted-foreground"
          >
            <MapPin className="size-3.5 shrink-0 text-candy-lime" />
            <span className="truncate">
              {address ? address.address : "Agregar dirección de entrega"}
            </span>
          </Link>
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-5xl">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to as any}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
