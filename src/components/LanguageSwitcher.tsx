import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLanguage } = useLanguage();

  const handleSwitch = (newLang: "es" | "en") => {
    if (newLang === lang) return;
    setLanguage(newLang);
    if (newLang === "en") {
      toast.success("🇺🇸 English selected");
    } else {
      toast.success("🇨🇴 Español seleccionado");
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-surface-2 p-0.5 border border-border/40 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSwitch("es")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer active:scale-95",
          lang === "es"
            ? "bg-white text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>🇨🇴</span>
        <span>ES</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch("en")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer active:scale-95",
          lang === "en"
            ? "bg-white text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
