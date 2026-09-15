"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? "Имэйл эсвэл нууц үг буруу байна." : "Сервертэй холбогдож чадсангүй.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-center bg-gradient-to-br from-surface via-bg to-bg px-16 lg:flex">
        <span className="font-display text-sm font-medium tracking-wide text-teal">MLBB Play</span>
        <h1 className="mt-4 max-w-md font-display text-5xl font-bold leading-[1.1] text-text-primary">
          Чадвараа
          <br />
          батал.
        </h1>
        <p className="mt-6 max-w-sm text-text-secondary">
          Ранк тоглолт, шударга matchmaking, лидерборд — Монголын MLBB тоглогчдод зориулсан
          тэмцээний платформ.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold text-text-primary">Нэвтрэх</h2>
          <p className="mt-2 text-sm text-text-secondary">Акаунт руугаа буцаж ор.</p>

          <div className="mt-8 space-y-4">
            <Field
              id="email"
              label="Имэйл"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              id="password"
              label="Нууц үг"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="mt-4 text-sm text-coral">{error}</p>}

          <div className="mt-8">
            <Button type="submit" loading={submitting}>
              Нэвтрэх
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Акаунтгүй юу?{" "}
            <Link href="/register" className="text-teal hover:underline">
              Бүртгүүлэх
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
