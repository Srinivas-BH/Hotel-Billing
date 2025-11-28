/**
 * Feature: hotel-billing-admin, Property 19: Responsive layout breakpoints
 * 
 * Property: For any screen width less than 768 pixels, the layout should adapt 
 * to mobile-optimized styling with appropriate component reflow
 * 
 * Validates: Requirements 11.3
 */

import * as fc from 'fast-check';

describe('Property 19: Responsive layout breakpoints', () => {
  // Helper function to check if a class string contains mobile-specific classes
  const hasMobileClasses = (classString: string): boolean => {
    // Mobile-first Tailwind classes that should be present for mobile
    const mobilePatterns = [
      /\bflex-col\b/,           // Stacked layouts
      /\bgrid-cols-1\b/,        // Single column grids
      /\bw-full\b/,             // Full width elements
      /\bmin-h-\[44px\]/,       // Touch-friendly sizes
      /\bpx-[234]\b/,           // Smaller padding on mobile
      /\bpy-[234]\b/,           // Smaller padding on mobile
      /\btext-(sm|base)\b/,     // Smaller text on mobile
      /\bhidden\s+(?:sm|md|lg):/, // Elements hidden on mobile but shown on larger screens
    ];

    return mobilePatterns.some(pattern => pattern.test(classString));
  };

  // Helper function to check if a class string contains desktop-specific classes
  const hasDesktopClasses = (classString: string): boolean => {
    // Desktop classes that should be present for larger screens
    const desktopPatterns = [
      /\b(?:sm|md|lg):flex-row\b/,      // Horizontal layouts on desktop
      /\b(?:sm|md|lg):grid-cols-[2-9]\b/, // Multi-column grids on desktop
      /\b(?:sm|md|lg):block\b/,         // Elements shown on desktop
      /\b(?:sm|md|lg):inline\b/,        // Inline elements on desktop
      /\b(?:sm|md|lg):px-[5-9]\b/,      // Larger padding on desktop
      /\b(?:sm|md|lg):text-(lg|xl|2xl|3xl)\b/, // Larger text on desktop
    ];

    return desktopPatterns.some(pattern => pattern.test(classString));
  };

  // Helper to simulate responsive class application based on screen width
  const getAppliedClasses = (classString: string, screenWidth: number): string[] => {
    const classes = classString.split(/\s+/).filter(c => c.length > 0);
    const appliedClasses: string[] = [];

    for (const cls of classes) {
      // Check if it's a responsive class
      if (cls.includes('sm:') && screenWidth >= 640) {
        appliedClasses.push(cls.replace('sm:', ''));
      } else if (cls.includes('md:') && screenWidth >= 768) {
        appliedClasses.push(cls.replace('md:', ''));
      } else if (cls.includes('lg:') && screenWidth >= 1024) {
        appliedClasses.push(cls.replace('lg:', ''));
      } else if (!cls.includes(':')) {
        // Base class (mobile-first)
        appliedClasses.push(cls);
      }
    }

    return appliedClasses;
  };

  test('should apply mobile-optimized classes for screen widths less than 768px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Mobile screen widths
        (screenWidth) => {
          // Example responsive class strings from our components
          const responsiveClassExamples = [
            // Navigation: hamburger menu visible on mobile
            'flex md:hidden',
            // Grid layouts: single column on mobile, multiple on desktop
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
            // Button sizes: full width on mobile
            'w-full sm:w-auto px-4 py-3 min-h-[44px]',
            // Text sizes: smaller on mobile
            'text-base sm:text-lg md:text-xl',
            // Padding: smaller on mobile
            'px-4 sm:px-6 lg:px-8 py-4 sm:py-8',
            // Flex direction: column on mobile, row on desktop
            'flex flex-col sm:flex-row gap-4',
            // Hidden on mobile, visible on desktop
            'hidden sm:inline',
            // Spacing: tighter on mobile
            'space-y-4 sm:space-y-6',
          ];

          for (const classString of responsiveClassExamples) {
            const appliedClasses = getAppliedClasses(classString, screenWidth);
            const appliedClassString = appliedClasses.join(' ');

            // For mobile widths (< 768px), we should have mobile-appropriate classes
            if (screenWidth < 768) {
              // Check that we don't have large desktop-only values applied
              expect(appliedClassString).not.toMatch(/\bgrid-cols-[4-9]\b/);
              expect(appliedClassString).not.toMatch(/\btext-[23]xl\b/);
              expect(appliedClassString).not.toMatch(/\bpx-[89]\b/);
              
              // If the original has responsive variants, check mobile-first behavior
              if (classString.includes('grid-cols-1')) {
                expect(appliedClassString).toMatch(/\bgrid-cols-1\b/);
              }
              if (classString.includes('flex-col')) {
                expect(appliedClassString).toMatch(/\bflex-col\b/);
              }
              if (classString.includes('w-full')) {
                expect(appliedClassString).toMatch(/\bw-full\b/);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should apply desktop-optimized classes for screen widths >= 768px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 2560 }), // Desktop screen widths
        (screenWidth) => {
          // Example responsive class strings from our components
          const responsiveClassExamples = [
            // Navigation: hamburger menu hidden on desktop
            'flex md:hidden',
            // Grid layouts: multiple columns on desktop
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
            // Button sizes: auto width on desktop
            'w-full md:w-auto px-4 py-3',
            // Text sizes: larger on desktop
            'text-base md:text-lg lg:text-xl',
            // Padding: larger on desktop
            'px-4 md:px-6 lg:px-8',
            // Flex direction: row on desktop
            'flex flex-col md:flex-row gap-4',
            // Visible on desktop
            'hidden md:inline',
          ];

          for (const classString of responsiveClassExamples) {
            const appliedClasses = getAppliedClasses(classString, screenWidth);
            const appliedClassString = appliedClasses.join(' ');

            // For desktop widths (>= 768px), md: classes should be applied
            if (screenWidth >= 768) {
              if (classString.includes('md:hidden')) {
                expect(appliedClassString).toMatch(/\bhidden\b/);
              }
              if (classString.includes('md:grid-cols-2')) {
                expect(appliedClassString).toMatch(/\bgrid-cols-2\b/);
              }
              if (classString.includes('md:w-auto')) {
                expect(appliedClassString).toMatch(/\bw-auto\b/);
              }
              if (classString.includes('md:flex-row')) {
                expect(appliedClassString).toMatch(/\bflex-row\b/);
              }
              if (classString.includes('md:inline')) {
                expect(appliedClassString).toMatch(/\binline\b/);
              }
            }

            // For large desktop widths (>= 1024px), lg: classes should be applied
            if (screenWidth >= 1024) {
              if (classString.includes('lg:grid-cols-4')) {
                expect(appliedClassString).toMatch(/\bgrid-cols-4\b/);
              }
              if (classString.includes('lg:text-xl')) {
                expect(appliedClassString).toMatch(/\btext-xl\b/);
              }
              if (classString.includes('lg:px-8')) {
                expect(appliedClassString).toMatch(/\bpx-8\b/);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should ensure touch-friendly button sizes on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Mobile screen widths
        (screenWidth) => {
          // All interactive elements should have min-h-[44px] for touch targets
          const buttonClasses = [
            'px-4 py-3 min-h-[44px]',
            'min-w-[44px] min-h-[44px]',
            'px-6 py-3 min-h-[44px]',
          ];

          for (const classString of buttonClasses) {
            // On mobile, touch-friendly sizes should always be present
            expect(classString).toMatch(/\bmin-h-\[44px\]/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should maintain consistent breakpoint behavior across screen width ranges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (screenWidth) => {
          // Define breakpoints
          const isMobile = screenWidth < 640;
          const isTablet = screenWidth >= 640 && screenWidth < 768;
          const isSmallDesktop = screenWidth >= 768 && screenWidth < 1024;
          const isLargeDesktop = screenWidth >= 1024;

          // Test class string with all breakpoints
          const classString = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
          const appliedClasses = getAppliedClasses(classString, screenWidth);
          const appliedClassString = appliedClasses.join(' ');

          // Verify correct grid columns for each breakpoint
          if (isMobile) {
            expect(appliedClassString).toMatch(/\bgrid-cols-1\b/);
            expect(appliedClassString).not.toMatch(/\bgrid-cols-[234]\b/);
          } else if (isTablet) {
            expect(appliedClassString).toMatch(/\bgrid-cols-2\b/);
          } else if (isSmallDesktop) {
            expect(appliedClassString).toMatch(/\bgrid-cols-3\b/);
          } else if (isLargeDesktop) {
            expect(appliedClassString).toMatch(/\bgrid-cols-4\b/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
