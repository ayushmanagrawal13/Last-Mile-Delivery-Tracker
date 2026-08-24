import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
type User={id:string;email:string;name:string;role:string};
type Ctx={user:User|null; token:string|null; login:(e:string,p:string)=>Promise<void>; register:(d:any)=>Promise<void>; logout:()=>void};
const AuthContext=createContext<Ctx>(null as any);
export const useAuth=()=>useContext(AuthContext);
export const AuthProvider:React.FC<{children:React.ReactNode}> = ({children})=>{
  const [user,setUser]=useState<User|null>(()=>{ const s=localStorage.getItem('user'); return s?JSON.parse(s):null; });
  const [token,setToken]=useState<string|null>(()=>localStorage.getItem('token'));
  const login=async(email:string,password:string)=>{
    const res=await api.post('/api/v1/auth/login',{email,password});
    const {user,token}=res.data.data;
    localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
    setUser(user); setToken(token);
  };
  const register=async(data:any)=>{
    const res=await api.post('/api/v1/auth/register',data);
    const {user,token}=res.data.data;
    localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
    setUser(user); setToken(token);
  };
  const logout=()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setToken(null); };
  useEffect(()=>{ if(token) api.get('/api/v1/auth/me').catch(()=>logout()); },[]);
  return <AuthContext.Provider value={{user,token,login,register,logout}}>{children}</AuthContext.Provider>
};
