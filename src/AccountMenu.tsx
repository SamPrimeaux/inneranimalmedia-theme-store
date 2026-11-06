import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, Settings, LayoutDashboard, Store, UserCircle } from 'lucide-react';
import './account-menu.css';

export type AccountState = {
  authenticated:boolean;
  user?: { id:string; name:string; email:string; avatar_url:string };
  requires_sso?:boolean;
};
const GUEST:AccountState={authenticated:false};
export function AccountMenu(){
 const [state,setState]=useState<AccountState|null>(null);
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
   const controller=new AbortController();
   fetch('/api/account/me',{credentials:'same-origin',cache:'no-store',signal:controller.signal})
      .then(async r=>r.ok?await r.json() as AccountState:GUEST)
      .then(value=>setState(value?.authenticated===true&&value.user?.id?value:GUEST))
      .catch(()=>{if(!controller.signal.aborted)setState(GUEST)});
   return()=>controller.abort();
 },[]);
 useEffect(()=>{
   if(!open)return;
   const onPointer=(e:PointerEvent)=>{if(e.target instanceof Node&&!root.current?.contains(e.target))setOpen(false)};
   const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};
   document.addEventListener('pointerdown',onPointer);
   document.addEventListener('keydown',onKey);
   return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)};
 },[open]);
 if(!state)return <div className="account-loading" aria-label="Checking account" role="status" />;
 if(!state.authenticated||!state.user)return <div className="account-guest">
   <a href="https://agentsam.inneranimalmedia.com/auth/login"><LogIn size={14}/> Sign in</a>
   <a className="account-join" href="https://agentsam.inneranimalmedia.com/auth/signup">Sign up</a>
 </div>;
 const person=state.user;
 const initials=(person.name||person.email||'U').slice(0,1).toUpperCase();
 return <div className="account-menu" ref={root}>
   <button type="button" className="account-trigger" onClick={()=>setOpen(v=>!v)} aria-label="Account menu" aria-expanded={open} aria-haspopup="menu">
     {person.avatar_url?<img src={person.avatar_url} alt="" referrerPolicy="no-referrer" />:<span className="account-fallback">{initials}</span>}
     <ChevronDown size={14}/>
   </button>
   {open&&<div className="account-dropdown" role="menu" aria-label="Your account">
      <div className="account-profile">
       {person.avatar_url?<img src={person.avatar_url} alt="" referrerPolicy="no-referrer" />:<span className="account-fallback">{initials}</span>}
       <div><strong>{person.name||'Your account'}</strong><small>{person.email}</small></div>
      </div>
      <a role="menuitem" href="https://agentsam.inneranimalmedia.com/admin/home"><LayoutDashboard size={16}/> Dashboard</a>
      <a role="menuitem" href="https://agentsam.inneranimalmedia.com/sites"><Store size={16}/> My sites</a>
      <a role="menuitem" href="https://agentsam.inneranimalmedia.com/admin/profile"><UserCircle size={16}/> Profile</a>
      <a role="menuitem" href="https://agentsam.inneranimalmedia.com/dashboard/settings/integrations"><Settings size={16}/> Settings & connections</a>
      <div className="account-menu-note">Your account is verified by AgentSam. Sign-out is managed by the identity provider.</div>
   </div>}
 </div>;
}
