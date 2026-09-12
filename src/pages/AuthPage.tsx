import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Form";

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/gestao", { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      if (signInError.code === "email_not_confirmed") {
        setError("Confirme o e-mail do usuário no Supabase antes de entrar.");
      } else if (signInError.code === "invalid_credentials") {
        setError("E-mail ou senha incorretos. Verifique também se o usuário foi criado neste projeto Supabase.");
      } else {
        setError(`Não foi possível entrar: ${signInError.message}`);
      }
      return;
    }
    navigate("/gestao", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf6ee] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-7 shadow-sm">
        <div className="text-center">
          <p className="font-display text-3xl text-brand-orange">Analio's Burguer</p>
          <p className="mt-1 text-sm text-black/50">Login da gestão</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={loading}>
          <LogIn size={17} /> {loading ? "Entrando..." : "Entrar na gestão"}
        </Button>
        <p className="text-center text-xs text-black/45">
          O usuário administrador deve ser criado em Authentication → Users no Supabase.
        </p>
      </form>
    </main>
  );
}
