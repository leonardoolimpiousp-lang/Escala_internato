import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { confirm } = await searchParams;

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua área da escala de internato.">
      <LoginForm showConfirm={confirm === "1"} />
    </AuthShell>
  );
}
