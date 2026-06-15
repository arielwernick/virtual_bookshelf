import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureHighlights } from './FeatureHighlights';
import { FEATURE_HIGHLIGHTS } from '@/lib/constants/landingShowcase';

describe('FeatureHighlights', () => {
  describe('Rendering', () => {
    it('renders the section heading', () => {
      render(<FeatureHighlights />);
      expect(screen.getByRole('heading', { name: 'More than a list' })).toBeInTheDocument();
    });

    it('renders every highlighted feature with its description', () => {
      render(<FeatureHighlights />);
      for (const feature of FEATURE_HIGHLIGHTS) {
        expect(screen.getByRole('heading', { name: feature.title })).toBeInTheDocument();
        expect(screen.getByText(feature.description)).toBeInTheDocument();
      }
    });
  });
});
