import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isPublicPath(pathname: string): boolean {
  const publicExactPaths = [
    "/",
    "/aboutus",
    "/services",
    "/programas",
    "/smart-projects",
    "/project-academy",
    "/registro",
    "/ingresar",
    "/terminos-y-condiciones",
    "/politica-de-privacidad",
  ];

  const publicStartsWith = [
    "/_next",
    "/favicon",
    "/images",
    "/legal",
  ];

  const publicApiExactPaths = [
    "/api/auth/confirm", 
  ];

  if (publicExactPaths.includes(pathname)) return true;
  if (publicStartsWith.some((prefix) => pathname.startsWith(prefix))) return true;
  if (publicApiExactPaths.includes(pathname)) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPlatformPath = pathname.startsWith("/plataforma");
  const isAdminPath = pathname.startsWith("/plataforma/admin");

  
  if (!isPlatformPath && isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie);
          }
        },
      },
    }
  );

  // Rutas privadas: 
  if (isPlatformPath) {
    const { data, error } = await supabaseServerClient.auth.getUser();
    const authenticatedUser = data.user;

    if (!authenticatedUser || error) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/ingresar";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminPath) {
      const { data: profile } = await supabaseServerClient
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUser.id)
        .maybeSingle();

      if (profile?.role !== "super_admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/plataforma";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
