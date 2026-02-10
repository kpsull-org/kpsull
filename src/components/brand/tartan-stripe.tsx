import { cn } from "@/lib/utils";

interface TartanStripeProps {
  className?: string;
}

export function TartanStripe({ className }: TartanStripeProps) {
  return (
    <div
      className={cn("h-6 w-full", className)}
      style={{
        backgroundImage: "url(/images/tartan-stripe.png)",
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
      }}
      aria-hidden="true"
    />
  );
}
