import {
  Briefcase,
  Dumbbell,
  GraduationCap,
  Heart,
  Laptop,
  BookOpen,
  Music,
  Palette,
  Home,
  Users,
  Wallet,
  Leaf,
  Brain,
  Code,
  Camera,
  Coffee,
  Plane,
  Dot,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const LIFE_AREA_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  heart: Heart,
  laptop: Laptop,
  book: BookOpen,
  music: Music,
  palette: Palette,
  home: Home,
  users: Users,
  wallet: Wallet,
  leaf: Leaf,
  brain: Brain,
  code: Code,
  camera: Camera,
  coffee: Coffee,
  plane: Plane,
  sparkles: Sparkles,
};

export function LifeAreaIcon({
  icon,
  className,
}: {
  icon?: string | undefined;
  className?: string;
}) {
  const Icon = (icon && LIFE_AREA_ICONS[icon]) || Dot;
  return <Icon className={className} />;
}
