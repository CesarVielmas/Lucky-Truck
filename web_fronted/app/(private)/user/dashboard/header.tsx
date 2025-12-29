"use client";

import Image from "next/image";
import Logo from "@/public/logo-login.png";
import LogoutIcon from "@/public/icons/logout.png";
import DashBoardIcon from "@/public/icons/dashboard.png";
import DashBoardIconActive from "@/public/icons/dashboard_active.png";
import HistoryIcon from "@/public/icons/history.png";
import HistoryIconActive from "@/public/icons/history_active.png";
import TripsIcon from "@/public/icons/trips.png";
import TripsIconActive from "@/public/icons/trips_active.png";
import { Separation } from "@/components/ui/separation";
import { HeaderApart } from "@/components/ui/header_apart";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserHeader() {
  const [actualPanel,setActualPanel] = useState(0);
  const router = useRouter();

  const changePanel = (panel : number,path : string) =>{
    setActualPanel(panel);
    const wrapper = document.getElementById("wrapper-content");
    wrapper?.classList.replace("animate-element-slide-in","animate-element-slide-out");
    setTimeout(()=>{
        router.push(path);
        wrapper?.classList.replace("animate-element-slide-out","animate-element-slide-in");
    },700);
  }

  return (
    <div className="flex flex-1 z-1 bg-white flex-col justify-center pt-8 pb-8 gap-y-5 items-center rounded-xl shadow-xl/90 shadow-gray-500 h-full w-full">
        <div className="flex-1 h-full w-8/10">
            <Image className="object-fill" src={Logo} alt="logo" />
        </div>
        <div className="flex justify-center items-center flex-1 h-full w-9/10">
            <HeaderApart orientation="horizontal" onClickApart={()=>changePanel(0,"/dashboard")} isActive={ actualPanel === 0 ? true : false} logoImageInnactive={DashBoardIcon} logoImageActive={DashBoardIconActive} fontColorInnactive="text-gray-500" fontColorActive="text-white" bgColorActive="bg-gray-300" fontText="Panel Principal"/>
        </div>
         <div className="flex justify-center items-center flex-1 h-full w-9/10">
            <HeaderApart orientation="horizontal" onClickApart={()=>changePanel(1,"/dashboard/history")} isActive={actualPanel === 1 ? true : false} logoImageInnactive={HistoryIcon} logoImageActive={HistoryIconActive} fontColorInnactive="text-gray-500" fontColorActive="text-white" bgColorActive="bg-gray-300" fontText="Facturas"/>
        </div>
        <div className="flex justify-center items-center flex-1 h-full w-9/10">
            <HeaderApart orientation="horizontal" onClickApart={()=>changePanel(2,"/dashboard/trips")} isActive={actualPanel === 2 ? true : false} logoImageInnactive={TripsIcon} logoImageActive={TripsIconActive} fontColorInnactive="text-gray-500" fontColorActive="text-white" bgColorActive="bg-gray-300" fontText="Viajes"/>
        </div>
        <div className="flex-1 h-full w-9/10">
            <Separation orientation="horizontal" circleSize="sm" lineSize="sm" bgColor="bg-gray-300" />
        </div>
        <div className="flex justify-center items-end flex-1 h-full w-9/10">
            <HeaderApart orientation="horizontal" isActive={false} logoImageInnactive={LogoutIcon} logoImageActive={LogoutIcon} fontColorInnactive="text-gray-500" fontText="Cerrar Sesion"/>
        </div>
    </div>
  );
}
