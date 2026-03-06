import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Globe, Loader2, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

export function Login() {
  const { login, loginStatus, isInitializing } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Terminal grid background */}
      <div className="absolute inset-0 terminal-grid opacity-60" />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-sm" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-sm" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-sm" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-sm" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full mx-4"
      >
        {/* Main Card */}
        <div className="bg-card border border-border rounded-xl p-8 glow-card space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-center mx-auto"
            >
              <img
                src="/assets/generated/vertex-logo-transparent.dim_600x200.png"
                alt="Vertex"
                className="h-12 w-auto object-contain"
              />
            </motion.div>
            <div>
              <p className="text-muted-foreground text-sm font-mono mt-1">
                Professional Trading Terminal
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              {
                icon: Zap,
                title: "Real-time Prices",
                desc: "Live market data with 10s refresh",
              },
              {
                icon: Shield,
                title: "Secure by Design",
                desc: "Internet Identity authentication",
              },
              {
                icon: Globe,
                title: "On-chain Trading",
                desc: "All trades recorded on the blockchain",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/50"
              >
                <feature.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
          >
            <Button
              data-ocid="login.primary_button"
              onClick={() => login()}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-11 font-mono font-semibold text-sm bg-primary hover:bg-primary/90 text-background gap-2"
            >
              {isLoggingIn || isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Secure, decentralized authentication — no passwords required
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-muted-foreground/50 font-mono">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with caffeine.ai
          </a>
        </div>
      </motion.div>
    </div>
  );
}
