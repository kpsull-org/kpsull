"use client";

import { useRouter } from "next/navigation";

const ONBOARDING_URL = "/onboarding/creator/step/1";
const SIGNUP_URL = `/signup?callbackUrl=${encodeURIComponent(ONBOARDING_URL)}`;

interface BeCreatorButtonClientProps {
  isAuthenticated: boolean;
  className?: string;
  children: React.ReactNode;
}

export function BeCreatorButtonClient({
  isAuthenticated,
  className,
  children,
}: BeCreatorButtonClientProps) {
  const router = useRouter();

  function handleClick() {
    router.push(isAuthenticated ? ONBOARDING_URL : SIGNUP_URL);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
