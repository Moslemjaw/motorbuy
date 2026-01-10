import { motion } from "framer-motion";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingPage({ message = "Loading...", fullScreen = true }: LoadingPageProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center relative">
        {/* Rotating Rings */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          {/* Middle Ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-b-2 border-l-2 border-primary/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
           {/* Inner Ring */}
           <motion.div
            className="absolute inset-4 rounded-full border-t-2 border-primary/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Logo with Pulse */}
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 bg-background rounded-full flex items-center justify-center z-10 shadow-sm"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img 
              src={carLogo} 
              alt="MotorBuy" 
              className="w-12 h-12 md:w-16 md:h-16 object-contain"
            />
          </motion.div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <span className="text-sm md:text-base font-medium text-muted-foreground tracking-wide uppercase">
              {message}
            </span>
            {/* Simple progress bar line */}
            <div className="h-0.5 w-24 bg-muted overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-primary"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
