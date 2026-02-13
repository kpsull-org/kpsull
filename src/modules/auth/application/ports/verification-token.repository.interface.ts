export interface VerificationTokenData {
  identifier: string;
  token: string;
  expires: Date;
}

export interface IVerificationTokenRepository {
  create(identifier: string, token: string, expires: Date): Promise<void>;
  findByIdentifier(identifier: string): Promise<VerificationTokenData | null>;
  delete(identifier: string, token: string): Promise<void>;
  deleteByIdentifier(identifier: string): Promise<void>;
}
