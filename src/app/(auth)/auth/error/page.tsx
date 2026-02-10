import { Metadata } from 'next';
import { AuthErrorContent } from './auth-error-content';

export const metadata: Metadata = {
  title: "Erreur d'authentification | Kpsull",
  description: "Une erreur est survenue lors de l'authentification",
};

const AUTH_ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  Configuration: {
    title: 'Erreur de configuration',
    description:
      "Le serveur d'authentification est mal configure. Veuillez contacter l'equipe technique.",
  },
  AccessDenied: {
    title: 'Acces refuse',
    description:
      "Vous n'avez pas les droits necessaires pour acceder a cette ressource.",
  },
  OAuthAccountNotLinked: {
    title: 'Compte deja existant',
    description:
      'Un compte existe deja avec cette adresse email mais utilise une methode de connexion differente. Connectez-vous avec votre methode habituelle.',
  },
  OAuthSignin: {
    title: 'Erreur OAuth',
    description:
      "Une erreur est survenue lors de l'initialisation de la connexion externe.",
  },
  OAuthCallback: {
    title: 'Erreur de connexion externe',
    description:
      'Une erreur est survenue lors de la connexion avec le fournisseur externe. Cela peut etre du a un probleme de base de donnees.',
  },
  OAuthCreateAccount: {
    title: 'Impossible de creer le compte',
    description:
      "Une erreur est survenue lors de la creation de votre compte via le fournisseur externe.",
  },
  Callback: {
    title: 'Erreur de callback',
    description:
      "Une erreur est survenue lors du traitement de l'authentification.",
  },
  CredentialsSignin: {
    title: 'Identifiants incorrects',
    description:
      "L'email ou le mot de passe est incorrect. Verifiez vos informations et reessayez.",
  },
  Verification: {
    title: 'Erreur de verification',
    description:
      'Le lien de verification est invalide ou a expire. Demandez un nouveau lien.',
  },
  Default: {
    title: "Erreur d'authentification",
    description:
      "Une erreur inattendue est survenue lors de l'authentification. Veuillez reessayer.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorCode = error || 'Default';
  const errorInfo = AUTH_ERROR_MESSAGES[errorCode] ?? {
    title: "Erreur d'authentification",
    description:
      "Une erreur inattendue est survenue lors de l'authentification. Veuillez reessayer.",
  };

  return (
    <AuthErrorContent
      errorCode={errorCode}
      title={errorInfo.title}
      description={errorInfo.description}
    />
  );
}
