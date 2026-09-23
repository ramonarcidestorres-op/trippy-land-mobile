import { supabase } from "@/integrations/supabase/client";
import { type SavedAddress } from "@/lib/address";

export type DBAddress = {
  id: string;
  user_id: string;
  address: string;
  neighborhood?: string | null;
  apartment?: string | null;
  instructions?: string | null;
  lat?: number | null;
  lng?: number | null;
};

// Map DBAddress to local SavedAddress for compatibility
export function mapDBToSaved(db: DBAddress): SavedAddress {
  let references = "";
  if (db.neighborhood) references += db.neighborhood;
  if (db.apartment) references += (references ? ", " : "") + "Apto/Casa: " + db.apartment;
  
  return {
    id: db.id,
    label: "Dirección",
    address: db.address,
    references: references || undefined,
    notes: db.instructions || undefined,
  };
}

export async function fetchUserAddresses(userId: string): Promise<DBAddress[]> {
  const { data, error } = await supabase
    .from("addresses" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
  
  return data as DBAddress[];
}

export async function saveUserAddress(
  address: Omit<DBAddress, "id" | "user_id">, 
  userId: string
): Promise<DBAddress | null> {
  const { data, error } = await supabase
    .from("addresses" as any)
    .insert([{ ...address, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error("Error saving address:", error);
    return null;
  }
  
  return data as DBAddress;
}

export async function deleteUserAddress(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("addresses" as any)
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error("Error deleting address:", error);
    return false;
  }
  return true;
}
