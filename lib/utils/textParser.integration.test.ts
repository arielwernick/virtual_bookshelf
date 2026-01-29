import { describe, it, expect } from 'vitest';
import { parseTextWithContext, extractUrls } from './textParser';
import { isShortUrl, extractLinkedInRedirectUrl, needsResolution } from './urlResolver';

/**
 * Integration tests using a real LinkedIn post with engineering blogs
 * This tests the full parsing pipeline with realistic data
 */

const LINKEDIN_ENGINEERING_BLOGS_POST = `1 → THE CODE
Scale at global level.
Teaches you how to code with AI and AI Agents
https://lnkd.in/dcibJhzQ

2 → Airbnb Tech Blog
Product engineering done right.
User focused systems.
https://airbnb.tech/blog/

3 → Meta Engineering
Billions of users infrastructure.
Performance at extreme scale.
https://engineering.fb.com

4 → AWS Architecture
Cloud design patterns revealed.
Production ready blueprints.
https://lnkd.in/gqjh88PS

5 → Netflix TechBlog
Streaming at massive scale.
Chaos engineering explained.
https://lnkd.in/gNE8Cs6Z

6 → Discord Engineering
Real time systems mastery.
Handling millions of connections.
https://lnkd.in/gea6kSwt

7 → Google Research
Cutting edge tech breakthroughs.
Tomorrow's solutions today.
https://lnkd.in/gjzDu8wp

8 → NVIDIA Developer
GPU powered computing insights.
AI infrastructure secrets.
https://lnkd.in/dt_BW7qF

9 → Slack Engineering
Collaboration platform internals.
Distributed systems at scale.
https://slack.engineering

10 → Cloudflare Blog
Internet infrastructure deep dives.
Security and performance wins.
https://lnkd.in/gqa-HE6h

11 → Figma Tech Blog
Collaborative design systems.
Browser performance magic.
https://lnkd.in/g2KF_eX9

12 → Shopify Engineering
E-commerce at scale.
Black Friday traffic handled.
https://lnkd.in/g7DVzRAc

13 → Stripe Engineering
Payment systems that work.
Financial infrastructure explained.
https://lnkd.in/gfMr-jEr

14 → Microsoft Engineering
Enterprise scale solutions.
Developer tools insights.
https://lnkd.in/g3Mi8XES

15 → GitHub Engineering
Code collaboration at scale.
Developer platform secrets.
https://lnkd.in/gPHaD6AC

16 → Bonus
System design deep dives.
https://lnkd.in/g-tP7eEc

Save this for later.`;

describe('LinkedIn Engineering Blogs Post - Integration Tests', () => {
  describe('URL Extraction', () => {
    it('extracts all 16 URLs from the post', () => {
      const urls = extractUrls(LINKEDIN_ENGINEERING_BLOGS_POST);
      expect(urls).toHaveLength(16);
    });

    it('extracts the correct URLs in order', () => {
      const urls = extractUrls(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Shortened URLs
      expect(urls[0]).toBe('https://lnkd.in/dcibJhzQ'); // THE CODE
      expect(urls[3]).toBe('https://lnkd.in/gqjh88PS'); // AWS Architecture
      expect(urls[4]).toBe('https://lnkd.in/gNE8Cs6Z'); // Netflix TechBlog
      expect(urls[15]).toBe('https://lnkd.in/g-tP7eEc'); // Bonus
      
      // Direct URLs
      expect(urls[1]).toBe('https://airbnb.tech/blog/');
      expect(urls[2]).toBe('https://engineering.fb.com');
      expect(urls[8]).toBe('https://slack.engineering');
    });

    it('identifies lnkd.in URLs as shortened', () => {
      const urls = extractUrls(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Count shortened URLs
      const shortenedUrls = urls.filter(isShortUrl);
      expect(shortenedUrls).toHaveLength(13); // 13 lnkd.in URLs
      
      // Direct URLs should not be identified as shortened
      expect(isShortUrl('https://airbnb.tech/blog/')).toBe(false);
      expect(isShortUrl('https://engineering.fb.com')).toBe(false);
      expect(isShortUrl('https://slack.engineering')).toBe(false);
    });
  });

  describe('Context Parsing', () => {
    it('parses all items with their context', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      expect(result).toHaveLength(16);
    });

    it('captures title from preceding line', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Check specific titles are captured
      const thecode = result.find(i => i.url.includes('dcibJhzQ'));
      expect(thecode?.parsedTitle).toContain('THE CODE');
      
      const airbnb = result.find(i => i.url.includes('airbnb.tech'));
      expect(airbnb?.parsedTitle).toContain('Airbnb Tech Blog');
      
      const meta = result.find(i => i.url.includes('engineering.fb.com'));
      expect(meta?.parsedTitle).toContain('Meta Engineering');
      
      const slack = result.find(i => i.url.includes('slack.engineering'));
      expect(slack?.parsedTitle).toContain('Slack Engineering');
    });

    it('captures description from context', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Check specific descriptions are captured
      const netflix = result.find(i => i.url.includes('gNE8Cs6Z'));
      expect(netflix?.parsedDescription).toMatch(/streaming|chaos|scale/i);
      
      const discord = result.find(i => i.url.includes('gea6kSwt'));
      expect(discord?.parsedDescription).toMatch(/real time|connections|millions/i);
      
      const stripe = result.find(i => i.url.includes('gfMr-jEr'));
      expect(stripe?.parsedDescription).toMatch(/payment|financial/i);
    });

    it('handles numbered list format correctly', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Items should be extracted regardless of numbering
      expect(result.length).toBe(16);
      
      // Titles should not include the number prefix
      const first = result[0];
      expect(first.parsedTitle).not.toMatch(/^1\s*→/);
    });
  });

  describe('URL Resolution Needs', () => {
    it('identifies which URLs need resolution', () => {
      const urls = extractUrls(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // All lnkd.in URLs need resolution
      const needsRes = urls.filter(needsResolution);
      expect(needsRes).toHaveLength(13);
      
      // Direct URLs don't need resolution
      expect(needsResolution('https://airbnb.tech/blog/')).toBe(false);
      expect(needsResolution('https://engineering.fb.com')).toBe(false);
      expect(needsResolution('https://slack.engineering')).toBe(false);
    });
  });

  describe('LinkedIn Redirect URL Handling', () => {
    it('extracts URLs from LinkedIn redirect wrappers', () => {
      // Test the extraction function directly
      const redirectUrl = 'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fnetflixtechblog.com&trk=public_post';
      const extracted = extractLinkedInRedirectUrl(redirectUrl);
      expect(extracted).toBe('https://netflixtechblog.com');
    });

    it('handles safety redirect URLs', () => {
      const safetyUrl = 'https://www.linkedin.com/safety/go?url=https%3A%2F%2Fengineering.shopify.com';
      const extracted = extractLinkedInRedirectUrl(safetyUrl);
      expect(extracted).toBe('https://engineering.shopify.com');
    });

    it('returns null for regular LinkedIn URLs', () => {
      // Regular LinkedIn post URLs should not be treated as redirects
      expect(extractLinkedInRedirectUrl('https://www.linkedin.com/posts/someone-123')).toBeNull();
      expect(extractLinkedInRedirectUrl('https://www.linkedin.com/in/johndoe')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles the "Bonus" item without full description', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      const bonus = result.find(i => i.url.includes('g-tP7eEc'));
      
      expect(bonus).toBeDefined();
      expect(bonus?.parsedTitle).toContain('Bonus');
    });

    it('ignores "Save this for later" text without URL', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // Should not create an item for the footer text
      const saveItem = result.find(i => 
        i.parsedTitle?.toLowerCase().includes('save this')
      );
      expect(saveItem).toBeUndefined();
    });

    it('handles URLs at different line positions', () => {
      const result = parseTextWithContext(LINKEDIN_ENGINEERING_BLOGS_POST);
      
      // All 16 URLs should be captured regardless of position
      expect(result).toHaveLength(16);
      
      // Each item should have a URL
      result.forEach(item => {
        expect(item.url).toMatch(/^https?:\/\//);
      });
    });
  });
});

describe('Expected Resolved URLs', () => {
  /**
   * These are the expected final destinations for the lnkd.in URLs.
   * Note: These may change if the original poster updates their links.
   * This serves as documentation of expected behavior.
   */
  const EXPECTED_DESTINATIONS: Record<string, string> = {
    'https://lnkd.in/dcibJhzQ': 'thecode.media', // THE CODE
    'https://lnkd.in/gqjh88PS': 'aws.amazon.com', // AWS Architecture
    'https://lnkd.in/gNE8Cs6Z': 'netflixtechblog.com', // Netflix TechBlog
    'https://lnkd.in/gea6kSwt': 'discord.com/blog', // Discord Engineering
    'https://lnkd.in/gjzDu8wp': 'research.google', // Google Research
    'https://lnkd.in/dt_BW7qF': 'developer.nvidia.com', // NVIDIA Developer
    'https://lnkd.in/gqa-HE6h': 'blog.cloudflare.com', // Cloudflare Blog
    'https://lnkd.in/g2KF_eX9': 'figma.com', // Figma Tech Blog
    'https://lnkd.in/g7DVzRAc': 'shopify.engineering', // Shopify Engineering
    'https://lnkd.in/gfMr-jEr': 'stripe.com/blog', // Stripe Engineering
    'https://lnkd.in/g3Mi8XES': 'devblogs.microsoft.com', // Microsoft Engineering
    'https://lnkd.in/gPHaD6AC': 'github.blog', // GitHub Engineering
    'https://lnkd.in/g-tP7eEc': 'systemdesign', // Bonus - system design
  };

  it('documents expected destination domains', () => {
    // This test just documents the expected destinations
    // Actual resolution would require network calls
    expect(Object.keys(EXPECTED_DESTINATIONS)).toHaveLength(13);
  });
});
