import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback, clearAuthError, authError } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  const code = useMemo(() => searchParams.get("code") || "", [searchParams]);
  const errorDescription = useMemo(
    () => searchParams.get("error_description") || searchParams.get("error") || "",
    [searchParams]
  );

  const hashPayload = useMemo(() => {
    const raw = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const params = new URLSearchParams(raw);
    const accessToken = params.get("access_token") || "";
    const refreshToken = params.get("refresh_token") || "";
    const expiresAt = Number(params.get("expires_at") || "");
    return {
      accessToken,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : undefined,
      error: params.get("error_description") || params.get("error") || "",
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!code && !hashPayload.accessToken) {
        if (errorDescription || hashPayload.error) {
          clearAuthError();
        }
        setIsProcessing(false);
        return;
      }

      try {
        clearAuthError();
        const result = await handleGoogleCallback({
          code: code || undefined,
          accessToken: hashPayload.accessToken || undefined,
          refreshToken: hashPayload.refreshToken || undefined,
          expiresAt: hashPayload.expiresAt,
        });
        if (result.onboardingRequired) {
          navigate("/setup-username", { replace: true });
          return;
        }
        navigate("/", { replace: true });
      } catch {
        setIsProcessing(false);
      }
    };

    void run();
  }, [clearAuthError, code, errorDescription, handleGoogleCallback, hashPayload, navigate]);

  if (isProcessing) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter mb-4">Authenticating...</h1>
        <p className="font-bold uppercase tracking-widest text-sm opacity-70">Completing Google sign in</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <h1 className="font-headline text-5xl font-black uppercase tracking-tighter mb-4">Sign In Failed</h1>
      <p className="font-bold uppercase tracking-widest text-sm opacity-70 mb-8">
        {authError || errorDescription || hashPayload.error || "Missing or invalid OAuth callback payload"}
      </p>
      <Button variant="secondary" onClick={() => navigate("/", { replace: true })}>
        Back Home
      </Button>
    </div>
  );
};
