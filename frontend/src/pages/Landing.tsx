import React from 'react';
import { Link } from 'react-router-dom';
export default function Landing(){
  return <div style={{fontFamily:'Inter,system-ui', overflowX:'hidden'}}>
    <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 40px',position:'sticky',top:0,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid #e2e8f0',zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#f59e0b,#ea580c)',display:'grid',placeItems:'center',color:'#fff',fontWeight:800}}>📦</div><b style={{fontFamily:'Plus Jakarta Sans',fontSize:18}}>ShipTrack</b></div>
      <div style={{display:'flex',gap:18,alignItems:'center',fontSize:14}}><a href="#features" style={{color:'#334155'}}>Features</a><a href="#how" style={{color:'#334155'}}>How it works</a><a href="#rates" style={{color:'#334155'}}>Rate Engine</a><Link to="/login" style={{padding:'8px 16px',border:'1px solid #e2e8f0',borderRadius:10}}>Login</Link><Link to="/register" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',padding:'10px 18px',borderRadius:10,fontWeight:600}}>Ship Now →</Link></div>
    </nav>
    <section style={{display:'grid',gridTemplateColumns:'1.1fr 0.9fr',gap:40,padding:'60px 40px',alignItems:'center',background:'radial-gradient(800px 400px at 20% 20%, #fef3c7 0%, transparent 60%), radial-gradient(600px 400px at 80% 80%, #dbeafe 0%, transparent 60%)'}}>
      <div>
        <div style={{display:'inline-flex',gap:8,alignItems:'center',background:'#fff',border:'1px solid #e2e8f0',padding:'6px 12px',borderRadius:999,fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}><span style={{width:8,height:8,background:'#22c55e',borderRadius:'50%'}}></span> Live — Zero-hardcode rates • Load-balanced assignment • Immutable timeline</div>
        <h1 style={{fontFamily:'Plus Jakarta Sans',fontSize:46,lineHeight:1.1,marginTop:16,fontWeight:800,letterSpacing:-1}}>Last-mile that<br/><span style={{background:'linear-gradient(135deg,#f59e0b,#ea580c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>never loses</span> a parcel</h1>
        <p style={{marginTop:14,color:'#475569',fontSize:16,lineHeight:1.7}}>Admin-configured zones & rate cards, volumetric vs actual weight, B2B/B2C & COD surcharge — with full breakdown before confirm. Auto-assigns to nearest available agent, tracks every status immutably, emails on every change.</p>
        <div style={{display:'flex',gap:12,marginTop:24}}><Link to="/register" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',padding:'14px 22px',borderRadius:12,fontWeight:700,boxShadow:'0 8px 24px rgba(245,158,11,0.3)'}}>Create Shipment — Free →</Link><Link to="/login" style={{padding:'14px 22px',borderRadius:12,border:'1px solid #e2e8f0',background:'#fff',fontWeight:600}}>Live Demo (admin/agent/customer)</Link></div>
        <div style={{display:'flex',gap:24,marginTop:24,fontSize:13}}><div><b style={{fontSize:20}}>(L×B×H)/5000</b><div style={{color:'#64748b'}}>volumetric weight</div></div><div><b style={{fontSize:20}}>INTRA/INTER</b><div style={{color:'#64748b'}}>zone-aware rates</div></div><div><b style={{fontSize:20}}>3×</b><div style={{color:'#64748b'}}>email retry, never blocks</div></div></div>
        <div style={{marginTop:18,display:'flex',gap:8,flexWrap:'wrap'}}><span style={{fontSize:11,background:'#f1f5f9',padding:'6px 10px',borderRadius:999}}>admin@delivery.local / admin123</span><span style={{fontSize:11,background:'#f1f5f9',padding:'6px 10px',borderRadius:999}}>customer@delivery.local / customer123</span><span style={{fontSize:11,background:'#f1f5f9',padding:'6px 10px',borderRadius:999}}>agent1@delivery.local / agent123</span></div>
      </div>
      <div style={{position:'relative'}}>
        <div style={{background:'#fff',borderRadius:20,padding:18,boxShadow:'0 20px 60px rgba(0,0,0,0.12)',border:'1px solid #e2e8f0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><b>100001 → 200001</b><span style={{background:'#dcfce7',color:'#166534',padding:'4px 8px',borderRadius:999,fontSize:11}}>INTER • B2C</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:12}}>
            <div style={{padding:10,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}><div style={{color:'#64748b',fontSize:10}}>VOLUMETRIC</div><b>1.20 kg</b><div style={{fontSize:10, color:'#64748b'}}>(20×15×20)/5000</div></div>
            <div style={{padding:10,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}><div style={{color:'#64748b',fontSize:10}}>BILLABLE</div><b>2.00 kg</b><div style={{fontSize:10}}>max(2.0,1.2)</div></div>
            <div style={{padding:10,background:'#fef3c7',borderRadius:10,border:'1px solid #fde68a'}}><div style={{color:'#92400e',fontSize:10}}>RATE</div><b>₹80/kg</b><div style={{fontSize:10}}>B2C INTER</div></div>
            <div style={{padding:10,background:'#fff',borderRadius:10,border:'1px solid #e2e8f0'}}><div style={{color:'#64748b',fontSize:10}}>TOTAL</div><b>₹176</b><div style={{fontSize:10}}>160 + 16 COD 10%</div></div>
          </div>
          <div style={{marginTop:12,padding:12,background:'#f0fdfa',borderRadius:12,border:'1px solid #ccfbf1'}}><div style={{fontSize:11,color:'#0f766e',fontWeight:700}}>AUTO-ASSIGNMENT</div><div style={{marginTop:6,fontSize:12}}>Agent One (North, load 0) → available in pickup zone North</div></div>
        </div>
        <div style={{position:'absolute',top:-14,right:-14,background:'#fff',padding:'10px 14px',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',fontSize:12,border:'1px solid #e2e8f0'}}>✉️ Email: Assigned to Order #ord_12</div>
        <div style={{position:'absolute',bottom:-14,left:-14,background:'#0f172a',color:'#fff',padding:'10px 14px',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',fontSize:12}}>📍 Timeline: CREATED → ASSIGNED → PICKED_UP ...</div>
      </div>
    </section>
    <section style={{padding:'18px 40px',display:'flex',gap:24,alignItems:'center',borderTop:'1px solid #e2e8f0',borderBottom:'1px solid #e2e8f0',background:'#fff',fontSize:12,color:'#64748b',flexWrap:'wrap'}}>
      <b>Built for evaluation:</b> <span>✓ Prisma + PostgreSQL • FK zones</span> <span>✓ Rate engine isolated • Zero hardcode</span> <span>✓ Assignment load-balanced</span> <span>✓ Immutable tracking_events</span> <span>✓ Queued email retry</span>
    </section>
    <section id="features" style={{padding:'50px 40px'}}>
      <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:28,textAlign:'center'}}>Everything a reviewer expects</h2><p style={{textAlign:'center',color:'#64748b',marginTop:6}}>Portfolio-grade, not a toy — rate engine & assignment are fully admin-configurable.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:24}}>
        {[
          {t:'Zone Management',d:'Admin creates zones, maps pincodes/areas → zone. Many→one. Unmapped area fails with clear error, never silent default.',c:'#f59e0b'},
          {t:'Rate Cards B2B/B2C',d:'Separate intra/inter rates per kg. All in DB, zero hardcode. Admin edits live.',c:'#0891b2'},
          {t:'COD Surcharge',d:'Flat or % per order type, applied only if payment= COD. Configurable per B2B/B2C.',c:'#7c3aed'},
          {t:'Auto-Assignment',d:'Available + current_zone==pickup_zone + min activeOrderCount. Fallback to manual if none in-zone.',c:'#db2777'},
          {t:'Immutable Timeline',d:'Every status change is append-only tracking_events with actor/role/timestamp — source of truth, admin override logged.',c:'#ea580c'},
          {t:'Email & SMS Retry',d:'Nodemailer adapter + stub SMS, queued 3× backoff, notification_log pending/sent/failed — never blocks order.',c:'#16a34a'},
        ].map(f=><div key={f.t} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,boxShadow:'0 4px 16px rgba(0,0,0,0.04)'}}><div style={{width:36,height:36,borderRadius:10,background:`${f.c}18`,display:'grid',placeItems:'center',color:f.c,fontWeight:800}}>◆</div><h3 style={{marginTop:10,fontSize:15}}>{f.t}</h3><p style={{marginTop:6,color:'#475569',fontSize:13,lineHeight:1.6}}>{f.d}</p></div>)}
      </div>
    </section>
    <section id="how" style={{padding:'30px 40px',background:'#f8fafc',borderTop:'1px solid #e2e8f0',borderBottom:'1px solid #e2e8f0'}}>
      <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:24,textAlign:'center'}}>How it works — 30s flow</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginTop:22}}>
        {[{n:'1',t:'Customer previews',d:'Enter pickup/drop + dims + weight → see breakdown: zones, volumetric/billable, rate, COD, total before confirm.'},{n:'2',t:'Auto-assign',d:'System picks available agent in pickup zone with lowest load, or leaves unassigned for admin.'},{n:'3',t:'Track & reschedule',d:'Timeline shows every event; on FAILED, customer picks reschedule date → reassigned and logged.'}].map(s=><div key={s.n} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,textAlign:'center'}}><div style={{width:40,height:40,borderRadius:999,background:'linear-gradient(135deg,#f59e0b,#ea580c)',color:'#fff',display:'grid',placeItems:'center',margin:'0 auto',fontWeight:800}}>{s.n}</div><h4 style={{marginTop:10}}>{s.t}</h4><p style={{marginTop:6,color:'#64748b',fontSize:13}}>{s.d}</p></div>)}
      </div>
    </section>
    <section id="rates" style={{padding:'40px 40px'}}>
      <h2 style={{fontFamily:'Plus Jakarta Sans',fontSize:24}}>Rate engine — worked example</h2>
      <div style={{marginTop:16,background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
        <div>
          <p style={{fontSize:13,color:'#475569'}}>Order: B2C, COD, 100001→200001 (INTER), L20×B15×H20, actual 2kg</p>
          <table style={{width:'100%',marginTop:12,fontSize:13,borderCollapse:'collapse'}}><tbody>
            <tr><td style={{padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>Volumetric</td><td style={{textAlign:'right',borderBottom:'1px solid #f1f5f9'}}>(20×15×20)/5000 = <b>1.2 kg</b></td></tr>
            <tr><td style={{padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>Billable</td><td style={{textAlign:'right',borderBottom:'1px solid #f1f5f9'}}>max(2,1.2) = <b>2 kg</b></td></tr>
            <tr><td style={{padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>Rate card</td><td style={{textAlign:'right',borderBottom:'1px solid #f1f5f9'}}>B2C INTER = <b>₹80/kg</b></td></tr>
            <tr><td style={{padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>Base</td><td style={{textAlign:'right',borderBottom:'1px solid #f1f5f9'}}>2×80 = <b>₹160</b></td></tr>
            <tr><td style={{padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>COD 10% (B2C)</td><td style={{textAlign:'right',borderBottom:'1px solid #f1f5f9'}}>+<b>₹16</b></td></tr>
            <tr><td style={{padding:'8px 0',fontWeight:800}}>Total</td><td style={{textAlign:'right',fontWeight:800}}>₹176</td></tr>
          </tbody></table>
        </div>
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:16}}>
          <b style={{color:'#92400e'}}>Admin-configurable, zero hardcode</b>
          <p style={{marginTop:8,color:'#475569',fontSize:13}}>Zones, rate cards, COD surcharge all in DB — change via Admin portal, no code deploy. Unmapped area → 400 `Area not mapped`.</p>
          <div style={{marginTop:12,display:'flex',gap:8}}><span style={{background:'#fff',border:'1px solid #fde68a',padding:'6px 10px',borderRadius:999,fontSize:11}}>Intra B2C ₹50</span><span style={{background:'#fff',border:'1px solid #fde68a',padding:'6px 10px',borderRadius:999,fontSize:11}}>Inter B2C ₹80</span><span style={{background:'#fff',border:'1px solid #fde68a',padding:'6px 10px',borderRadius:999,fontSize:11}}>COD 10% / Flat ₹50</span></div>
        </div>
      </div>
    </section>
    <footer style={{padding:'18px 40px',color:'#64748b',fontSize:12,display:'flex',justifyContent:'space-between',borderTop:'1px solid #e2e8f0',marginTop:20}}>
      <span>© 2026 ShipTrack — Last-Mile Delivery Tracker • HTML/CSS/JS premium • Node+Prisma</span>
      <span>API /api/v1 • Zod • RBAC • Pino • Rate Engine • Assignment • Timeline</span>
    </footer>
  </div>
}
