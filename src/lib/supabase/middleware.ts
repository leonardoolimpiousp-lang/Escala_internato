import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza a sessão do Supabase a cada request e protege rotas privadas.
 * Baseado no padrão oficial @supabase/ssr para Next.js App Router.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rode lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/aluno") ||
    pathname.startsWith("/preceptor") ||
    pathname.startsWith("/dashboard");

  // Sem usuário em rota protegida → manda para login.
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Observação: não redirecionamos automaticamente o usuário logado para fora
  // de /login|/cadastro. Isso evita loop quando há sessão sem perfil em
  // public.users (o /dashboard manda de volta para /login). O roteamento
  // pós-login é feito pelas próprias actions/páginas conforme o papel.

  return supabaseResponse;
}
