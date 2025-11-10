"use client";
import { useRouter } from "next/navigation";

export default function TwoStepPage() {
  const router = useRouter();

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    alert("Code validé (démo).");
    router.push("/");
  }

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl space-y-4"
      >
        <h1 className="text-xl font-semibold">Vérification en deux étapes</h1>
        <input
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10"
          placeholder="Code reçu par email/app"
        />
        <button className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600">
          Vérifier
        </button>
      </form>
    </main>
  );
}
