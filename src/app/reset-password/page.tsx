"use client";
import Link from "next/link";

export default function ResetPasswordPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      "Si un compte existe pour cet email, un lien de réinitialisation sera envoyé."
    );
  }

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl space-y-4"
      >
        <h1 className="text-xl font-semibold">Réinitialiser le mot de passe</h1>
        <input
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10"
          placeholder="Email"
        />
        <button className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600">
          Envoyer le lien
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          <Link href="/signin" className="underline">
            Retour à la connexion
          </Link>
        </div>
      </form>
    </main>
  );
}
