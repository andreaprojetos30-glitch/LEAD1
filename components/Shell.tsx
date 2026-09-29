"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { SyncProvider } from "@/components/SyncProvider";
import { Button, Notice, TextInput, Wordmark } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function Shell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "setup" | "login" | "ready">("loading");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("setup");
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "ready" : "login");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? "ready" : "login");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (state === "loading") {
    return <p className="py-24 text-center text-lg text-eleva">Carregando…</p>;
  }
  if (state === "setup") return <SetupScreen />;
  if (state === "login") return <LoginScreen />;

  return (
    <SyncProvider>
      <div className="mx-auto w-full max-w-lg px-4 pt-6 pb-28">{children}</div>
    </SyncProvider>
  );
}

function SetupScreen() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-5 px-4 py-10">
      <Wordmark />
      <Notice>
        O sistema está pronto. Para gravar no banco, crie um projeto no Supabase e preencha o arquivo
        .env.local com a URL e a chave anon. O passo a passo está no README.
      </Notice>
      <ol className="list-decimal space-y-3 pl-5 text-base leading-7">
        <li>Crie o projeto em supabase.com.</li>
        <li>Rode o arquivo supabase/migrations/001_init.sql no SQL Editor.</li>
        <li>Crie um usuário da equipe em Authentication e desative a confirmação de e-mail.</li>
        <li>Copie .env.example para .env.local e cole as chaves.</li>
        <li>Reinicie o servidor e entre com o usuário da equipe.</li>
      </ol>
    </main>
  );
}

function loginMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado. No Supabase, abra Authentication → Users, confirme o usuário ou crie de novo com Auto Confirm marcado.";
  }
  if (text.includes("invalid login")) {
    return "E-mail ou senha não encontrados. Use o usuário criado em Authentication → Users, não o login do painel do Supabase.";
  }
  return `Não foi possível entrar. ${message}`;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) setError(loginMessage(authError.message));
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <Wordmark />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-eleva">E-mail</span>
          <TextInput
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-eleva">Senha</span>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
