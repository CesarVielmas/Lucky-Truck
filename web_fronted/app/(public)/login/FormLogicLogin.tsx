"use client";

import Image from 'next/image';
import { Fragment } from '@/components/ui/fragment';
import { Button } from '@/components/ui/button';
import { Tittle } from '@/components/ui/tittle';
import { InputText } from '@/components/forms/inputText';
import Error from '@/public/icons/error.png';
import Success from '@/public/icons/sucess.png';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';

export default function FormLogicLogin() {
  const [user,setUser] = useState("");
  const [password,setPassword] = useState("");
  const [active,setActive] = useState(false);
  const [auth,setAuth] = useState(false);
  const [stateLogin,setStateLogin] = useState(0);
  const [textInformation,setTextInformation] = useState("Comprobando existencia de usuario...");

  const handleUser = (e : React.ChangeEvent) =>{
    if(e.target){
      const value : string = (e.target as HTMLInputElement).value;
      setUser(value);
    }
  }
  const handlePassword = (e : React.ChangeEvent) =>{
    if(e.target){
      const value : string = (e.target as HTMLInputElement).value;
      setPassword(value);
    }
  }
  const handleLogin = () => {
    if(!active)
      return;
    setAuth(true);
    setTimeout(()=>{
      setTextInformation("Verificando contraseña...")
      setTimeout(()=>{
        setTextInformation("Ingresando a la sesion...");
        setStateLogin(1);
        setTimeout(()=>{
          setAuth(false);
          const wrapper = document.getElementById("login-wrapper");
          const bg = document.getElementById("bg-image");
          const content = document.getElementById("login-content");  
          wrapper?.classList.add("bg-to-white");
          bg?.classList.add("fade-out");
          content?.classList.add("move-left");
          document.cookie = `role=${"user"}; path=/; max-age=3600;`;
          redirect("/dashboard");

        },1000);
      },2000);
    },1000)
  }
  useEffect(()=>{
    if(user.length > 0 && password.length > 8)
      setActive(true);

  },[user,password])
  return (
    <>
      {auth && (
        <Fragment className="absolute flex justify-center items-center z-3 h-full w-full bg-black/60 top-0 left-0" variant="invisibly" bordered="hight">
          <Fragment className='bg-white h-5/10 w-6/11 ' variant="default" bordered="medium">
            <Tittle className='text-black text-center mt-15' variant="moreHight" weight="bold">Verificando Informacion</Tittle>
            {stateLogin === 0 ? (
              <div className="flex items-center justify-center mt-20">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-black/30 border-t-black"></div>
              </div>
            ) : stateLogin === 1 ? (
              <Image src={Success} alt="Success" className="w-35 h-35 mx-auto mt-10 animate-element-bubble-in" />
            ) : (
              <Image src={Error} alt="Error" className="w-35 h-35 mx-auto mt-10 animate-element-bubble-in" />
            )}
            <Tittle className='text-gray-500 text-center mt-10' variant="medium" weight="semibold" >{textInformation}</Tittle>
          </Fragment>
        </Fragment> 
      )}
      <Fragment className='flex-16 flex flex-col h-full w-8/10 mt-3' variant="invisibly">
        <Fragment className='flex-1 flex-col h-full w-full mb-6' variant="invisibly" >
          <Tittle className='flex-1 text-gray-100 text-start font-sans mt-0 tracking-wider' variant="hight" weight="medium">Nombre De Usuario</Tittle>
          <InputText className='flex-1 bg-transparent focus:outline-none focus:ring-0 font-sans text-xl text-white font-medium placeholder-white pl-6 rounded-lg border-white border-2 mt-2 h-7/11' bgColor='white' placeholder='Ingrese Su Usuario Aqui...' icon='user' typeInput='text' value={user} onChangeFunction={handleUser} />
        </Fragment>
        <Fragment className='flex-1 flex-col h-full w-full' variant="invisibly" >
          <Tittle className='flex-1 text-gray-100 text-start font-sans mt-0 tracking-wider' variant="hight" weight="medium">Contraseña</Tittle>
          <InputText className='flex-1 bg-transparent focus:outline-none focus:ring-0 font-sans text-xl text-white font-medium placeholder-white pl-6 rounded-lg border-white border-2 mt-2 h-7/11' bgColor='white' placeholder='Ingrese Su Contraseña Aqui...' icon='password' typeInput='password' value={password} onChangeFunction={handlePassword} />
        </Fragment>
        <Fragment className='flex flex-1 justify-center items-center' variant="invisibly">
            <Button className='h-8/10 w-4/10 border-3 rounded-lg border-white mt-7 text-xl text-white font-md tracking-wide hover:bg-gray-800 cursor-pointer' isActiveClass='border-gray-500 text-gray-500 hover:bg-transparent cursor-default' isActive={active} onClick={handleLogin} textButton='INGRESAR' />
        </Fragment>
      </Fragment>
    </>
  );
}
