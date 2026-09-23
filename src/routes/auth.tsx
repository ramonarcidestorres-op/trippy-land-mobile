import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Trippy Land Store" },
      {
        name: "description",
        content: "Inicia sesión o crea tu cuenta para pedir dulces a domicilio.",
      },
      { property: "og:title", content: "Entrar — Trippy Land Store" },
      {
        property: "og:description",
        content: "Inicia sesión o crea tu cuenta para pedir dulces a domicilio.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    if (!loading && user) navigate({ to: (redirect ?? "/") as "/" });
  }, [user, loading, navigate, redirect]);

  return (
    <div className="relative min-h-screen bg-background px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 glow-top" />
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center">
        <Logo className="h-28 w-auto" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Dulces a domicilio, directo a tu puerta.
        </p>
        <Tabs defaultValue="login" className="mt-8 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-surface-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      toast.error("Escribe tu correo y tu contraseña.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) toast.error("No pudimos entrar: " + error.message);
  }

  async function resetPassword() {
    if (!email.trim()) {
      toast.error("Escribe tu correo para enviarte el enlace de recuperación.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Te enviamos un correo para restablecer tu contraseña.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Correo</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full candy-gradient text-primary-foreground">
        {busy ? "Entrando…" : "Entrar"}
      </Button>
      <button
        type="button"
        onClick={resetPassword}
        className="w-full text-center text-xs text-muted-foreground underline underline-offset-4"
      >
        Olvidé mi contraseña
      </button>
    </form>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      toast.error("Completa tu nombre, correo y una contraseña de al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) toast.error("No pudimos crear la cuenta: " + error.message);
    else toast.success("Cuenta creada. Si te pedimos confirmar el correo, revisa tu bandeja.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Nombre completo</Label>
        <Input
          id="signup-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Correo</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Contraseña</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full candy-gradient text-primary-foreground">
        {busy ? "Creando…" : "Crear cuenta"}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Tu cuenta se crea siempre como cliente.
      </p>
    </form>
  );
}
