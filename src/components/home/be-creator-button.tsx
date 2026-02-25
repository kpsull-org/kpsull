import { auth } from "@/lib/auth/auth";
import { BeCreatorButtonClient } from "./be-creator-button-client";

interface BeCreatorButtonProps {
  className?: string;
  children: React.ReactNode;
}

export async function BeCreatorButton({
  className,
  children,
}: Readonly<BeCreatorButtonProps>) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <BeCreatorButtonClient isAuthenticated={isAuthenticated} className={className}>
      {children}
    </BeCreatorButtonClient>
  );
}
