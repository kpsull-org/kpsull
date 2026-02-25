import { describe, it, expect } from 'vitest';
import { ModerationAction, type ModerationActionProps } from '../moderation-action.entity';

describe('ModerationAction', () => {
  const makeProps = (): ModerationActionProps => ({
    id: 'action-1',
    flaggedContentId: 'content-1',
    contentTitle: 'Produit test',
    contentType: 'PRODUCT',
    action: 'APPROVE',
    moderatorId: 'mod-1',
    moderatorName: 'Alice Dupont',
    moderatorEmail: 'alice@example.com',
    note: 'Contenu conforme',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  });

  describe('constructor', () => {
    it('should create a ModerationAction with all props', () => {
      const action = new ModerationAction(makeProps());
      expect(action).toBeInstanceOf(ModerationAction);
    });

    it('should create a ModerationAction without optional note', () => {
      const { note: _note, ...propsWithoutNote } = makeProps();
      const action = new ModerationAction(propsWithoutNote);
      expect(action).toBeInstanceOf(ModerationAction);
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      expect(new ModerationAction(makeProps()).id).toBe('action-1');
    });

    it('should return flaggedContentId', () => {
      expect(new ModerationAction(makeProps()).flaggedContentId).toBe('content-1');
    });

    it('should return contentTitle', () => {
      expect(new ModerationAction(makeProps()).contentTitle).toBe('Produit test');
    });

    it('should return contentType PRODUCT', () => {
      expect(new ModerationAction(makeProps()).contentType).toBe('PRODUCT');
    });

    it('should return contentType REVIEW', () => {
      expect(new ModerationAction({ ...makeProps(), contentType: 'REVIEW' }).contentType).toBe('REVIEW');
    });

    it('should return contentType PAGE', () => {
      expect(new ModerationAction({ ...makeProps(), contentType: 'PAGE' }).contentType).toBe('PAGE');
    });

    it('should return action APPROVE', () => {
      expect(new ModerationAction(makeProps()).action).toBe('APPROVE');
    });

    it('should return action HIDE', () => {
      expect(new ModerationAction({ ...makeProps(), action: 'HIDE' }).action).toBe('HIDE');
    });

    it('should return action DELETE', () => {
      expect(new ModerationAction({ ...makeProps(), action: 'DELETE' }).action).toBe('DELETE');
    });

    it('should return moderatorId', () => {
      expect(new ModerationAction(makeProps()).moderatorId).toBe('mod-1');
    });

    it('should return moderatorName', () => {
      expect(new ModerationAction(makeProps()).moderatorName).toBe('Alice Dupont');
    });

    it('should return moderatorEmail', () => {
      expect(new ModerationAction(makeProps()).moderatorEmail).toBe('alice@example.com');
    });

    it('should return note when defined', () => {
      expect(new ModerationAction(makeProps()).note).toBe('Contenu conforme');
    });

    it('should return undefined for note when not provided', () => {
      const { note: _note, ...propsWithoutNote } = makeProps();
      expect(new ModerationAction(propsWithoutNote).note).toBeUndefined();
    });

    it('should return createdAt', () => {
      expect(new ModerationAction(makeProps()).createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });
  });

  describe('toJSON', () => {
    it('should return a plain object with all props', () => {
      const props = makeProps();
      expect(new ModerationAction(props).toJSON()).toEqual(props);
    });

    it('should return a copy of props, not the original reference', () => {
      const props = makeProps();
      expect(new ModerationAction(props).toJSON()).not.toBe(props);
    });
  });
});
