import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  describe('Visibility', () => {
    it('renders children when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      );

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      );

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('has role="dialog" and aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when clicking backdrop', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      // Click the backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking close button', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      // Find close button by its SVG content
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when pressing Escape key', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when clicking modal content', () => {
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );

      fireEvent.click(screen.getByTestId('modal-content'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });

    it('cleans up scroll lock on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Focus Trap', () => {
    it('focuses first focusable element when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      // Close button is the first focusable element
      expect(screen.getByLabelText('Close modal')).toHaveFocus();
    });

    it('traps focus on Tab at last element', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      // Focus on second button (last focusable element)
      screen.getByText('Second').focus();
      expect(screen.getByText('Second')).toHaveFocus();

      // Press Tab - should wrap to first button (close button)
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByLabelText('Close modal')).toHaveFocus();
    });

    it('traps focus on Shift+Tab at first element', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      // Close button is focused by default
      expect(screen.getByLabelText('Close modal')).toHaveFocus();

      // Press Shift+Tab - should wrap to last focusable element (Second)
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      expect(screen.getByText('Second')).toHaveFocus();
    });

    it('restores focus to previous element when modal closes', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>Modal Button</button>
        </Modal>
      );

      // Close button should be focused (first focusable element)
      expect(screen.getByLabelText('Close modal')).toHaveFocus();

      // Close modal
      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          <button>Modal Button</button>
        </Modal>
      );

      // Focus should return to trigger button
      expect(triggerButton).toHaveFocus();

      // Cleanup
      document.body.removeChild(triggerButton);
    });

    it('includes close button in focus trap', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('allows keyboard navigation through all focusable elements', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>Button 1</button>
          <button>Button 2</button>
          <input type="text" placeholder="Input field" />
        </Modal>
      );

      // All elements should be focusable
      const closeButton = screen.getByLabelText('Close modal');
      const button1 = screen.getByText('Button 1');
      const button2 = screen.getByText('Button 2');
      const input = screen.getByPlaceholderText('Input field');

      // Verify all elements can be focused
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      button1.focus();
      expect(button1).toHaveFocus();

      button2.focus();
      expect(button2).toHaveFocus();

      input.focus();
      expect(input).toHaveFocus();
    });
  });
});
