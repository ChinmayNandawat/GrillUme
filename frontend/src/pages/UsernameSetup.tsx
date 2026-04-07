import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { checkUsernameAvailability } from "../services/api";

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

export const UsernameSetup = () => {
  const navigate = useNavigate();
  const {
    token,
    isAuthenticated,
    onboardingRequired,
    pendingProfile,
    completeOnboarding,
    clearAuthError,
    authError,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const normalizedUsername = useMemo(() => username.trim().toLowerCase(), [username]);
  const isFormatValid = USERNAME_REGEX.test(normalizedUsername);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (!normalizedUsername) {
        setAvailabilityError(null);
        setIsAvailable(false);
        return;
      }

      if (!isFormatValid) {
        setAvailabilityError("Use 3-24 chars: lowercase letters, numbers, underscore");
        setIsAvailable(false);
        return;
      }

      setIsChecking(true);
      try {
        const result = await checkUsernameAvailability(normalizedUsername);
        if (cancelled) return;
        setIsAvailable(result.available);
        setAvailabilityError(result.available ? null : result.reason || "Username is not available");
      } catch (error) {
        if (cancelled) return;
        setIsAvailable(false);
        setAvailabilityError(error instanceof Error ? error.message : "Could not verify username");
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void runCheck();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isFormatValid, normalizedUsername]);

  const handleSubmit = async () => {
    if (isSubmitting || !isAvailable) return;

    setIsSubmitting(true);
    clearAuthError();
    try {
      await completeOnboarding(normalizedUsername);
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!token || !onboardingRequired) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-xl mx-auto py-20">
      <div className="bg-white border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_#383835] overflow-hidden">
        <div className="bg-primary-container border-b-4 border-on-background px-5 py-4">
          <h1 className="font-headline text-3xl font-black uppercase tracking-tighter">Choose Username</h1>
          <p className="font-bold uppercase tracking-widest text-xs mt-2 opacity-70">
            one-time setup before entering the arena
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-sm font-bold uppercase tracking-wider bg-background border-2 border-on-background p-3">
            Signed in as: {pendingProfile?.googleDisplayName || "Google User"}
          </div>

          <div className="bg-tertiary-container border-2 border-on-background p-3 text-sm font-bold uppercase tracking-wider leading-snug">
            This is your identity in the ring. Everyone sees this, but your real name stays safe with us.
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2">Public Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              placeholder="e.g. roastmaster_01"
              className="w-full border-4 border-on-background p-3 font-bold"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="text-xs font-bold uppercase tracking-wider min-h-5">
            {isChecking ? (
              <span>Checking availability...</span>
            ) : availabilityError ? (
              <span className="text-secondary">{availabilityError}</span>
            ) : isAvailable ? (
              <span className="text-green-700">Username is available</span>
            ) : null}
          </div>

          {authError && (
            <p className="bg-secondary-container border-2 border-on-background p-3 font-bold text-sm">{authError}</p>
          )}

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleSubmit}
            disabled={!isAvailable || isSubmitting || isChecking}
          >
            {isSubmitting ? "SAVING..." : "CONTINUE"}
          </Button>
        </div>
      </div>
    </div>
  );
};
