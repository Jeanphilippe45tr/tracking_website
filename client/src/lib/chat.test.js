// Tests for chat utility functions
import { describe, it, expect } from 'vitest';
import {
  conversationForVisitor,
  sortConversations,
  unreadForAdmin,
  unreadInConversation,
  unreadForCustomer,
  lastMessage,
  uid,
} from '../lib/chat';

describe('chat utilities', () => {
  const mockConversations = [
    {
      id: 'conv-1',
      visitorId: 'visitor-1',
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'Test',
      createdAt: '2026-10-23T10:00:00.000Z',
      updatedAt: '2026-10-23T11:00:00.000Z',
      messages: [
        { id: 'msg-1', from: 'customer', text: 'Hello', at: '2026-10-23T10:00:00.000Z', readByAdmin: true, readByCustomer: true },
        { id: 'msg-2', from: 'admin', text: 'Hi there', at: '2026-10-23T10:30:00.000Z', readByAdmin: true, readByCustomer: false },
        { id: 'msg-3', from: 'customer', text: 'Thanks', at: '2026-10-23T11:00:00.000Z', readByAdmin: false, readByCustomer: true },
      ],
    },
    {
      id: 'conv-2',
      visitorId: 'visitor-2',
      name: 'Bob',
      email: 'bob@example.com',
      subject: 'Question',
      createdAt: '2026-10-23T09:00:00.000Z',
      updatedAt: '2026-10-23T09:30:00.000Z',
      messages: [
        { id: 'msg-4', from: 'customer', text: 'Help', at: '2026-10-23T09:00:00.000Z', readByAdmin: false, readByCustomer: true },
      ],
    },
  ];

  describe('conversationForVisitor', () => {
    it('finds conversation by visitorId', () => {
      const state = { conversations: mockConversations };
      const result = conversationForVisitor(state, 'visitor-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('conv-1');
    });

    it('returns null for unknown visitorId', () => {
      const state = { conversations: mockConversations };
      const result = conversationForVisitor(state, 'unknown');
      expect(result).toBeNull();
    });
  });

  describe('sortConversations', () => {
    it('sorts by updatedAt descending', () => {
      const sorted = sortConversations(mockConversations);
      expect(sorted[0].id).toBe('conv-1'); // Later updatedAt
      expect(sorted[1].id).toBe('conv-2');
    });

    it('does not mutate original array', () => {
      const original = [...mockConversations];
      sortConversations(mockConversations);
      expect(mockConversations).toEqual(original);
    });
  });

  describe('unreadForAdmin', () => {
    it('counts unread customer messages across all conversations', () => {
      const state = { conversations: mockConversations };
      // conv-1 has 1 unread (msg-3), conv-2 has 1 unread (msg-4)
      expect(unreadForAdmin(state)).toBe(2);
    });

    it('returns 0 for empty conversations', () => {
      expect(unreadForAdmin({ conversations: [] })).toBe(0);
    });
  });

  describe('unreadInConversation', () => {
    it('counts unread customer messages in a conversation', () => {
      const conv = mockConversations[0];
      // msg-3 is unread by admin
      expect(unreadInConversation(conv)).toBe(1);
    });

    it('returns 0 for null conversation', () => {
      expect(unreadInConversation(null)).toBe(0);
    });
  });

  describe('unreadForCustomer', () => {
    it('counts unread admin messages for a visitor', () => {
      const state = { conversations: mockConversations };
      // conv-1 has 1 unread admin message (msg-2)
      expect(unreadForCustomer(state, 'visitor-1')).toBe(1);
    });

    it('returns 0 for unknown visitor', () => {
      const state = { conversations: mockConversations };
      expect(unreadForCustomer(state, 'unknown')).toBe(0);
    });
  });

  describe('lastMessage', () => {
    it('returns the last message in conversation', () => {
      const msg = lastMessage(mockConversations[0]);
      expect(msg).toBeDefined();
      expect(msg?.id).toBe('msg-3');
    });

    it('returns null for empty conversation', () => {
      expect(lastMessage({ messages: [] })).toBeNull();
      expect(lastMessage(null)).toBeNull();
    });
  });

  describe('uid', () => {
    it('generates unique IDs with prefix', () => {
      const id1 = uid('test');
      const id2 = uid('test');
      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });

    it('uses default prefix "m"', () => {
      const id = uid();
      expect(id).toMatch(/^m-/);
    });
  });
});