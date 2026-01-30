/**
 * Returns Components
 *
 * UI components for the returns management system.
 */

// Status badge
export { ReturnStatusBadge, getReturnStatusLabel } from './return-status-badge';

// Action dialogs
export {
  ApproveDialog,
  RejectDialog,
  ReceiveDialog,
  RefundDialog,
} from './return-action-dialogs';

// Table component
export { ReturnsTable, type ReturnItem } from './returns-table';

// Client-facing components
export { RequestReturnModal } from './request-return-modal';
export { ShipReturnForm, type ShipReturnFormData } from './ship-return-form';

// Existing component
export { ReturnRequestCard } from './return-request-card';
