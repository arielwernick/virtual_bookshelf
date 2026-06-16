import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityShowcase } from './CapabilityShowcase';
import { CAPABILITY_TILES } from '@/lib/constants/landingShowcase';

describe('CapabilityShowcase', () => {
  describe('Rendering', () => {
    it('renders a labeled icon for every media type', () => {
      render(<CapabilityShowcase />);
      for (const tile of CAPABILITY_TILES) {
        expect(screen.getByText(tile.label)).toBeInTheDocument();
      }
    });

    it('exposes each capability description as a hover title', () => {
      render(<CapabilityShowcase />);
      for (const tile of CAPABILITY_TILES) {
        expect(screen.getByTitle(tile.tagline)).toBeInTheDocument();
      }
    });
  });

  describe('Live stock capability', () => {
    it('flags stocks with a Live indicator', () => {
      render(<CapabilityShowcase />);
      expect(screen.getByText('Stocks')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });
});
