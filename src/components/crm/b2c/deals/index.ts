// components/deals/index.ts - Main export file for deals components
export { DealsView } from './DealsView';
export { default as DealsBoard } from './DealsBoard';
export { default as DealColumn } from './DealColumn';
export { default as DealCard } from './DealCard';
export { default as ErrorBoundary } from './ErrorBoundary';

// Re-export types
export * from '@/lib/types/crm/b2c/deals';

// Re-export utilities
// export * from './utils/typeGuards';