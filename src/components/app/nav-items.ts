import type { LucideIcon } from "lucide-react";
import {
  Bell,
  HandHeart,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  MessagesSquare,
  Shield,
  UserRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Which badge counter, if any, this row displays. */
  badge?: "messages" | "notifications" | "connections";
  description?: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Everything at a glance" },
  { href: "/needs", label: "I Need Help", icon: LifeBuoy, description: "Your requests" },
  { href: "/offers", label: "I Want to Help", icon: HandHeart, description: "What you can offer" },
  { href: "/connections", label: "Connections", icon: Link2, badge: "connections", description: "Introductions awaiting you" },
  { href: "/messages", label: "Messages", icon: MessagesSquare, badge: "messages", description: "Your private conversations" },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Team Dashboard",
  icon: Shield,
  description: "WeCanHelpWay team only",
};
