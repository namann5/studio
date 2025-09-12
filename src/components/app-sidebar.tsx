"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  SidebarTrigger,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { Logo } from "./logo";
import { AreaChart, LogOut, MessageSquare, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Mock logout
    router.push("/");
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Logo />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/chat"}
              tooltip="Chat"
            >
              <a href="/chat">
                <MessageSquare />
                <span>Chat</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Dashboard"
            >
              <a href="/dashboard">
                <AreaChart />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group/footer">
        <SidebarSeparator />
        <div className="flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User Avatar" />
                    <AvatarFallback>
                        <User />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">User</span>
                    <span className="text-xs text-muted-foreground">user@email.com</span>
                </div>
            </div>
            <SidebarMenuButton
                variant="ghost"
                className="group-data-[collapsible=icon]:w-8"
                onClick={handleLogout}
                tooltip="Logout"
            >
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
