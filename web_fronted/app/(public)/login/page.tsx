import Image from 'next/image';
import bgLogin from '@/public/bg-login.jpeg';
import logoLogin from '@/public/logo-login.png';
import { Fragment } from '@/components/ui/fragment';
import { Tittle } from '@/components/ui/tittle';
import { Separation } from '@/components/ui/separation';
import FormLogicLogin from './FormLogicLogin';

export const dynamic = "force-static";
export default function Login() {
  return (
    <div id='login-wrapper' className="relative h-screen w-screen bg-black flex flex-col">
      <Image id='bg-image' className="absolute z-1 opacity-50 size-full" src={bgLogin} alt='bg-login' />
        <Fragment className="flex flex-1 overflow-hidden items-center justify-center" variant="invisibly">
          <Fragment id='login-content' className="flex flex-col p-8 animate-element-enter-fade-in h-7/8 w-7/10" variant="cristal" bordered="hight">
            <Fragment className="flex-3 flex overflow-hidden items-center justify-center" variant="invisibly">
              <Image className='max-h-full opacity-65 max-w-full object-fill' src={logoLogin} alt='logo-login' />
            </Fragment>
            <Fragment className='static flex-4 flex flex-col items-center justify-center' variant="invisibly">
              <Tittle className='flex-1 text-center text-5xl mb-0 mt-4' variant="moreHight" weight="semibold">Iniciar Sesion</Tittle>
              <Fragment className='relative flex-1 w-8/10 mt-6' variant="invisibly"><Separation orientation="horizontal" circleSize="md" bgColor="bg-white" lineSize="sm" borderOption="md" /></Fragment>
              <FormLogicLogin />
            </Fragment>
          </Fragment>
        </Fragment>
    </div>
  );
}
