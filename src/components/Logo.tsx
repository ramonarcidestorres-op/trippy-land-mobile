import logo from "@/assets/trippy-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, alt = "Trippy Land Store" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logo}
      alt={alt}
      width={1024}
      height={1024}
      className={cn("object-contain", className)}
    />
  );
}
