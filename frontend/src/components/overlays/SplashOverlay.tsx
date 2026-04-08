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
  const [hasExited, setHasExited] = useState(false);
  const [startPosition, setStartPosition] = useState<LogoPosition>({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<LogoPosition>({ x: 30, y: 20 });
  const [viewportWidth, setViewportWidth] = useState(1366);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const hasRevealedAppRef = useRef(false);

  const updateLogoPositions = useCallback(() => {
    if (typeof window === "undefined" || !logoRef.current) return;

    setViewportWidth(window.innerWidth);

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
    const initialTimer = window.setTimeout(() => {
      updateLogoPositions();
    }, 0);

    const resizeTimer = window.setTimeout(() => {
      updateLogoPositions();
    }, 120);

    window.addEventListener("resize", updateLogoPositions);
    return () => {
      window.removeEventListener("resize", updateLogoPositions);
      window.clearTimeout(initialTimer);
      window.clearTimeout(resizeTimer);
    };
  }, [updateLogoPositions]);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage("grillMe"), 570),
      window.setTimeout(() => setStage("uLeft"), 1335),
      window.setTimeout(() => setStage("uMiddle"), 2400),
      window.setTimeout(() => {
        updateLogoPositions();
        setStage("fly");
      }, 3360),
      window.setTimeout(() => setStage("loading"), 4020),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [updateLogoPositions]);

  useEffect(() => {
    if (stage === "fly" || stage === "loading") return;
    const frameId = window.requestAnimationFrame(() => {
      updateLogoPositions();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [stage, updateLogoPositions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % SPLASH_LOADING_MESSAGES.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage !== "loading" || hasRevealedAppRef.current) return;
    onRevealApp();
    hasRevealedAppRef.current = true;
  }, [onRevealApp, stage]);

  useEffect(() => {
    const canExit = stage === "loading" && isHealthDone;
    if (!canExit || hasExited) return;

    const timer = window.setTimeout(() => {
      setHasExited(true);
      onComplete();
    }, 390);

    return () => window.clearTimeout(timer);
  }, [hasExited, isHealthDone, onComplete, stage]);

  const introScaleFactor = useMemo(() => {
    if (viewportWidth <= 360) return 0.46;
    if (viewportWidth <= 420) return 0.5;
    if (viewportWidth <= 540) return 0.58;
    if (viewportWidth <= 768) return 0.66;
    if (viewportWidth <= 1024) return 0.8;
    return 1;
  }, [viewportWidth]);

  const introStageScale =
    stage === "grill"
      ? 4.35
      : stage === "grillMe"
        ? 4.2
        : stage === "uLeft"
          ? 4
          : stage === "uMiddle"
            ? 3.8
            : 1;
  const logoScale = stage === "fly" || stage === "loading" ? 1 : introStageScale * introScaleFactor;
  const logoX = stage === "fly" || stage === "loading" ? targetPosition.x : startPosition.x;
  const logoY = stage === "fly" || stage === "loading" ? targetPosition.y : startPosition.y;
  const showQuestionMarks = stage === "uLeft";

  return (
    <AnimatePresence>
      {!hasExited && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === "loading" && isHealthDone ? 0 : 1 }}
          transition={{ duration: 0.51, ease: "easeInOut" }}
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
            transition={{ duration: 0.525, ease: "easeInOut" }}
          />

          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-[18%] left-[14%] h-32 w-32 rounded-full bg-[#F5C518]/22 blur-3xl"
              animate={{
                x: [0, 14, -10, 0],
                y: [0, -8, 10, 0],
              }}
              transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[12%] right-[13%] h-40 w-40 rounded-full bg-[#CC0000]/16 blur-3xl"
              animate={{
                x: [0, -16, 12, 0],
                y: [0, 12, -10, 0],
              }}
              transition={{ duration: 3.825, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
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
                duration: stage === "fly" || stage === "loading" ? 0.69 : stage === "grill" ? 0.42 : 0.375,
                ease: stage === "fly" || stage === "loading" ? [0.2, 0.88, 0.25, 1] : "easeOut",
              }}
            >
              {stage === "grill" ? (
                <motion.span layout>GRILL</motion.span>
              ) : stage === "grillMe" ? (
                <>
                  <motion.span layout>GRILL</motion.span>
                  <motion.span layout>ME</motion.span>
                </>
              ) : stage === "uLeft" ? (
                <>
                  <motion.span
                    layoutId="u-letter"
                    className="text-secondary mr-2 inline-block scale-125 drop-shadow-[2px_2px_0px_#000]"
                    initial={{ rotate: -12 }}
                    animate={{ rotate: -12 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    U
                  </motion.span>
                  <motion.span layout>GRILL</motion.span>
                  <motion.span layout>ME</motion.span>
                </>
              ) : (
                <>
                  <motion.span layout>GRILL</motion.span>
                  <motion.span
                    layoutId="u-letter"
                    className="text-secondary ml-1 mr-2 inline-block scale-125 drop-shadow-[2px_2px_0px_#000]"
                    initial={{ rotate: -12 }}
                    animate={{ rotate: -12 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    U
                  </motion.span>
                  <motion.span layout>ME</motion.span>
                </>
              )}

              {showQuestionMarks && (
                <motion.span
                  className="text-secondary ml-2 inline-block"
                  animate={{
                    opacity: [1, 0.55, 1, 0.68, 1],
                    x: [0, -1, 0.5, 0],
                  }}
                  transition={{ duration: 0.585, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  ???
                </motion.span>
              )}
            </motion.div>

            <motion.div
              className="absolute left-1/2 top-[67%] -translate-x-1/2 w-[min(88vw,560px)] px-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage === "loading" ? 1 : 0, y: stage === "loading" ? 0 : 12 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
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
                      duration: 2.5,
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
