import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, User, Receipt, ShieldAlert, Store, ExternalLink, LogOut, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useReferral } from "@/hooks/useReferral";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { formatPrice } from "@/lib/format";
import { addressStore, type SavedAddress } from "@/lib/address";
import { AddressManager } from "@/components/AddressManager";
import { AppNotificationPrompt } from "@/components/AppNotificationPrompt";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { getAdjustedPrice } = useReferral();
  const { isOpen, toggleStoreStatus } = useStoreStatus();
  const count = cart.reduce((s, r) => s + r.quantity, 0);
  const cartSubtotal = cart.reduce((sum, r) => sum + getAdjustedPrice(r.products?.price ?? 0) * r.quantity, 0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isAdminRoute = pathname.startsWith("/admin");
  const isHomeOrCatalog = pathname === "/" || pathname === "/catalogo";
  const showFloatingCartPill = isHomeOrCatalog && count > 0;
  const hideBottomNav =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/producto") ||
    pathname.startsWith("/pedido") ||
    isAdminRoute;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WelcomeOnboarding />
      <AppNotificationPrompt />

      {/* CABECERA */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-2xl pt-[max(env(safe-area-inset-top),16px)] pb-2.5 border-b border-border/20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1">
          {isAdminRoute ? (
            /* CABECERA AISLADA PARA PANEL ADMINISTRADOR (Sin carrito ni selector de dirección de cliente) */
            <>
              <div className="flex items-center gap-2.5">
                <Link to="/admin/pedidos" className="flex items-center gap-2 transition-transform active:scale-95">
                  <div className="size-8 overflow-hidden rounded-xl bg-surface-2 p-1 border border-border/40">
                    <img src="/tripi-logo-app.png" alt="Trippy Land Logo" className="size-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-wider uppercase text-white">Trippy Land</span>
                    <span className="text-[10px] font-extrabold text-candy-lime">PANEL ADMIN</span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {/* Enlace para ver la tienda como cliente */}
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 h-8.5 rounded-full bg-surface-2 px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
                >
                  <Store className="size-3.5 text-primary" />
                  <span>Ver Tienda</span>
                </Link>

                {/* Menú de Usuario / Sesión */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 outline-none ring-1 ring-border/50">
                    <User className="size-4.5 text-muted-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-candy-lime text-[7px] font-black text-black ring-1 ring-background">
                      ★
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 border-border bg-surface-2 shadow-2xl rounded-2xl p-1.5">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground truncate border-b border-border/30">
                      <p className="font-bold text-foreground truncate">{user?.user_metadata?.full_name || user?.email}</p>
                      <span className="inline-block mt-0.5 rounded bg-candy-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-candy-lime">
                        ADMINISTRADOR
                      </span>
                    </div>

                    <DropdownMenuItem asChild>
                      <Link to="/" className="cursor-pointer font-medium text-xs flex items-center gap-2 py-2 px-3 rounded-xl">
                        <Store className="size-3.5 text-primary" />
                        <span>Ver tienda como cliente</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/admin/pedidos" className="cursor-pointer font-medium text-xs flex items-center gap-2 py-2 px-3 rounded-xl text-candy-lime">
                        <span>★ Panel de Administración</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border/30 my-1" />

                    <DropdownMenuItem
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/auth";
                      }}
                      className="cursor-pointer text-xs font-medium text-red-400 focus:bg-red-500/10 focus:text-red-400 flex items-center gap-2 py-2 px-3 rounded-xl"
                    >
                      <LogOut className="size-3.5" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            /* CABECERA NORMAL PARA CLIENTES */
            <>
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
                  <DropdownMenuContent align="end" className="w-52 border-border bg-surface-2 shadow-2xl rounded-2xl p-1.5">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground truncate border-b border-border/30">
                      <p className="font-bold text-foreground truncate">{user.user_metadata?.full_name || user.email}</p>
                      {user.role === "admin" && (
                        <span className="inline-block mt-0.5 rounded bg-candy-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-candy-lime">
                          ADMINISTRADOR
                        </span>
                      )}
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/pedidos" className="cursor-pointer font-medium text-xs py-2 px-3 rounded-xl">
                        Mis pedidos
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/pedidos" className="cursor-pointer font-bold text-xs text-candy-lime py-2 px-3 rounded-xl bg-candy-lime/10">
                          ★ Panel de Administración
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border/30 my-1" />
                    <DropdownMenuItem
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/auth";
                      }}
                      className="cursor-pointer text-xs font-medium text-red-400 focus:bg-red-500/10 focus:text-red-400 flex items-center gap-2 py-2 px-3 rounded-xl"
                    >
                      <LogOut className="size-3.5" />
                      <span>Cerrar sesión</span>
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
            </>
          )}
        </div>

        {/* AVISO DE TIENDA CERRADA PARA CLIENTES */}
        {!isAdminRoute && !isOpen && (
          <div className="mt-2 mx-auto max-w-5xl px-4">
            <div className="flex items-center gap-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 px-3.5 py-2 text-xs font-semibold text-red-400 shadow-sm">
              <ShieldAlert className="size-4 shrink-0 text-red-400" />
              <div className="flex-1">
                <span className="font-bold text-red-300">Tienda cerrada temporalmente:</span>{" "}
                <span className="text-red-200/90">No estamos recibiendo pedidos en este momento. Puedes explorar el menú.</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-36 pt-4 md:pb-12">{children}</main>

      {/* PÍLDORA FLOTANTE "IR AL CARRITO" (Solo en Home y Catálogo cuando hay productos) */}
      {showFloatingCartPill && (
        <div className="fixed bottom-[80px] inset-x-0 flex justify-center z-40 px-4 pointer-events-none animate-in slide-in-from-bottom-3 fade-in duration-300">
          <Link
            to="/carrito"
            className="pointer-events-auto h-11 px-4 rounded-full bg-[#18181b]/95 backdrop-blur-2xl text-white shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/15 flex items-center gap-3 transition-transform active:scale-95 hover:bg-neutral-900"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5.5 items-center justify-center rounded-full bg-white text-black text-[11px] font-black">
                {count}
              </span>
              <span className="text-xs font-bold text-white tracking-tight">
                Ir al Carrito
              </span>
            </div>

            <div className="h-3 w-px bg-white/20" />

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">
                {formatPrice(cartSubtotal)}
              </span>
              <ArrowRight className="size-3.5 text-white/80" />
            </div>
          </Link>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR: PÍLDORA FLOTANTE OSCURA CON SELECTOR BLANCO CREMA */}
      {!hideBottomNav && (
        <div className="fixed bottom-4 inset-x-0 z-30 md:hidden flex justify-center px-4 pointer-events-none">
          <nav className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#121214]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to as any}
                  aria-label={label}
                  className={cn(
                    "relative flex size-10.5 items-center justify-center rounded-full transition-all duration-200 active:scale-90",
                    active
                      ? "bg-[#F2F2F5] text-neutral-950 shadow-md"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Icon
                    strokeWidth={active ? 2.5 : 2}
                    className="size-5"
                  />
                  {/* Badge para el carrito si no está activo pero tiene ítems */}
                  {to === "/carrito" && !active && count > 0 && (
                    <span className="absolute top-1 right-1 flex size-2 rounded-full bg-candy-lime ring-2 ring-[#121214]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

