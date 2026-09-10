// Frontend-only types (UI state, component props, etc.)
export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
