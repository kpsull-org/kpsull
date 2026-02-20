import type { NotificationTypeValue } from '../../domain/value-objects/notification-type.vo';
import { baseLayout, paragraph, ctaButton, infoBox, highlight } from './base-layout';

export interface EmailTemplateData {
  [key: string]: string | number | undefined;
}

interface EmailTemplate {
  subject: (data: EmailTemplateData) => string;
  html: (data: EmailTemplateData) => string;
  text: (data: EmailTemplateData) => string;
}

const templates: Record<NotificationTypeValue, EmailTemplate> = {
  // === CLIENT EMAILS ===

  WELCOME: {
    subject: () => 'Bienvenue sur Kpsull !',
    html: () =>
      baseLayout(
        'Bienvenue sur Kpsull !',
        paragraph("Nous sommes ravis de vous accueillir sur Kpsull, la marketplace des créateurs français.") +
        paragraph("Découvrez des produits uniques, faits main, et soutenez les artisans de votre région.") +
        ctaButton('Explorer la boutique', `${process.env.NEXTAUTH_URL ?? ''}/`)
      ),
    text: () => 'Bienvenue sur Kpsull ! Découvrez des produits uniques de créateurs français.',
  },

  VERIFICATION_CODE: {
    subject: () => 'Votre code de vérification - Kpsull',
    html: (d) =>
      baseLayout(
        'Vérifiez votre adresse email',
        paragraph(`Pour sécuriser votre compte, entrez le code ci-dessous. Il expire dans <strong>10 minutes</strong>.`) +
        `<div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">${d.code}</span>
        </div>` +
        paragraph("Si vous n'avez pas demandé ce code, ignorez cet email.")
      ),
    text: (d) => `Votre code de vérification Kpsull : ${d.code}. Expire dans 10 minutes.`,
  },

  PASSWORD_RESET: {
    subject: () => 'Réinitialisation de votre mot de passe - Kpsull',
    html: (d) =>
      baseLayout(
        'Réinitialisation du mot de passe',
        paragraph(`Vous avez demandé à réinitialiser votre mot de passe. Ce code expire dans <strong>10 minutes</strong>.`) +
        `<div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">${d.code}</span>
        </div>` +
        paragraph("Si vous n'avez pas fait cette demande, ignorez cet email.")
      ),
    text: (d) => `Code de réinitialisation Kpsull : ${d.code}. Expire dans 10 minutes.`,
  },

  ORDER_CONFIRMED: {
    subject: (d) => `Commande #${d.orderNumber} confirmée - Kpsull`,
    html: (d) =>
      baseLayout(
        'Commande confirmée !',
        paragraph(`Votre commande <strong>#${d.orderNumber}</strong> a été confirmée et sera préparée par le créateur.`) +
        infoBox(
          highlight('Montant', `${d.amount} €`) +
          highlight('Adresse', `${d.address ?? ''}`)
        ) +
        paragraph("Vous recevrez un email avec le numéro de suivi dès l'expédition.")
      ),
    text: (d) => `Commande #${d.orderNumber} confirmée. Montant: ${d.amount} €.`,
  },

  ORDER_SHIPPED: {
    subject: (d) => `Commande #${d.orderNumber} expédiée - Kpsull`,
    html: (d) =>
      baseLayout(
        'Votre colis est en route !',
        paragraph(`Votre commande <strong>#${d.orderNumber}</strong> a été expédiée.`) +
        infoBox(
          highlight('Transporteur', `${d.carrier ?? 'N/A'}`) +
          highlight('N° de suivi', `${d.trackingNumber ?? 'N/A'}`)
        ) +
        (d.trackingUrl ? ctaButton('Suivre mon colis', String(d.trackingUrl)) : '')
      ),
    text: (d) => `Commande #${d.orderNumber} expédiée. Suivi: ${d.trackingNumber ?? 'N/A'}.`,
  },

  ORDER_DELIVERED: {
    subject: (d) => `Commande #${d.orderNumber} livrée - Kpsull`,
    html: (d) =>
      baseLayout(
        'Votre commande est arrivée !',
        paragraph(`Votre commande <strong>#${d.orderNumber}</strong> a été livrée avec succès.`) +
        paragraph("Si tout vous convient, n'hésitez pas à laisser un avis pour aider le créateur !") +
        ctaButton('Laisser un avis', `${process.env.NEXTAUTH_URL ?? ''}/orders/${d.orderId}/review`)
      ),
    text: (d) => `Commande #${d.orderNumber} livrée. Laissez un avis !`,
  },

  ORDER_CANCELLED: {
    subject: (d) => `Commande #${d.orderNumber} annulée - Kpsull`,
    html: (d) =>
      baseLayout(
        'Commande annulée',
        paragraph(`Votre commande <strong>#${d.orderNumber}</strong> a été annulée.`) +
        (d.reason ? infoBox(`Raison : ${d.reason}`) : '') +
        paragraph("Si un paiement a été effectué, le remboursement sera traité sous 5 à 10 jours ouvrés.")
      ),
    text: (d) => {
      const reasonSuffix = d.reason ? ` Raison: ${d.reason}` : '';
      return `Commande #${d.orderNumber} annulée.${reasonSuffix}`;
    },
  },

  REFUND_PROCESSED: {
    subject: (d) => `Remboursement effectué - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Remboursement effectué',
        paragraph(`Le remboursement de votre commande <strong>#${d.orderNumber}</strong> a été traité.`) +
        infoBox(highlight('Montant remboursé', `${d.amount} €`)) +
        paragraph("Le montant apparaîtra sur votre compte sous 5 à 10 jours ouvrés selon votre banque.")
      ),
    text: (d) => `Remboursement de ${d.amount} € traité pour la commande #${d.orderNumber}.`,
  },

  RETURN_APPROVED: {
    subject: (d) => `Retour approuvé - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Votre demande de retour est approuvée',
        paragraph(`Le créateur a accepté votre demande de retour pour la commande <strong>#${d.orderNumber}</strong>.`) +
        infoBox(
          highlight('Adresse de retour', `${d.returnAddress ?? 'Voir détails commande'}`)
        ) +
        paragraph("Veuillez expédier le colis dans les 14 jours. Le remboursement sera traité à réception.")
      ),
    text: (d) => `Retour approuvé pour la commande #${d.orderNumber}.`,
  },

  RETURN_REJECTED: {
    subject: (d) => `Retour refusé - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Demande de retour refusée',
        paragraph(`Le créateur n'a pas pu accepter votre demande de retour pour la commande <strong>#${d.orderNumber}</strong>.`) +
        (d.reason ? infoBox(`Raison : ${d.reason}`) : '') +
        paragraph("Si vous estimez que cette décision est injuste, vous pouvez ouvrir un litige.")
      ),
    text: (d) => {
      const reasonSuffix = d.reason ? ` Raison: ${d.reason}` : '';
      return `Retour refusé pour la commande #${d.orderNumber}.${reasonSuffix}`;
    },
  },

  DISPUTE_UPDATE: {
    subject: (_d) => `Mise à jour de votre litige - Kpsull`,
    html: (d) =>
      baseLayout(
        'Mise à jour de votre litige',
        paragraph(`Votre litige concernant la commande <strong>#${d.orderNumber}</strong> a été mis à jour.`) +
        infoBox(highlight('Nouveau statut', `${d.status ?? ''}`)) +
        paragraph(`${d.message ?? "Notre équipe suit votre dossier."}`)
      ),
    text: (d) => `Litige mis à jour pour la commande #${d.orderNumber}. Statut: ${d.status}.`,
  },

  // === CREATOR EMAILS ===

  CREATOR_WELCOME: {
    subject: () => "Bienvenue dans l'aventure Kpsull !",
    html: () =>
      baseLayout(
        "Bienvenue, créateur !",
        paragraph("Vous avez fait le premier pas pour rejoindre la communauté Kpsull. Complétez votre profil pour commencer à vendre.") +
        ctaButton('Compléter mon profil', `${process.env.NEXTAUTH_URL ?? ''}/onboarding`)
      ),
    text: () => 'Bienvenue sur Kpsull ! Complétez votre profil pour commencer à vendre.',
  },

  CREATOR_ACTIVATED: {
    subject: () => 'Votre boutique est active ! - Kpsull',
    html: () =>
      baseLayout(
        'Votre boutique est prête !',
        paragraph("Félicitations ! Votre compte créateur est maintenant actif. Vous pouvez commencer à publier vos produits.") +
        ctaButton('Accéder à ma boutique', `${process.env.NEXTAUTH_URL ?? ''}/dashboard`)
      ),
    text: () => 'Votre boutique Kpsull est active ! Commencez à vendre.',
  },

  ORDER_RECEIVED: {
    subject: (d) => `Nouvelle commande #${d.orderNumber} !`,
    html: (d) =>
      baseLayout(
        'Nouvelle commande reçue !',
        paragraph(`Un client a passé la commande <strong>#${d.orderNumber}</strong>.`) +
        infoBox(
          highlight('Montant', `${d.amount} €`) +
          highlight('Client', `${d.customerName ?? ''}`)
        ) +
        ctaButton('Voir la commande', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/orders/${d.orderId}`)
      ),
    text: (d) => `Nouvelle commande #${d.orderNumber} de ${d.customerName}. Montant: ${d.amount} €.`,
  },

  ORDER_PAID: {
    subject: (d) => `Paiement reçu - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Paiement confirmé',
        paragraph(`Le paiement de la commande <strong>#${d.orderNumber}</strong> a été confirmé. Préparez l'expédition !`) +
        infoBox(highlight('Montant', `${d.amount} €`)) +
        ctaButton('Préparer la commande', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/orders/${d.orderId}`)
      ),
    text: (d) => `Paiement confirmé pour la commande #${d.orderNumber}. Montant: ${d.amount} €.`,
  },

  RETURN_REQUEST_RECEIVED: {
    subject: (d) => `Demande de retour - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Demande de retour reçue',
        paragraph(`Un client a demandé un retour pour la commande <strong>#${d.orderNumber}</strong>.`) +
        (d.reason ? infoBox(`Raison : ${d.reason}`) : '') +
        ctaButton('Gérer le retour', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/returns/${d.returnId}`)
      ),
    text: (d) => `Demande de retour pour la commande #${d.orderNumber}.`,
  },

  DISPUTE_OPENED: {
    subject: (d) => `Litige ouvert - Commande #${d.orderNumber}`,
    html: (d) =>
      baseLayout(
        'Un litige a été ouvert',
        paragraph(`Un client a ouvert un litige concernant la commande <strong>#${d.orderNumber}</strong>.`) +
        (d.reason ? infoBox(`Raison : ${d.reason}`) : '') +
        paragraph("Nous vous invitons à répondre rapidement pour résoudre la situation.") +
        ctaButton('Voir le litige', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/disputes/${d.disputeId}`)
      ),
    text: (d) => `Litige ouvert pour la commande #${d.orderNumber}.`,
  },

  REVIEW_RECEIVED: {
    subject: (d) => {
      const productSuffix = d.productName ? ` pour ${d.productName}` : '';
      return `Nouvel avis reçu${productSuffix} - Kpsull`;
    },
    html: (d) =>
      baseLayout(
        'Nouvel avis client',
        paragraph(`Un client a laissé un avis${d.productName ? ' pour <strong>' + d.productName + '</strong>' : ''}.`) +
        (d.rating ? infoBox(highlight('Note', `${'★'.repeat(Number(d.rating))}${'☆'.repeat(5 - Number(d.rating))}`)) : '') +
        (d.comment ? paragraph(`"${d.comment}"`) : '') +
        ctaButton('Voir mes avis', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/reviews`)
      ),
    text: (d) => {
      const productSuffix = d.productName ? ` pour ${d.productName}` : '';
      return `Nouvel avis reçu${productSuffix}. Note: ${d.rating}/5.`;
    },
  },

  SUBSCRIPTION_RENEWED: {
    subject: () => 'Abonnement renouvelé - Kpsull',
    html: (d) =>
      baseLayout(
        'Abonnement renouvelé',
        paragraph(`Votre abonnement <strong>${d.planName ?? ''}</strong> a été renouvelé avec succès.`) +
        infoBox(
          highlight('Montant', `${d.amount} €`) +
          highlight('Prochaine facturation', `${d.nextBillingDate ?? ''}`)
        )
      ),
    text: (d) => `Abonnement ${d.planName} renouvelé. Montant: ${d.amount} €.`,
  },

  SUBSCRIPTION_EXPIRING: {
    subject: () => 'Votre abonnement expire bientôt - Kpsull',
    html: (d) =>
      baseLayout(
        'Abonnement bientôt expiré',
        paragraph(`Votre abonnement <strong>${d.planName ?? ''}</strong> expire le <strong>${d.expiryDate ?? ''}</strong>.`) +
        paragraph("Renouvelez-le pour continuer à vendre sur Kpsull.") +
        ctaButton('Renouveler', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/settings/subscription`)
      ),
    text: (d) => `Votre abonnement ${d.planName} expire le ${d.expiryDate}. Renouvelez-le !`,
  },

  PAYMENT_FAILED: {
    subject: () => 'Échec de paiement - Kpsull',
    html: (d) =>
      baseLayout(
        'Échec de paiement',
        paragraph(`Le paiement de votre abonnement <strong>${d.planName ?? ''}</strong> a échoué.`) +
        paragraph("Veuillez mettre à jour votre moyen de paiement pour éviter la suspension de votre boutique.") +
        ctaButton('Mettre à jour le paiement', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/settings/subscription`)
      ),
    text: (d) => `Échec de paiement pour l'abonnement ${d.planName}. Mettez à jour votre moyen de paiement.`,
  },

  ACCOUNT_SUSPENDED: {
    subject: () => 'Compte suspendu - Kpsull',
    html: (d) =>
      baseLayout(
        'Votre compte a été suspendu',
        paragraph("Votre compte créateur a été suspendu par l'équipe Kpsull.") +
        (d.reason ? infoBox(`Raison : ${d.reason}`) : '') +
        paragraph("Si vous pensez qu'il s'agit d'une erreur, contactez notre support.")
      ),
    text: (d) => {
      const reasonSuffix = d.reason ? ` Raison: ${d.reason}` : '';
      return `Compte suspendu.${reasonSuffix}`;
    },
  },

  ACCOUNT_REACTIVATED: {
    subject: () => 'Compte réactivé - Kpsull',
    html: () =>
      baseLayout(
        'Votre compte est réactivé !',
        paragraph("Bonne nouvelle ! Votre compte créateur a été réactivé. Vous pouvez reprendre votre activité.") +
        ctaButton('Accéder à ma boutique', `${process.env.NEXTAUTH_URL ?? ''}/dashboard`)
      ),
    text: () => 'Votre compte créateur Kpsull a été réactivé !',
  },

  STYLE_APPROVED: {
    subject: (d) => `Votre style "${d.styleName}" a été approuvé - Kpsull`,
    html: (d) =>
      baseLayout(
        'Votre style est en ligne !',
        paragraph(`Bonne nouvelle ! Votre style <strong>${d.styleName ?? ''}</strong> a été approuvé par notre équipe.`) +
        paragraph("Vous pouvez maintenant publier vos articles utilisant ce style.") +
        ctaButton('Voir mes produits', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/products`)
      ),
    text: (d) => `Votre style "${d.styleName}" a été approuvé. Vous pouvez maintenant publier vos articles.`,
  },

  STYLE_REJECTED: {
    subject: (d) => `Votre style "${d.styleName}" n'a pas été approuvé - Kpsull`,
    html: (d) =>
      baseLayout(
        'Demande de style refusée',
        paragraph(`Votre style <strong>${d.styleName ?? ''}</strong> n'a pas pu être approuvé par notre équipe.`) +
        (d.reason ? infoBox(`Motif : ${d.reason}`) : '') +
        paragraph("Vous pouvez soumettre un nouveau style en tenant compte de ce retour.") +
        ctaButton('Proposer un nouveau style', `${process.env.NEXTAUTH_URL ?? ''}/dashboard/products`)
      ),
    text: (d) => {
      const reasonSuffix = d.reason ? ` Motif: ${d.reason}` : '';
      return `Votre style "${d.styleName}" n'a pas été approuvé.${reasonSuffix}`;
    },
  },
};

export function getEmailTemplate(type: NotificationTypeValue): EmailTemplate | undefined {
  return templates[type];
}
