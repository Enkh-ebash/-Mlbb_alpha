"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [loading, token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-text-secondary">Ачаалж байна…</p>
    </main>
  );
}
