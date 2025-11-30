import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses the toast hook
function TestComponent({ 
  message = 'Test message', 
  variant = 'info' as const,
  icon,
}: { 
  message?: string; 
  variant?: 'success' | 'error' | 'info';
  icon?: string;
}) {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(message, variant, icon)}>
      Show Toast
    </button>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div>Test Content</div>
        </ToastProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('provides toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Should not throw
      expect(screen.getByRole('button', { name: 'Show Toast' })).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    it('throws error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');
      
      consoleError.mockRestore();
    });
  });

  describe('Toast Notifications', () => {
    it('shows toast when showToast is called', async () => {
      render(
        <ToastProvider>
          <TestComponent message="Hello World" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      // Wait for animation
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders toast with correct role', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('auto-dismisses after ~3.5 seconds', async () => {
      render(
        <ToastProvider>
          <TestComponent message="Auto dismiss" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });
      
      expect(screen.getByText('Auto dismiss')).toBeInTheDocument();

      // Advance past auto-dismiss time (3500ms) + exit animation (300ms)
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.queryByText('Auto dismiss')).not.toBeInTheDocument();
    });

    it('can be manually dismissed', async () => {
      render(
        <ToastProvider>
          <TestComponent message="Dismiss me" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const dismissButton = screen.getByRole('button', { name: 'Dismiss notification' });
      fireEvent.click(dismissButton);

      // Wait for exit animation
      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
    });

    it('can show multiple toasts', async () => {
      const MultiToastComponent = () => {
        const { showToast } = useToast();
        return (
          <>
            <button onClick={() => showToast('Toast 1')}>Show 1</button>
            <button onClick={() => showToast('Toast 2')}>Show 2</button>
          </>
        );
      };

      render(
        <ToastProvider>
          <MultiToastComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show 2' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });
  });

  describe('Toast Variants', () => {
    it('renders success variant with green styling', async () => {
      render(
        <ToastProvider>
          <TestComponent variant="success" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const toast = screen.getByTestId('toast-notification');
      expect(toast.className).toContain('bg-green-50');
      expect(toast.className).toContain('border-green-200');
      expect(toast.className).toContain('text-green-800');
    });

    it('renders error variant with red styling', async () => {
      render(
        <ToastProvider>
          <TestComponent variant="error" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const toast = screen.getByTestId('toast-notification');
      expect(toast.className).toContain('bg-red-50');
      expect(toast.className).toContain('border-red-200');
      expect(toast.className).toContain('text-red-800');
    });

    it('renders info variant with blue styling', async () => {
      render(
        <ToastProvider>
          <TestComponent variant="info" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      const toast = screen.getByTestId('toast-notification');
      expect(toast.className).toContain('bg-blue-50');
      expect(toast.className).toContain('border-blue-200');
      expect(toast.className).toContain('text-blue-800');
    });
  });

  describe('Custom Icons', () => {
    it('renders custom emoji icon when provided', async () => {
      render(
        <ToastProvider>
          <TestComponent icon="🎉" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('renders default icon when custom icon not provided', async () => {
      render(
        <ToastProvider>
          <TestComponent variant="success" />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Check for SVG icon
      const toast = screen.getByTestId('toast-notification');
      const svg = toast.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live="polite" on container', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const container = document.querySelector('[aria-live="polite"]');
      expect(container).toBeInTheDocument();
    });

    it('has aria-atomic="true" on container', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const container = document.querySelector('[aria-atomic="true"]');
      expect(container).toBeInTheDocument();
    });

    it('dismiss button has accessible label', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
    });
  });
});
