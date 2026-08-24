import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function AgentDashboard(){
  const { user, logout }=useAuth();
  const [orders,setOrders]=useState<any[]>([]);
  const [agent,setAgent]=useState<any>(null);
  const [reason,setReason]=useState<{[k:string]:string}>({});
  const load=async()=>{
    const r=await api.get('/api/v1/orders'); setOrders(r.data.data);
    try{ const a=await api.get('/api/v1/agents/me'); setAgent(a.data.data); }catch{}
  };
  useEffect(()=>{ load(); },[]);
  const updateStatus=async(id:string, to:string)=>{
    const notes=reason[id];
    if(to==='FAILED' && !notes) return alert('Failed requires reason');
    try{ await api.post(`/api/v1/orders/${id}/status`,{ toStatus:to, notes }); load(); }catch(e:any){ alert(e.response?.data?.error||e.message); }
  };
  const setAvailability=async(status:string, zoneId?:string)=>{
    if(!agent) return;
    await api.put(`/api/v1/agents/${agent.id}`,{ status, currentZoneId: zoneId||agent.currentZoneId });
    load();
  };
  return <div className="container">
    <div className="nav"><h3>Agent — {user?.name}</h3><button className="btn-secondary btn" onClick={logout}>Logout</button></div>
    <div className="hero" style={{padding:20}}><h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:18}}>Your deliveries</h2><p style={{opacity:0.9,marginTop:4}}>Picked Up → In Transit → Out for Delivery → Delivered / Failed (with reason)</p></div>
    <div className="grid grid-2">
      <div className="card">
        <h3>🟢 Availability & Zone</h3>
        {agent ? <div>
          <p style={{fontSize:13}}>Status: <b>{agent.status}</b> • Zone: <b>{agent.currentZone?.name || agent.currentZoneId || '—'}</b> • Load: {agent.activeOrderCount}</p>
          <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
            <button className="btn" style={{padding:'8px 12px',fontSize:12}} onClick={()=>setAvailability('AVAILABLE')}>Available</button>
            <button className="btn-secondary btn" style={{padding:'8px 12px',fontSize:12}} onClick={()=>setAvailability('UNAVAILABLE')}>Unavailable</button>
            <select className="input" style={{width:140}} value={agent.currentZoneId||''} onChange={e=>setAvailability(agent.status, e.target.value)}>
              <option value="">No zone</option>
              <option value="zone_a">North</option>
              <option value="zone_b">South</option>
            </select>
          </div>
        </div> : <p style={{fontSize:13,color:'#64748b'}}>Loading agent profile… (admin creates agents)</p>}
      </div>
      <div className="card">
        <h3>📦 Assigned Orders ({orders.length})</h3>
        {orders.length===0 && <p style={{fontSize:13,color:'#64748b'}}>No assigned orders.</p>}
        {orders.map(o=><div key={o.id} className="card" style={{padding:12,marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b>{o.id.slice(0,8)}</b><span className={`badge badge-${o.currentStatus==='DELIVERED'?'delivered':o.currentStatus==='FAILED'?'failed':'assigned'}`}>{o.currentStatus}</span></div>
          <div style={{fontSize:12,marginTop:4}}>{o.pickupAddress} → {o.dropAddress} • {o.orderType}/{o.paymentType} • ₹{o.totalCharge}</div>
          <div style={{fontSize:11,marginTop:4,background:'#f8fafc',padding:8,borderRadius:8}}>Customer: {o.customer?.name || o.customerId.slice(0,8)} • {o.l}×{o.b}×{o.h} • {o.billableWeight}kg</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
            {['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'].map(s=> <button key={s} className="btn-secondary btn" style={{padding:'6px 10px',fontSize:11}} onClick={()=>updateStatus(o.id,s)}>{s}</button>)}
          </div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <input className="input" placeholder="Failed reason (required if Failed)" value={reason[o.id]||''} onChange={e=>setReason({...reason,[o.id]:e.target.value})} style={{flex:1,padding:'6px 10px',fontSize:12}} />
            <button className="btn" style={{background:'#ef4444',padding:'6px 10px',fontSize:12}} onClick={()=>updateStatus(o.id,'FAILED')}>Failed</button>
          </div>
          <div className="timeline" style={{marginTop:10}}>
            {(o.tracking||[]).slice(-3).map((t:any,i:number)=><div key={i} style={{fontSize:11}}>{t.fromStatus}→{t.toStatus} by {t.actorRole} • {new Date(t.createdAt).toLocaleString()}</div>)}
          </div>
        </div>)}
      </div>
    </div>
  </div>
}
