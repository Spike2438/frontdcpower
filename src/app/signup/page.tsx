"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    // Inscription fictive -> on connecte l'utilisateur
    login({ id: "u2", name: "New User", email: "new@example.com" });
    router.push("/");
  }

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <form
        onSubmit={handleSignUp}
        className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl space-y-4"
      >
        <h1 className="text-xl font-semibold">Créer un compte</h1>
        <input
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10"
          placeholder="Nom"
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10"
          placeholder="Email"
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10"
          type="password"
          placeholder="Mot de passe"
        />
        <button className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600">
          S’inscrire
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Déjà inscrit ?{" "}
          <Link href="/signin" className="underline">
            Se connecter
          </Link>
        </div>
      </form>
    </main>
  );
}
