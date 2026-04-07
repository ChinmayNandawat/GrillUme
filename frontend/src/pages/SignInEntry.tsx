import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext.tsx";

export const SignInEntry = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAuthLoading, openAuthPanel, authError } = useAuth();

  const redirectTarget = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      openAuthPanel();
    }
  }, [isAuthenticated, isAuthLoading, openAuthPanel]);

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <h1 className="font-headline text-5xl font-black uppercase tracking-tighter mb-4">Sign In Required</h1>
      <p className="font-bold uppercase tracking-widest text-sm opacity-70 mb-8">
        Continue with Google to access this page.
      </p>
      {authError && <p className="mb-6 font-bold text-sm text-secondary">{authError}</p>}
      <Button variant="secondary" onClick={openAuthPanel}>
        Open Sign In Panel
      </Button>
    </div>
  );
};
