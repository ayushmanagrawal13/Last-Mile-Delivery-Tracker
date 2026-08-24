import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';
function Protected({role, children}:{role?:string[], children:React.ReactNode}){
  const { user }=useAuth();
  if(!user) return <Navigate to="/login" />;
  if(role && !role.includes(user.role)) return <div style={{padding:40}}>Forbidden for {user.role} — needed {role.join('/')} <Link to="/">Home</Link></div>;
  return <>{children}</>;
}
function Home(){
  const {user}=useAuth();
  if(!user) return <Navigate to="/login" />;
  if(user.role==='CUSTOMER') return <Navigate to="/customer" />;
  if(user.role==='DELIVERY_AGENT') return <Navigate to="/agent" />;
  if(user.role==='ADMIN') return <Navigate to="/admin" />;
  return <div>Unknown role</div>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider><BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/dashboard" element={<Protected><Home/></Protected>} />
      <Route path="/customer/*" element={<Protected role={['CUSTOMER','ADMIN']}><CustomerDashboard/></Protected>} />
      <Route path="/agent/*" element={<Protected role={['DELIVERY_AGENT','ADMIN']}><AgentDashboard/></Protected>} />
      <Route path="/admin/*" element={<Protected role={['ADMIN']}><AdminDashboard/></Protected>} />
    </Routes>
  </BrowserRouter></AuthProvider>
);
