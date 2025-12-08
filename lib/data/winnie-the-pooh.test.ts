import { describe, it, expect } from 'vitest';
import { BOOK_METADATA, SYSTEM_PROMPT, BOOK_CONTEXT, INTRODUCTION } from './winnie-the-pooh';

describe('Winnie-the-Pooh Book Data', () => {
  describe('BOOK_METADATA', () => {
    it('should have correct title', () => {
      expect(BOOK_METADATA.title).toBe('Winnie-the-Pooh');
    });

    it('should have correct author', () => {
      expect(BOOK_METADATA.author).toBe('A.A. Milne');
    });

    it('should have correct year', () => {
      expect(BOOK_METADATA.year).toBe(1926);
    });

    it('should have cover image URL', () => {
      expect(BOOK_METADATA.coverImage).toContain('gutenberg.org');
    });

    it('should have gutenberg URL', () => {
      expect(BOOK_METADATA.gutenbergUrl).toContain('gutenberg.org');
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(SYSTEM_PROMPT).toBeTruthy();
      expect(typeof SYSTEM_PROMPT).toBe('string');
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('should mention key characters', () => {
      expect(SYSTEM_PROMPT).toContain('Pooh');
      expect(SYSTEM_PROMPT).toContain('Piglet');
      expect(SYSTEM_PROMPT).toContain('Eeyore');
      expect(SYSTEM_PROMPT).toContain('Christopher Robin');
    });

    it('should instruct to speak as the book', () => {
      expect(SYSTEM_PROMPT).toContain('book');
      expect(SYSTEM_PROMPT).toContain('A.A. Milne');
    });
  });

  describe('BOOK_CONTEXT', () => {
    it('should be a non-empty string', () => {
      expect(BOOK_CONTEXT).toBeTruthy();
      expect(typeof BOOK_CONTEXT).toBe('string');
      expect(BOOK_CONTEXT.length).toBeGreaterThan(500);
    });

    it('should include main characters section', () => {
      expect(BOOK_CONTEXT).toContain('MAIN CHARACTERS');
      expect(BOOK_CONTEXT).toContain('Winnie-the-Pooh');
      expect(BOOK_CONTEXT).toContain('Piglet');
      expect(BOOK_CONTEXT).toContain('Eeyore');
      expect(BOOK_CONTEXT).toContain('Tigger');
      expect(BOOK_CONTEXT).toContain('Rabbit');
      expect(BOOK_CONTEXT).toContain('Owl');
      expect(BOOK_CONTEXT).toContain('Kanga');
      expect(BOOK_CONTEXT).toContain('Roo');
    });

    it('should include themes section', () => {
      expect(BOOK_CONTEXT).toContain('THEMES');
      expect(BOOK_CONTEXT).toContain('friendship');
      expect(BOOK_CONTEXT).toContain('kindness');
    });

    it('should include memorable quotes', () => {
      expect(BOOK_CONTEXT).toContain('MEMORABLE QUOTES');
      expect(BOOK_CONTEXT).toContain('braver than you believe');
    });

    it('should mention Hundred Acre Wood', () => {
      expect(BOOK_CONTEXT).toContain('Hundred Acre Wood');
    });
  });

  describe('INTRODUCTION', () => {
    it('should be a non-empty string', () => {
      expect(INTRODUCTION).toBeTruthy();
      expect(typeof INTRODUCTION).toBe('string');
      expect(INTRODUCTION.length).toBeGreaterThan(50);
    });

    it('should introduce the book', () => {
      expect(INTRODUCTION).toContain('Winnie-the-Pooh');
      expect(INTRODUCTION).toContain('A.A. Milne');
      expect(INTRODUCTION).toContain('1926');
    });

    it('should be friendly and inviting', () => {
      expect(INTRODUCTION).toContain('Hello');
      expect(INTRODUCTION).toContain('Ask me');
    });
  });
});
