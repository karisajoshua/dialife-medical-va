import {
  Activity,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  House,
  Info,
  Layers,
  Menu,
  Search,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
  Zap,
  ChevronDown,
  Download,
  Plus,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
const icons = {
  activity: Activity,
  arrow: ArrowRight,
  up: ArrowUp,
  award: Award,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  building: Building2,
  calendar: CalendarDays,
  chart: ChartNoAxesColumnIncreasing,
  check: CheckCircle2,
  clipboard: ClipboardCheck,
  file: FileText,
  graduation: GraduationCap,
  home: House,
  info: Info,
  layers: Layers,
  menu: Menu,
  search: Search,
  stethoscope: Stethoscope,
  user: UserRound,
  users: UsersRound,
  close: X,
  zap: Zap,
  down: ChevronDown,
  download: Download,
  plus: Plus,
  shield: ShieldCheck,
  external: ExternalLink,
};
export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const Component = icons[name as keyof typeof icons] || FileText;
  return (
    <Component
      className={`d-icon ${className}`}
      aria-hidden="true"
      strokeWidth={1.9}
    />
  );
}
