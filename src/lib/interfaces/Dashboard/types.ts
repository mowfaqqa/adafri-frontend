// Types
export interface Feature {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

export interface Tab {
  id: string;
  label: string;
  features: Feature[];
}

export interface FeatureCarouselProps {
  tabs: Tab[];
  className?: string;
}