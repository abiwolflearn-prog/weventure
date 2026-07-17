import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  customItems?: { label: string; path?: string }[];
}

export default function Breadcrumbs({ customItems }: BreadcrumbsProps) {
  const location = useLocation();

  // Route map for human-readable dashboard paths
  const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    workspaces: 'Workspaces',
    bookings: 'My Bookings',
    events: 'Events Catalog',
    settings: 'System Settings',
  };

  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbItems = () => {
    if (customItems) return customItems;

    const items = [];
    let currentPath = '';

    for (let i = 0; i < pathnames.length; i++) {
      const part = pathnames[i];
      currentPath += `/${part}`;
      const label = routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1);
      
      items.push({
        label,
        path: i === pathnames.length - 1 ? undefined : currentPath,
      });
    }

    return items;
  };

  const items = getBreadcrumbItems();

  return (
    <nav className="flex items-center space-x-2 text-xs text-gray-500 py-1.5 overflow-x-auto whitespace-nowrap">
      <Link
        to="/dashboard"
        className="flex items-center space-x-1 hover:text-brand-primary dark:hover:text-brand-primary transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary rounded"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-slate-300 dark:text-neutral-slate-700 shrink-0" />
            {isLast || !item.path ? (
              <span className="font-medium text-gray-800 select-none">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-brand-primary dark:hover:text-brand-primary transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary rounded"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
