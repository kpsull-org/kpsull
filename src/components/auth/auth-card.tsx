import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: {
    text: string;
    linkText: string;
    linkHref: string;
  };
}

/**
 * Auth Card component
 *
 * A card container for authentication forms with consistent styling.
 * Includes optional footer for navigation between auth pages.
 *
 * @example
 * ```tsx
 * <AuthCard
 *   title="Créer un compte"
 *   description="Commencez votre aventure sur Kpsull"
 *   footer={{
 *     text: "Déjà un compte ?",
 *     linkText: "Se connecter",
 *     linkHref: "/login"
 *   }}
 * >
 *   <GoogleSignInButton mode="signup" />
 * </AuthCard>
 * ```
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {footer.text}{' '}
            <Link
              href={footer.linkHref}
              className="text-primary underline-offset-4 hover:underline"
            >
              {footer.linkText}
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
