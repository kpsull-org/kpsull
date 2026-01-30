import { ValueObject } from "./value-object.base";

interface UniqueIdProps {
  value: string;
}

export class UniqueId extends ValueObject<UniqueIdProps> {
  private constructor(props: UniqueIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(id?: string): UniqueId {
    return new UniqueId({ value: id ?? crypto.randomUUID() });
  }

  public static fromString(id: string): UniqueId {
    if (!id || id.trim() === "") {
      throw new Error("UniqueId cannot be empty");
    }
    return new UniqueId({ value: id });
  }

  public override toString(): string {
    return this.props.value;
  }
}
