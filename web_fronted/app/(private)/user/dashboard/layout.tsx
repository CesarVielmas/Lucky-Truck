import UserHeader from "./header"

export const dynamic = "force-static";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row p-5 h-screen w-screen bg-white gap-x-5">
       <UserHeader />
         <div className="relative flex-6 overflow-hidden">
          <div id="wrapper-content" className="absolute w-full h-full animate-element-slide-in">
            {children}
          </div>
        </div>
    </div>
  );
}
