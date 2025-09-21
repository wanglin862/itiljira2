import { AppSidebar } from '../AppSidebar'
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-4">
          <h2 className="text-2xl font-bold">Sidebar Example</h2>
          <p className="text-muted-foreground">Navigate using the sidebar on the left</p>
        </main>
      </div>
    </SidebarProvider>
  )
}