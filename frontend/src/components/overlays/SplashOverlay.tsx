import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPLASH_CONFIG, SPLASH_LOADING_MESSAGES } from "../../constants";
import { useSplashHealth } from "../../hooks/useSplashHealth";

type SplashOverlayProps = {
  onRevealApp: () => void;
  onComplete: () => void;
};

type IntroStage = "grill" | "grillMe" | "uLeft" | "uMiddle" | "fly" | "loading";

type LogoPosition = {
  x: number;
  y: number;
};

export const SplashOverlay = ({ onRevealApp, onComplete }: SplashOverlayProps) => {
  const { isComplete: isHealthDone } = useSplashHealth({
    endpoint: SPLASH_CONFIG.HEALTH_ENDPOINT,
    maxWaitMs: SPLASH_CONFIG.MAX_WAIT_MS,
    pingIntervalMs: SPLASH_CONFIG.PING_INTERVAL_MS,
    requestTimeoutMs: SPLASH_CONFIG.REQUEST_TIMEOUT_MS,
  });

  const [stage, setStage] = useState<IntroStage>("grill");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [canExit, setCanExit] = useState(false);
  const [hasExited, setHasExited] = useState(false);
  const [hasRevealedApp, setHasRevealedApp] = useState(false);
  const [startPosition, setStartPosition] = useState<LogoPosition>({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<LogoPosition>({ x: 30, y: 20 });
  const logoRef = useRef<HTMLDivElement | null>(null);

  const updateLogoPositions = useCallback(() => {
    if (typeof window === "undefined" || !logoRef.current) return;

    const logoWidth = logoRef.current.offsetWidth;
    const logoHeight = logoRef.current.offsetHeight;

    const centeredX = window.innerWidth / 2 - logoWidth / 2;
    const centeredY = window.innerHeight / 2 - logoHeight / 2;
    setStartPosition({ x: centeredX, y: centeredY });

    const navbarLogo = document.getElementById("navbar-logo-anchor");
    if (!navbarLogo) {
      setTargetPosition({ x: 30, y: 20 });
      return;
    }

    const rect = navbarLogo.getBoundingClientRect();
    setTargetPosition({ x: rect.left, y: rect.top });
  }, []);

  useEffect(() => {
    updateLogoPositions();

    const resizeTimer = window.setTimeout(() => {
      updateLogoPositions();
    }, 120);

    window.addEventListener("resize", updateLogoPositions);
    return () => {
      window.removeEventListener("resize", updateLogoPositions);
      window.clearTimeout(resizeTimer);
    };
  }, [updateLogoPositions]);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage("grillMe"), 520),
      window.setTimeout(() => setStage("uLeft"), 1100),
      window.setTimeout(() => setStage("uMiddle"), 2200),
      window.setTimeout(() => {
        updateLogoPositions();
        setStage("fly");
      }, 3020),
      window.setTimeout(() => setStage("loading"), 3780),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [updateLogoPositions]);

  useEffect(() => {
    if (stage === "fly" || stage === "loading") return;
    updateLogoPositions();
  }, [stage, updateLogoPositions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % SPLASH_LOADING_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage === "loading" && isHealthDone) {
      setCanExit(true);
    }
  }, [isHealthDone, stage]);

  useEffect(() => {
    if (stage !== "loading" || hasRevealedApp) return;
    onRevealApp();
    setHasRevealedApp(true);
  }, [hasRevealedApp, onRevealApp, stage]);

  useEffect(() => {
    if (!canExit || hasExited) return;

    const timer = window.setTimeout(() => {
      setHasExited(true);
      onComplete();
    }, 520);

    return () => window.clearTimeout(timer);
  }, [canExit, hasExited, onComplete]);

  const chaosAmplitude = useMemo(() => {
    if (typeof window === "undefined") {
      return 80;
    }
    return Math.min(window.innerWidth * 0.09, 95);
  }, []);

  const logoScale = stage === "grill" ? 4.35 : stage === "grillMe" ? 4.2 : stage === "uLeft" ? 4 : stage === "uMiddle" ? 3.8 : 1;
  const logoX = stage === "fly" || stage === "loading" ? targetPosition.x : startPosition.x;
  const logoY = stage === "fly" || stage === "loading" ? targetPosition.y : startPosition.y;
  const showQuestionMarks = stage === "uLeft";

  return (
    <AnimatePresence>
      {!hasExited && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: canExit ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ background: "#FAF7F0" }}
            animate={{
              background:
                stage === "loading"
                  ? "radial-gradient(circle at 10% 8%, rgba(245,197,24,0.25), rgba(250,247,240,1) 48%)"
                  : "radial-gradient(circle at 16% 15%, rgba(245,197,24,0.12), rgba(250,247,240,1) 52%)",
            }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />

          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-[18%] left-[14%] h-32 w-32 rounded-full bg-[#F5C518]/22 blur-3xl"
              animate={{
                x: [0, 22, -18, 0],
                y: [0, -10, 14, 0],
              }}
              transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[12%] right-[13%] h-40 w-40 rounded-full bg-[#CC0000]/16 blur-3xl"
              animate={{
                x: [0, -30, 24, 0],
                y: [0, 20, -16, 0],
              }}
              transition={{ duration: 2.7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </div>

          <div className="relative h-full w-full overflow-hidden">
            <motion.div
              ref={logoRef}
              className="fixed top-0 left-0 text-3xl font-black italic tracking-tighter text-on-background drop-shadow-[2px_2px_0px_#ffd709] font-headline uppercase flex items-center"
              initial={{ scale: 0.4, opacity: 0, x: startPosition.x, y: startPosition.y }}
              animate={{
                opacity: 1,
                scale: logoScale,
                x: logoX,
                y: logoY,
              }}
              transition={{
                duration: stage === "fly" || stage === "loading" ? 0.76 : stage === "grill" ? 0.42 : 0.35,
                ease: stage === "fly" || stage === "loading" ? [0.2, 0.88, 0.25, 1] : "easeOut",
              }}
            >
              {stage === "grill" ? (
                <span>GRILL</span>
              ) : stage === "grillMe" ? (
                <>
                  <span>GRILL</span>
                  <span>ME</span>
                </>
              ) : stage === "uLeft" ? (
                <>
                  <motion.span
                    className="text-secondary mr-2 inline-block scale-125 drop-shadow-[2px_2px_0px_#000]"
                    animate={{
                      x: [-chaosAmplitude * 0.45, chaosAmplitude * 0.55, -chaosAmplitude * 0.2, 0],
                      y: [0, -6, 6, 0],
                      rotate: [-16, 12, -8, -12],
                    }}
                    transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    U
                  </motion.span>
                  <span>GRILL</span>
                  <span>ME</span>
                </>
              ) : (
                <>
                  <span>GRILL</span>
                  <motion.span
                    className="text-secondary ml-1 mr-2 inline-block scale-125 drop-shadow-[2px_2px_0px_#000]"
                    animate={
                      stage === "uMiddle"
                        ? {
                            x: [-chaosAmplitude * 1.05, -chaosAmplitude * 0.2, 0],
                            y: [-12, 4, 0],
                            rotate: [-18, -6, -12],
                            scale: [1.06, 0.96, 1],
                          }
                        : {
                            x: 0,
                            y: 0,
                            rotate: -12,
                            scale: 1,
                          }
                    }
                    transition={
                      stage === "uMiddle"
                        ? { duration: 0.48, ease: "easeInOut" }
                        : { duration: 0.32, ease: "easeOut" }
                    }
                  >
                    U
                  </motion.span>
                  <span>ME</span>
                </>
              )}

              {showQuestionMarks && (
                <motion.span
                  className="text-secondary ml-2 inline-block"
                  animate={{
                    opacity: [1, 0.15, 1, 0.25, 1],
                    x: [0, -2, 1, 0],
                  }}
                  transition={{ duration: 0.42, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  ???
                </motion.span>
              )}
            </motion.div>

            <motion.div
              className="absolute left-1/2 top-[67%] -translate-x-1/2 w-[min(88vw,560px)] px-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage === "loading" ? 1 : 0, y: stage === "loading" ? 0 : 12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="rounded-xl border-4 border-on-background/90 bg-[#fffdf8] px-4 py-4 text-center text-on-background shadow-[6px_6px_0_#F5C518]">
                <p className="min-h-12 font-body text-sm md:text-base font-bold tracking-wide">
                  {SPLASH_LOADING_MESSAGES[loadingMessageIndex]}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#383835]/12">
                  <motion.div
                    className="h-full w-1/2 bg-[#F5C518]"
                    animate={{ x: ["-55%", "155%"] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
