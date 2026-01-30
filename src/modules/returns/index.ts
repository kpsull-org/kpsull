// Domain - Entities
export { ReturnRequest as ReturnRequestEntity } from './domain/entities';

// Domain - Value Objects
export {
  ReturnStatus,
  type ReturnStatusValue,
  ReturnReason,
  type ReturnReasonValue,
} from './domain/value-objects';

// Application - Ports
export type {
  ReturnRepository,
  ReturnRequest,
  ReturnFilters,
  PaginationOptions,
} from './application/ports';

// Application - Use Cases
export {
  ApproveReturnUseCase,
  type ApproveReturnInput,
  type ApproveReturnOutput,
} from './application/use-cases';

export {
  RejectReturnUseCase,
  type RejectReturnInput,
  type RejectReturnOutput,
} from './application/use-cases';

export {
  ListReturnsUseCase,
  type ListReturnsInput,
  type ListReturnsOutput,
  type ReturnListItem,
} from './application/use-cases';

// Infrastructure
export { MockReturnRepository } from './infrastructure';
