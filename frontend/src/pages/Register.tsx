import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
export default function Register(){
  const { register }=useAuth(); const nav=useNavigate();
  const [form,setForm]=useState({name:'',email:'',password:''});
  const [err,setErr]=useState(''); const [loading,setLoading]=useState(false);
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); setLoading(true); try{ await register({...form, role:'CUSTOMER'}); nav('/dashboard'); }catch(e:any){ setErr(e.response?.data?.error||e.message); } finally{ setLoading(false); } };
  return <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f8fafc'}}>
    <div style={{display:'grid',placeItems:'center',padding:40}}>
      <div className="card" style={{width:'100%',maxWidth:420}}>
        <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:22}}>Create customer account</h2>
        <form onSubmit={submit} style={{marginTop:18}}>
          <label style={{fontSize:13,fontWeight:600}}>Name<input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></label>
          <label style={{marginTop:12,display:'block',fontSize:13,fontWeight:600}}>Email<input className="input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></label>
          <label style={{marginTop:12,display:'block',fontSize:13,fontWeight:600}}>Password<input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></label>
          {err && <p style={{color:'#ef4444',marginTop:10,background:'#fee2e2',padding:'8px 10px',borderRadius:8,fontSize:13}}>{err}</p>}
          <button className="btn" style={{marginTop:16,width:'100%'}} type="submit" disabled={loading}>{loading?'Creating…':'Create →'}</button>
        </form>
        <p style={{marginTop:14,fontSize:13,textAlign:'center'}}><Link to="/login" style={{color:'#d97706',fontWeight:600}}>Already have account? Login</Link></p>
      </div>
    </div>
    <div style={{padding:'40px 50px',display:'flex',flexDirection:'column',justifyContent:'center',background:'linear-gradient(135deg,#f59e0b,#ea580c)',color:'#fff'}}>
      <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:28}}>Ship in 30s<br/>with full price<br/>before you pay</h2>
      <p style={{marginTop:10,opacity:0.9,fontSize:14}}>Zone-aware rates, volumetric weight, COD — all admin-configurable, zero hardcode.</p>
      <div style={{marginTop:18,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',borderRadius:16,padding:16,border:'1px solid rgba(255,255,255,0.2)',fontSize:13}}>
        <div>100001→200001 • B2C • COD • 20×15×20 • 2kg → ₹176</div><div style={{opacity:0.8,marginTop:6}}>1.2 kg volumetric, 2 kg billable, ₹80/kg inter + 10% COD</div>
      </div>
    </div>
  </div>
}
