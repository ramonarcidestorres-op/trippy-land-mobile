/**
 * Supabase no tiene tabla de direcciones: orders.delivery_address es texto libre.
 * Guardamos las direcciones del cliente en el dispositivo y enviamos el texto
 * compuesto a orders.delivery_address al crear el pedido.
 */
export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  references?: string;
  notes?: string;
};

const KEY = "tls_addresses";
const SELECTED = "tls_selected_address";

function read(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedAddress[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("tls-address-change"));
}

export const addressStore = {
  list: read,
  selectedId(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED);
  },
  selected(): SavedAddress | null {
    const list = read();
    const id = addressStore.selectedId();
    return list.find((a) => a.id === id) ?? list[0] ?? null;
  },
  select(id: string) {
    window.localStorage.setItem(SELECTED, id);
    window.dispatchEvent(new Event("tls-address-change"));
  },
  save(entry: Omit<SavedAddress, "id"> & { id?: string }): SavedAddress {
    const list = read();
    const item: SavedAddress = { ...entry, id: entry.id ?? crypto.randomUUID() };
    const idx = list.findIndex((a) => a.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    write(list);
    window.localStorage.setItem(SELECTED, item.id);
    return item;
  },
  remove(id: string) {
    write(read().filter((a) => a.id !== id));
  },
};

export function composeAddress(a: SavedAddress): string {
  return [a.address, a.references && `Ref: ${a.references}`, a.notes && `Nota: ${a.notes}`]
    .filter(Boolean)
    .join(" | ");
}
