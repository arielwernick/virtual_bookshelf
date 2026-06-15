import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityShowcase } from './CapabilityShowcase';
import { CAPABILITY_TILES } from '@/lib/constants/landingShowcase';

describe('CapabilityShowcase', () => {
  describe('Rendering', () => {
    it('renders the section heading', () => {
      render(<CapabilityShowcase />);
      expect(screen.getByRole('heading', { name: 'Shelve anything' })).toBeInTheDocument();
    });

    it('renders a tile for every media type', () => {
      render(<CapabilityShowcase />);
      for (const tile of CAPABILITY_TILES) {
        expect(screen.getByRole('heading', { name: tile.label })).toBeInTheDocument();
      }
    });

    it('shows the tagline for each standard capability', () => {
      render(<CapabilityShowcase />);
      // The live (stock) tagline is augmented with extra copy in the banner and
      // is asserted separately below.
      for (const tile of CAPABILITY_TILES.filter((t) => !t.live)) {
        expect(screen.getByText(tile.tagline)).toBeInTheDocument();
      }
    });
  });

  describe('Live stock banner', () => {
    it('spotlights the stock capability with a Live pill', () => {
      render(<CapabilityShowcase />);
      expect(screen.getByRole('heading', { name: 'Stocks' })).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('describes the live chart and headlines', () => {
      render(<CapabilityShowcase />);
      expect(screen.getByText(/candlestick chart/i)).toBeInTheDocument();
    });
  });
});
