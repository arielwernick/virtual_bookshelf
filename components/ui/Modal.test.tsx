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
});
