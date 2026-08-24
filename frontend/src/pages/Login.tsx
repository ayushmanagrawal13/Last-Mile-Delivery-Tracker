import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
export default function Login(){
  const { login }=useAuth(); const nav=useNavigate();
  const [email,setEmail]=useState('customer@delivery.local');
  const [password,setPassword]=useState('customer123');
  const [err,setErr]=useState(''); const [loading,setLoading]=useState(false);
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); setLoading(true); setErr(''); try{ await login(email,password); nav('/dashboard'); }catch(e:any){ setErr(e.response?.data?.error||e.message); } finally{ setLoading(false); } };
  return <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',background:'radial-gradient(600px 400px at 10% 10%, #fef3c7, transparent 60%), #f8fafc'}}>
    <div style={{padding:'40px 50px',display:'flex',flexDirection:'column',justifyContent:'center',background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',color:'#fff'}}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}><div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#f59e0b,#ea580c)',display:'grid',placeItems:'center',fontWeight:800}}>📦</div><b>ShipTrack</b></div>
      <h1 style={{fontFamily:'Plus Jakarta Sans',fontSize:32,marginTop:24,lineHeight:1.2}}>Last-mile that<br/><span style={{color:'#fde68a'}}>never loses</span> a parcel</h1>
      <p style={{marginTop:12,opacity:0.8,fontSize:14,lineHeight:1.6}}>Rate engine + auto-assignment, immutable timeline, email retry — portfolio-grade.</p>
      <div style={{marginTop:18,display:'grid',gap:8,fontSize:13}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:24,height:24,borderRadius:999,background:'rgba(253,224,71,0.2)',display:'grid',placeItems:'center'}}>✓</span> Volumetric vs actual, B2B/B2C, COD breakdown</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:24,height:24,borderRadius:999,background:'rgba(253,224,71,0.2)',display:'grid',placeItems:'center'}}>✓</span> Zone-based assignment, load-balanced, manual override</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{width:24,height:24,borderRadius:999,background:'rgba(253,224,71,0.2)',display:'grid',placeItems:'center'}}>✓</span> Timeline immutable, failed→reschedule→reassign</div>
      </div>
      <div style={{marginTop:22,padding:12,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:12,fontSize:11}}>
        <b>Demo accounts:</b>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
          <button onClick={()=>{setEmail('admin@delivery.local');setPassword('admin123')}} style={{background:'#fff',color:'#0f172a',padding:'6px 10px',borderRadius:999,border:'none',fontSize:11,cursor:'pointer'}}>Admin</button>
          <button onClick={()=>{setEmail('customer@delivery.local');setPassword('customer123')}} style={{background:'#fff',color:'#0f172a',padding:'6px 10px',borderRadius:999,border:'none',fontSize:11,cursor:'pointer'}}>Customer</button>
          <button onClick={()=>{setEmail('agent1@delivery.local');setPassword('agent123')}} style={{background:'#fff',color:'#0f172a',padding:'6px 10px',borderRadius:999,border:'none',fontSize:11,cursor:'pointer'}}>Agent</button>
        </div>
      </div>
    </div>
    <div style={{display:'grid',placeItems:'center',padding:40}}>
      <div className="card" style={{width:'100%',maxWidth:420}}>
        <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:22}}>Welcome back</h2><p style={{color:'#64748b',fontSize:13,marginTop:6}}>Sign in — customer / agent / admin</p>
        <form onSubmit={submit} style={{marginTop:18}}>
          <label style={{fontSize:13,fontWeight:600}}>Email<input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label style={{marginTop:12,display:'block',fontSize:13,fontWeight:600}}>Password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
          {err && <p style={{color:'#ef4444',marginTop:10,fontSize:13,background:'#fee2e2',padding:'8px 10px',borderRadius:8}}>{err}</p>}
          <button className="btn" style={{marginTop:16,width:'100%'}} type="submit" disabled={loading}>{loading?'Signing in…':'Sign in →'}</button>
        </form>
        <p style={{marginTop:14,fontSize:13,textAlign:'center'}}>No account? <Link to="/register" style={{color:'#d97706',fontWeight:600}}>Create customer account</Link></p>
        <p style={{marginTop:8,fontSize:11,textAlign:'center',color:'#94a3b8'}}><Link to="/">← Landing</Link></p>
      </div>
    </div>
  </div>
}
