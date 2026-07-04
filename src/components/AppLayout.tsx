// 应用布局壳：含底部导航的内容区
import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
  hideNav = false,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="flex h-[100dvh] flex-col">
      <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto w-full max-w-md px-4 pb-6 pt-[calc(env(safe-area-inset-top)+16px)]">
          {children}
        </div>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
