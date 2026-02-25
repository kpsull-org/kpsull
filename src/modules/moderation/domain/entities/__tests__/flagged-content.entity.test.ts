import { describe, it, expect } from 'vitest';
import { FlaggedContent, type FlaggedContentProps } from '../flagged-content.entity';

describe('FlaggedContent', () => {
  const makeProps = (): FlaggedContentProps => ({
    id: 'fc-1',
    contentId: 'prod-1',
    contentType: 'PRODUCT',
    contentTitle: 'Produit suspect',
    contentDescription: 'Description du produit',
    contentImageUrl: 'https://example.com/image.jpg',
    creatorId: 'user-1',
    creatorName: 'Bob Martin',
    creatorEmail: 'bob@example.com',
    flaggedBy: 'user-2',
    flagReason: 'INAPPROPRIATE_CONTENT',
    flagDetails: 'Contenu offensant',
    status: 'PENDING',
    moderatorId: 'mod-1',
    moderatorNote: 'En cours de vérification',
    flaggedAt: new Date('2024-01-10T08:00:00Z'),
    moderatedAt: new Date('2024-01-11T09:00:00Z'),
  });

  describe('constructor', () => {
    it('should create with all props', () => {
      expect(new FlaggedContent(makeProps())).toBeInstanceOf(FlaggedContent);
    });

    it('should create without optional fields', () => {
      const { contentDescription: _d, contentImageUrl: _u, flagDetails: _f, moderatorId: _mi, moderatorNote: _mn, moderatedAt: _ma, ...minimal } = makeProps();
      expect(new FlaggedContent(minimal)).toBeInstanceOf(FlaggedContent);
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      expect(new FlaggedContent(makeProps()).id).toBe('fc-1');
    });

    it('should return contentId', () => {
      expect(new FlaggedContent(makeProps()).contentId).toBe('prod-1');
    });

    it('should return contentType PRODUCT', () => {
      expect(new FlaggedContent(makeProps()).contentType).toBe('PRODUCT');
    });

    it('should return contentType REVIEW', () => {
      expect(new FlaggedContent({ ...makeProps(), contentType: 'REVIEW' }).contentType).toBe('REVIEW');
    });

    it('should return contentType PAGE', () => {
      expect(new FlaggedContent({ ...makeProps(), contentType: 'PAGE' }).contentType).toBe('PAGE');
    });

    it('should return contentTitle', () => {
      expect(new FlaggedContent(makeProps()).contentTitle).toBe('Produit suspect');
    });

    it('should return contentDescription when defined', () => {
      expect(new FlaggedContent(makeProps()).contentDescription).toBe('Description du produit');
    });

    it('should return undefined for contentDescription when absent', () => {
      const { contentDescription: _d, ...rest } = makeProps();
      expect(new FlaggedContent(rest).contentDescription).toBeUndefined();
    });

    it('should return contentImageUrl when defined', () => {
      expect(new FlaggedContent(makeProps()).contentImageUrl).toBe('https://example.com/image.jpg');
    });

    it('should return undefined for contentImageUrl when absent', () => {
      const { contentImageUrl: _u, ...rest } = makeProps();
      expect(new FlaggedContent(rest).contentImageUrl).toBeUndefined();
    });

    it('should return creatorId', () => {
      expect(new FlaggedContent(makeProps()).creatorId).toBe('user-1');
    });

    it('should return creatorName', () => {
      expect(new FlaggedContent(makeProps()).creatorName).toBe('Bob Martin');
    });

    it('should return creatorEmail', () => {
      expect(new FlaggedContent(makeProps()).creatorEmail).toBe('bob@example.com');
    });

    it('should return flaggedBy', () => {
      expect(new FlaggedContent(makeProps()).flaggedBy).toBe('user-2');
    });

    it('should return flagReason', () => {
      expect(new FlaggedContent(makeProps()).flagReason).toBe('INAPPROPRIATE_CONTENT');
    });

    it('should return flagDetails when defined', () => {
      expect(new FlaggedContent(makeProps()).flagDetails).toBe('Contenu offensant');
    });

    it('should return undefined for flagDetails when absent', () => {
      const { flagDetails: _f, ...rest } = makeProps();
      expect(new FlaggedContent(rest).flagDetails).toBeUndefined();
    });

    it('should return status', () => {
      expect(new FlaggedContent(makeProps()).status).toBe('PENDING');
    });

    it('should return moderatorId when defined', () => {
      expect(new FlaggedContent(makeProps()).moderatorId).toBe('mod-1');
    });

    it('should return undefined for moderatorId when absent', () => {
      const { moderatorId: _mi, ...rest } = makeProps();
      expect(new FlaggedContent(rest).moderatorId).toBeUndefined();
    });

    it('should return moderatorNote when defined', () => {
      expect(new FlaggedContent(makeProps()).moderatorNote).toBe('En cours de vérification');
    });

    it('should return undefined for moderatorNote when absent', () => {
      const { moderatorNote: _mn, ...rest } = makeProps();
      expect(new FlaggedContent(rest).moderatorNote).toBeUndefined();
    });

    it('should return flaggedAt', () => {
      expect(new FlaggedContent(makeProps()).flaggedAt).toEqual(new Date('2024-01-10T08:00:00Z'));
    });

    it('should return moderatedAt when defined', () => {
      expect(new FlaggedContent(makeProps()).moderatedAt).toEqual(new Date('2024-01-11T09:00:00Z'));
    });

    it('should return undefined for moderatedAt when absent', () => {
      const { moderatedAt: _ma, ...rest } = makeProps();
      expect(new FlaggedContent(rest).moderatedAt).toBeUndefined();
    });
  });

  describe('isPending', () => {
    it('should return true when status is PENDING', () => {
      expect(new FlaggedContent({ ...makeProps(), status: 'PENDING' }).isPending()).toBe(true);
    });

    it('should return false when status is APPROVED', () => {
      expect(new FlaggedContent({ ...makeProps(), status: 'APPROVED' }).isPending()).toBe(false);
    });

    it('should return false when status is HIDDEN', () => {
      expect(new FlaggedContent({ ...makeProps(), status: 'HIDDEN' }).isPending()).toBe(false);
    });

    it('should return false when status is DELETED', () => {
      expect(new FlaggedContent({ ...makeProps(), status: 'DELETED' }).isPending()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return a plain object with all props', () => {
      const props = makeProps();
      expect(new FlaggedContent(props).toJSON()).toEqual(props);
    });

    it('should return a copy of props, not the original reference', () => {
      const props = makeProps();
      expect(new FlaggedContent(props).toJSON()).not.toBe(props);
    });
  });
});
