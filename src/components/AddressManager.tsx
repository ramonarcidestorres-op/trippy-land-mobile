import { useState, useEffect } from "react";
import { MapPin, Navigation, Edit2, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fetchUserAddresses, saveUserAddress, mapDBToSaved, type DBAddress } from "@/lib/addresses-db";
import { addressStore, type SavedAddress } from "@/lib/address";
import { cn } from "@/lib/utils";

export function AddressManager({ trigger }: { trigger?: React.ReactNode } = {}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"options" | "form">("options");
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  
  // Selected address state (local UI)
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);

  // Form state
  const [form, setForm] = useState({
    address: "",
    neighborhood: "",
    apartment: "",
    instructions: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  // Escuchar evento global para abrir la pantalla sobresaliente de dirección
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      const list = addressStore.list();
      if (list.length === 0) {
        setView("form");
      } else {
        setView("options");
      }
    };
    window.addEventListener("tls-open-address-drawer", handleOpen);
    return () => window.removeEventListener("tls-open-address-drawer", handleOpen);
  }, []);

  // Load from DB
  useEffect(() => {
    if (user && open) {
      loadAddresses();
    }
  }, [user, open]);

  // Sync with local addressStore on mount to show in banner
  useEffect(() => {
    const sync = () => {
      setSelectedAddress(addressStore.selected());
    };
    sync();
    window.addEventListener("tls-address-change", sync);
    return () => window.removeEventListener("tls-address-change", sync);
  }, []);

  async function loadAddresses() {
    if (user) {
      const data = await fetchUserAddresses(user.id);
      setAddresses(data);
      if (data.length > 0 && !addressStore.selected()) {
        const saved = mapDBToSaved(data[0]);
        addressStore.save(saved);
        addressStore.select(saved.id);
      }
    } else {
      const local = addressStore.list();
      if (local.length > 0) {
        setAddresses(local as any); // Type cast for simplicity, the UI only needs id, address, neighborhood, apartment
      }
    }
  }

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      setView("form");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setLoading(false);
        setView("form");
        toast.success("Ubicación obtenida. Por favor completa los detalles.");
      },
      (err) => {
        console.error(err);
        toast.error("No se pudo obtener tu ubicación. Por favor escríbela.");
        setLoading(false);
        setView("form");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave() {
    if (form.address.trim().length < 5) {
      toast.error("Escribe una dirección válida.");
      return;
    }

    setLoading(true);
    let newDbAddress: any = null;

    if (user) {
      newDbAddress = await saveUserAddress({
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim() || null,
        apartment: form.apartment.trim() || null,
        instructions: form.instructions.trim() || null,
        lat: form.lat,
        lng: form.lng,
      }, user.id);
    } else {
      const safeId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "addr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      newDbAddress = {
        id: safeId,
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim() || null,
        apartment: form.apartment.trim() || null,
        instructions: form.instructions.trim() || null,
        lat: form.lat,
        lng: form.lng,
      };
    }

    setLoading(false);

    if (newDbAddress) {
      const saved = mapDBToSaved(newDbAddress);
      addressStore.save(saved); // Sync to local for checkout compatibility
      addressStore.select(saved.id);
      toast.success("Dirección guardada correctamente.");
      setOpen(false);
      resetForm();
    } else {
      toast.error("Error al guardar la dirección en la nube.");
    }
  }

  function resetForm() {
    setView("options");
    setForm({ address: "", neighborhood: "", apartment: "", instructions: "", lat: null, lng: null });
  }

  function handleSelectExisting(dbAddr: any) {
    let saved = dbAddr;
    if (!dbAddr.label) {
      saved = mapDBToSaved(dbAddr);
    }
    addressStore.save(saved);
    addressStore.select(saved.id);
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DrawerTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="flex w-full items-center justify-between p-1 transition-transform active:scale-95">
            <div className="flex items-center gap-2.5 text-left">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground">
                <MapPin className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  ¿Dónde entregamos?
                </p>
                <p className="line-clamp-1 text-[12px] font-semibold text-foreground">
                  {selectedAddress ? selectedAddress.address : "Selecciona una dirección"}
                </p>
              </div>
            </div>
            <div className="ml-2 shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-foreground">
              {selectedAddress ? "Cambiar" : "Agregar"}
            </div>
          </button>
        )}
      </DrawerTrigger>
      
      <DrawerContent className="bg-surface-2 border-border/40 max-h-[90vh] rounded-t-[32px] pb-[max(env(safe-area-inset-bottom),24px)]">
        <DrawerHeader className="px-6 pt-5 pb-2">
          <DrawerTitle className="text-left text-[18px] font-bold text-foreground">
            {view === "options" ? "Dirección de entrega" : "Detalles de tu dirección"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pb-6 overflow-y-auto">
          {view === "options" ? (
            <div className="space-y-4">
              <div className="grid gap-2.5">
                <Button 
                  onClick={handleGetLocation} 
                  disabled={loading}
                  className="h-12 w-full gap-2 rounded-2xl bg-surface hover:bg-surface-2 text-foreground font-semibold border border-border/50"
                >
                  {loading ? <Loader2 className="size-5 animate-spin text-primary" /> : <Navigation className="size-5 text-primary" />}
                  <span>Usar mi ubicación GPS actual</span>
                </Button>
                
                <Button 
                  onClick={() => setView("form")} 
                  variant="outline" 
                  className="h-12 w-full gap-2 rounded-2xl border-border/40 bg-surface/60 text-foreground hover:bg-surface"
                >
                  <Edit2 className="size-4 text-muted-foreground" />
                  <span>Escribir dirección manualmente</span>
                </Button>
              </div>

              {addresses.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Direcciones Guardadas
                  </h3>
                  <ul className="space-y-2">
                    {addresses.map((a) => (
                      <li key={a.id}>
                        <button
                          onClick={() => handleSelectExisting(a)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all",
                            selectedAddress?.id === a.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/40 bg-surface hover:bg-surface-2"
                          )}
                        >
                          <MapPin className={cn("mt-0.5 size-4 shrink-0", selectedAddress?.id === a.id ? "text-primary" : "text-muted-foreground")} />
                          <div>
                            <p className="text-[13px] font-bold text-foreground">{a.address}</p>
                            {(a.neighborhood || a.apartment) && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {[a.neighborhood, a.apartment].filter(Boolean).join(" • ")}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {form.lat && form.lng && (
                <div className="rounded-2xl bg-primary/10 p-3 text-xs text-primary font-medium flex gap-2 items-center border border-primary/20">
                  <Navigation className="size-4 shrink-0" /> 
                  <span>Ubicación GPS detectada correctamente</span>
                </div>
              )}
              
              <div>
                <Label htmlFor="address" className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Dirección Principal <span className="text-primary">*</span>
                </Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ej: Calle 45 # 12-34 o Edificio"
                  className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="neighborhood" className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Barrio o Sector
                  </Label>
                  <Input
                    id="neighborhood"
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Ej: El Poblado"
                    className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="apartment" className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Apto / Casa (Opcional)
                  </Label>
                  <Input
                    id="apartment"
                    value={form.apartment}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                    placeholder="Ej: Apto 301"
                    className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions" className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Indicaciones Adicionales
                </Label>
                <Input
                  id="instructions"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Ej: Dejar en portería, casa con reja negra..."
                  className="h-11 rounded-2xl bg-surface border-border/40 text-[13px] text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex-1 h-12 rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95"
                >
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Guardar y Usar"}
                </Button>
                <Button 
                  onClick={() => setView("options")} 
                  variant="ghost" 
                  className="h-12 rounded-full px-5 text-muted-foreground hover:text-foreground font-semibold"
                  disabled={loading}
                >
                  Volver
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
