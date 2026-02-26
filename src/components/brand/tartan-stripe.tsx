import { cn } from "@/lib/utils";

interface TartanStripeProps {
  className?: string;
}

export function TartanStripe({ className }: TartanStripeProps) {
  return (
    <div
      className={cn("h-6 w-full", className)}
      style={{
        backgroundImage: "url(https://res.cloudinary.com/damucxy2t/image/upload/f_auto,q_auto/kpsull/static/tartan-stripe)",
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
      }}
      aria-hidden="true"
    />
  );
}
