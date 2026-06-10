import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastre-se como aluno ou preceptor."
    >
      <SignupForm />
    </AuthShell>
  );
}
