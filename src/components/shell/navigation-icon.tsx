import type { NavigationIcon as NavigationIconName } from "@/lib/shell/navigation";

const paths: Record<NavigationIconName, React.ReactNode> = {
  home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.2V20h13v-9.8M9.5 20v-6h5v6" /></>,
  progress: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  training: <><path d="M5 18.5 9 14l3 2.5 6-8" /><circle cx="18" cy="8.5" r="2.5" /></>,
  learning: <><path d="M4 5.5h6a3 3 0 0 1 3 3V20a3 3 0 0 0-3-3H4z" /><path d="M20 5.5h-4a3 3 0 0 0-3 3V20a3 3 0 0 1 3-3h4z" /></>,
  lineup: <><rect x="3.5" y="4" width="17" height="16" rx="1" /><path d="M12 4v16M3.5 12h17" /><circle cx="12" cy="12" r="2.5" /></>,
  achievements: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8M9 17h6" /></>,
  wallet: <><path d="M4 7.5h14a2 2 0 0 1 2 2V18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5V10.5l-2-.6-.7-1.7 1-1.8-2.1-2.1-1.8 1-1.7-.7L11.1 3H8.9l-.6 1.6-1.7.7-1.8-1-2.1 2.1 1 1.8L3 9.9l-2 .6v3l2 .6.7 1.7-1 1.8 2.1 2.1 1.8-1 1.7.7.6 1.6h3l.6-1.6 1.7-.7 1.8 1 2.1-2.1-1-1.8.7-1.7z" /></>,
  players: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0M14 15.5a5 5 0 0 1 7 4.5" /></>,
  evaluations: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h4M9 12h7M9 16h5" /></>,
  attendance: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 15l2 2 5-5" /></>,
  reports: <><path d="M4 20V4h16v16zM8 16v-3M12 16V8M16 16v-5" /></>,
  payments: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 9h19M6 15h4" /></>,
  impact: <><path d="M12 21c5-3 8-7 8-12-5 0-8 2-8 6" /><path d="M12 21C7 18 4 14 4 9c5 0 8 2 8 6v6Z" /></>,
  messages: <><path d="M4 5h16v12H8l-4 3z" /><path d="M8 9h8M8 13h5" /></>,
  clubs: <><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  users: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="8" r="3" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0M12.5 20a4.5 4.5 0 0 1 9 0" /></>,
  content: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  audit: <><path d="M12 3 4 6v6c0 4.5 3 7.5 8 9 5-1.5 8-4.5 8-9V6z" /><path d="M9 12h6M12 9v6" /></>,
  organizations: <><path d="M3 21V8l9-5 9 5v13M8 21v-5h8v5M7 10h2M11 10h2M15 10h2" /></>,
  permissions: <><circle cx="9" cy="12" r="4" /><path d="M13 12h9M18 12v3M21 12v2" /></>,
  catalogs: <><path d="M4 5h16v14H4zM4 10h16M10 5v14" /></>,
  integrations: <><path d="M8 12h8M12 8v8" /><path d="M7 4H4v3M17 4h3v3M7 20H4v-3M17 20h3v-3" /></>,
  system: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 22h8M12 18v4M7 10l2 2 3-4 2 4 3-2" /></>,
};

export function NavigationIcon({ name }: { name: NavigationIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
