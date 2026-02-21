import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React, { type JSXElementConstructor } from 'react';
import type { InvoiceData, InvoiceType } from '../../domain/entities/invoice.entity';
import { CreatorSubscriptionTemplate } from './templates/creator-subscription.template';
import { ClientOrderTemplate } from './templates/client-order.template';
import { PlatformSummaryTemplate } from './templates/platform-summary.template';

type PdfDocument = React.ReactElement<DocumentProps, string | JSXElementConstructor<DocumentProps>>;

export class PdfGeneratorService {
  async generateInvoicePdf(data: InvoiceData, type: InvoiceType): Promise<Buffer> {
    let element: PdfDocument;

    switch (type) {
      case 'CREATOR_SUBSCRIPTION':
        element = React.createElement(CreatorSubscriptionTemplate, { data }) as unknown as PdfDocument;
        break;
      case 'CLIENT_ORDER':
        element = React.createElement(ClientOrderTemplate, { data }) as unknown as PdfDocument;
        break;
      case 'PLATFORM_SUMMARY':
        element = React.createElement(PlatformSummaryTemplate, { data }) as unknown as PdfDocument;
        break;
      default:
        throw new Error(`Type de facture inconnu: ${String(type)}`);
    }

    return Buffer.from(await renderToBuffer(element));
  }
}
