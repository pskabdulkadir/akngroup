import { 
  Crown, Users, DollarSign, Settings, FileText, MessageSquare, 
  TrendingUp, Shield, Bell, Download, Upload, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, Plus, Search, Filter, BarChart3, 
  PieChart, Award, Trophy, Wallet, CreditCard, Ban, RefreshCw, 
  Save, AlertTriangle, Target, Network, Zap, Home, Globe, Image, 
  Layout, Database, Server, Monitor, Activity, Share2, Megaphone, 
  Calendar, TreePine, List, User2, ShoppingCart, Heart, BookOpen, 
  Mail, Phone, Building, Star, Code, Link, Palette, Menu, 
  MoreHorizontal, Power, HardDrive, Cpu, Terminal, Quote, Video, 
  Play, StopCircle, ExternalLink, Moon, MessageCircle, Package, 
  TrendingDown, Copy, X 
} from "lucide-react";

export const vividTheme = {
  gradientBg: "bg-gradient-to-br from-indigo-50/30 via-white to-emerald-50/30",
  cardBg: "bg-white border-slate-200 shadow-xl shadow-slate-200/50",
  headerText: "text-slate-900 font-black tracking-tight",
  buttonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 border border-indigo-500/10",
  sidebarBg: "bg-white border-r border-slate-200 text-slate-900",
  menuActive: "bg-indigo-50/50 text-indigo-700 border-l-4 border-indigo-600 font-bold shadow-sm",
  menuHover: "hover:bg-slate-50 text-slate-600 hover:text-slate-900",
  statCard: "bg-white border border-slate-100 border-l-4 border-indigo-600 shadow-md transition-all duration-300",
  tableHeader: "bg-slate-50/80 text-slate-900 font-bold uppercase text-[10px] tracking-widest",
};

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingPayments: number;
  systemHealth: "healthy" | "warning" | "critical";
  databaseSize: string;
  serverUptime: string;
  apiCalls: number;
}

export interface MenuConfig {
  id: string;
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  order: number;
  permissions: string[];
}

export interface ButtonConfig {
  id: string;
  page: string;
  element: string;
  text: string;
  style: "primary" | "secondary" | "outline" | "destructive";
  visible: boolean;
  enabled: boolean;
  action: string;
}

export interface ContentBlock {
  id: string;
  type: "hero" | "feature" | "testimonial" | "pricing" | "cta" | "text";
  title: string;
  content: string;
  image?: string;
  position: number;
  visible: boolean;
  page: string;
}

export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  primaryColor: string;
  secondaryColor: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  maxCapacity: number;
  autoPlacement: boolean;
  environment: "development" | "staging" | "production";
}
