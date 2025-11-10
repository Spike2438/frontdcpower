"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
  toggleDesktop: () => void; // <— réduit/étend la sidebar (desktop)
  toggleMobile: () => void; // <— ouvre/ferme la sidebar (mobile)
};

const Ctx = createContext<SidebarContextType>({
  isExpanded: false,
  setIsExpanded: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  isHovered: false,
  setIsHovered: () => {},
  toggleDesktop: () => {},
  toggleMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Desktop: menu réduit par défaut
  const [isExpanded, setIsExpanded] = useState(false);
  // Mobile: hors écran par défaut
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleDesktop = useCallback(() => setIsExpanded((v) => !v), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((v) => !v), []);

  const value = useMemo(
    () => ({
      isExpanded,
      setIsExpanded,
      isMobileOpen,
      setIsMobileOpen,
      isHovered,
      setIsHovered,
      toggleDesktop,
      toggleMobile,
    }),
    [isExpanded, isMobileOpen, isHovered, toggleDesktop, toggleMobile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSidebar() {
  return useContext(Ctx);
}
