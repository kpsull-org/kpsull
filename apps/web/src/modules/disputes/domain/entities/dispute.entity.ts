import { Entity, UniqueId, Result } from '@/shared/domain';
import { DisputeType } from '../value-objects/dispute-type.vo';
import { DisputeStatus } from '../value-objects/dispute-status.vo';

interface DisputeProps {
  orderId: string;
  customerId: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDisputeProps {
  orderId: string;
  customerId: string;
  type: DisputeType;
  description: string;
}

/**
 * Dispute Entity (Aggregate Root)
 *
 * Represents a dispute/issue filed by a customer for a delivered order.
 *
 * Story 9-3: Signalement litige
 * - AC1: Button to report issue on delivered order
 * - AC2: Form with type and description
 * - AC3: Creates dispute with OPEN status
 */
export class Dispute extends Entity<DisputeProps> {
  private constructor(props: DisputeProps, id?: UniqueId) {
    super(props, id);
  }

  get idString(): string {
    return this._id.toString();
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get type(): DisputeType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): DisputeStatus {
    return this.props.status;
  }

  get resolution(): string | undefined {
    return this.props.resolution;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Start reviewing the dispute
   */
  startReview(): Result<void> {
    if (!this.status.canStartReview) {
      return Result.fail('Le litige ne peut pas etre mis en cours de traitement');
    }

    this.props.status = DisputeStatus.underReview();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Resolve the dispute with a resolution message
   */
  resolve(resolution: string): Result<void> {
    if (!this.status.canResolve) {
      return Result.fail('Le litige ne peut pas etre resolu dans son etat actuel');
    }

    if (!resolution?.trim()) {
      return Result.fail('Une resolution est requise pour cloturer le litige');
    }

    this.props.status = DisputeStatus.resolved();
    this.props.resolution = resolution.trim();
    this.props.resolvedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Close the dispute without resolution (rejected)
   */
  close(reason: string): Result<void> {
    if (!this.status.canClose) {
      return Result.fail('Le litige ne peut pas etre ferme dans son etat actuel');
    }

    if (!reason?.trim()) {
      return Result.fail('Une raison est requise pour fermer le litige');
    }

    this.props.status = DisputeStatus.closed();
    this.props.resolution = reason.trim();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Create a new dispute
   */
  static create(props: CreateDisputeProps): Result<Dispute> {
    if (!props.orderId?.trim()) {
      return Result.fail("L'identifiant de la commande est requis");
    }

    if (!props.customerId?.trim()) {
      return Result.fail("L'identifiant du client est requis");
    }

    if (!props.type) {
      return Result.fail('Le type de litige est requis');
    }

    if (!props.description?.trim()) {
      return Result.fail('La description du probleme est requise');
    }

    if (props.description.trim().length < 10) {
      return Result.fail('La description doit contenir au moins 10 caracteres');
    }

    const now = new Date();

    return Result.ok(
      new Dispute({
        orderId: props.orderId.trim(),
        customerId: props.customerId.trim(),
        type: props.type,
        description: props.description.trim(),
        status: DisputeStatus.open(),
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  /**
   * Reconstitute a dispute from persistence
   */
  static reconstitute(
    props: Omit<DisputeProps, 'type' | 'status'> & {
      id: string;
      type: string;
      status: string;
    }
  ): Result<Dispute> {
    const typeResult = DisputeType.fromString(props.type);
    if (typeResult.isFailure) {
      return Result.fail(typeResult.error!);
    }

    const statusResult = DisputeStatus.fromString(props.status);
    if (statusResult.isFailure) {
      return Result.fail(statusResult.error!);
    }

    return Result.ok(
      new Dispute(
        {
          orderId: props.orderId,
          customerId: props.customerId,
          type: typeResult.value!,
          description: props.description,
          status: statusResult.value!,
          resolution: props.resolution,
          resolvedAt: props.resolvedAt,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
        UniqueId.fromString(props.id)
      )
    );
  }
}
