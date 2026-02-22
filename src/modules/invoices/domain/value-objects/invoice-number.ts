export class InvoiceNumber {
  private readonly value: string;

  constructor(year: number, sequence: number) {
    this.value = `INV-${year}-${String(sequence).padStart(4, '0')}`;
  }

  static fromString(value: string): InvoiceNumber {
    const parts = value.split('-');
    const year = Number.parseInt(parts[1] ?? '0');
    const seq = Number.parseInt(parts[2] ?? '0');
    return new InvoiceNumber(year, seq);
  }

  toString(): string {
    return this.value;
  }
}
