/* ============================== 03b SEAMLESS SKINNED BODY ==============================
   One continuous metaball (marching-cubes) surface, skinned to the existing joint groups,
   so the body deforms as a single mesh with no visible segment joins.
   Canonical geometry is baked ONCE and shared; each character gets its own skeleton + materials. */

const BODY = { geo:null, order:[
  'hips','torso','neck','shL','elL','shR','elR','hipL','knL','hipR','knR'
]};

// skinning segments (a,b) in bind space, index matches BODY.order
const _SEG = [
  [[0,0.90,0],[0,1.02,0]],          // 0 hips
  [[0,1.02,0],[0,1.47,0]],          // 1 torso/spine
  [[0,1.47,0],[0,1.60,0]],          // 2 neck
  [[0.22,1.495,0],[0.22,1.205,0]],  // 3 shL (upper arm)
  [[0.22,1.205,0],[0.22,0.94,0]],   // 4 elL (forearm)
  [[-0.22,1.495,0],[-0.22,1.205,0]],// 5 shR
  [[-0.22,1.205,0],[-0.22,0.94,0]], // 6 elR
  [[0.095,0.95,0],[0.095,0.52,0]],  // 7 hipL (thigh)
  [[0.095,0.52,0],[0.095,0.09,0]],  // 8 knL (shin)
  [[-0.095,0.95,0],[-0.095,0.52,0]],// 9 hipR
  [[-0.095,0.52,0],[-0.095,0.09,0]],//10 knR
];
// surface capsules (a,b,radius) — fatter, blended into one body
const _CAP = [
  [[0,0.90,0],[0,1.02,0],0.142],    // pelvis
  [[0,1.00,0],[0,1.20,0],0.132],    // lower torso (waist)
  [[0,1.18,0],[0,1.44,0],0.172],    // chest
  [[0,1.42,0],[0,1.575,0],0.052],   // neck
  [[0.205,1.49,0],[0.22,1.205,0],0.058],[[0.22,1.205,0],[0.225,0.95,0],0.046],  // L arm
  [[-0.205,1.49,0],[-0.22,1.205,0],0.058],[[-0.22,1.205,0],[-0.225,0.95,0],0.046],// R arm
  [[0.095,0.96,0],[0.098,0.52,0],0.088],[[0.098,0.52,0],[0.10,0.10,0],0.055],    // L leg
  [[-0.095,0.96,0],[-0.098,0.52,0],0.088],[[-0.098,0.52,0],[-0.10,0.10,0],0.055],// R leg
];

function _distSeg(px,py,pz,a,b){
  const abx=b[0]-a[0],aby=b[1]-a[1],abz=b[2]-a[2];
  const apx=px-a[0],apy=py-a[1],apz=pz-a[2];
  let t=(apx*abx+apy*aby+apz*abz)/(abx*abx+aby*aby+abz*abz);
  t=t<0?0:t>1?1:t;
  const dx=apx-abx*t,dy=apy-aby*t,dz=apz-abz*t;
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

function bakeCanonBody(res){
  const C=[0,0.85,0], H=0.9;                    // cubic field: body-space = C + v*H, v in [-1,1]
  const mc = new MarchingCubes(res, new THREE.MeshStandardMaterial(), false, false, 300000);
  const S = mc.size, F = mc.field, eps=1e-5;
  F.fill(0);
  // density = Σ (r²/d²)²  ; surface at iso=1 sits at d≈r per capsule, squared term limits bleed, sums blend joints
  for(let z=0;z<S;z++){ const bz=C[2]+(2*z/(S-1)-1)*H;
    for(let y=0;y<S;y++){ const by=C[1]+(2*y/(S-1)-1)*H; const row=y*S+z*S*S;
      for(let x=0;x<S;x++){ const bx=C[0]+(2*x/(S-1)-1)*H;
        let dens=0;
        for(let k=0;k<_CAP.length;k++){ const cp=_CAP[k];
          const d=_distSeg(bx,by,bz,cp[0],cp[1]); const q=cp[2]*cp[2]/(d*d+eps); dens+=q*q; }
        F[x+row]=dens;
      } } }
  mc.isolation = 1.0; mc.update();
  const rawN = mc.count|0, pa = mc.positionArray;
  // ---- weld vertices (marching cubes emits a triangle soup) ----
  const vmap=new Map(), vx=[],vy=[],vz=[], tri=new Uint32Array(rawN);
  for(let i=0;i<rawN;i++){
    const x=C[0]+pa[i*3]*H, y=C[1]+pa[i*3+1]*H, z=C[2]+pa[i*3+2]*H;
    const key=((x*1e4+0.5)|0)+'_'+((y*1e4+0.5)|0)+'_'+((z*1e4+0.5)|0);
    let id=vmap.get(key);
    if(id===undefined){ id=vx.length; vmap.set(key,id); vx.push(x); vy.push(y); vz.push(z); }
    tri[i]=id;
  }
  const V=vx.length;
  // ---- laplacian smoothing (2 rounds) to remove voxel stair-stepping ----
  const nbr=Array.from({length:V},()=>[]);
  for(let t=0;t<rawN;t+=3){ const a=tri[t],b=tri[t+1],c=tri[t+2];
    nbr[a].push(b,c); nbr[b].push(a,c); nbr[c].push(a,b); }
  for(let round=0;round<2;round++){
    const nx=new Float32Array(V), ny=new Float32Array(V), nz=new Float32Array(V);
    for(let i=0;i<V;i++){
      const nn=nbr[i]; if(!nn.length){ nx[i]=vx[i];ny[i]=vy[i];nz[i]=vz[i]; continue; }
      let sx=0,sy=0,sz2=0; for(const j of nn){ sx+=vx[j]; sy+=vy[j]; sz2+=vz[j]; }
      const inv=1/nn.length, lam=0.62;
      nx[i]=vx[i]+(sx*inv-vx[i])*lam; ny[i]=vy[i]+(sy*inv-vy[i])*lam; nz[i]=vz[i]+(sz2*inv-vz[i])*lam;
    }
    for(let i=0;i<V;i++){ vx[i]=nx[i]; vy[i]=ny[i]; vz[i]=nz[i]; }
  }
  // ---- per-vertex skin weights + region (0=legs,1=top) ----
  const si=new Float32Array(V*4), sw=new Float32Array(V*4), region=new Uint8Array(V);
  for(let i=0;i<V;i++){
    const x=vx[i],y=vy[i],z=vz[i];
    let b0=0,b1=0,d0=1e9,d1=1e9;
    for(let s=0;s<_SEG.length;s++){ const d=_distSeg(x,y,z,_SEG[s][0],_SEG[s][1]);
      if(d<d0){ d1=d0;b1=b0; d0=d;b0=s; } else if(d<d1){ d1=d;b1=s; } }
    const w0=1/(d0*d0+1e-4), w1=1/(d1*d1+1e-4), ws=w0+w1;
    si[i*4]=b0; si[i*4+1]=b1;
    sw[i*4]=w0/ws; sw[i*4+1]=w1/ws;
    region[i] = (b0===0||b0===7||b0===8||b0===9||b0===10) ? 0 : 1;
  }
  // ---- index reordered into 2 contiguous groups (legs, top) ----
  const g0=[],g1=[];
  for(let t=0;t<rawN;t+=3){
    const legs=(region[tri[t]]?0:1)+(region[tri[t+1]]?0:1)+(region[tri[t+2]]?0:1);
    (legs>=2?g0:g1).push(tri[t],tri[t+1],tri[t+2]);
  }
  const P=new Float32Array(V*3);
  for(let i=0;i<V;i++){ P[i*3]=vx[i]; P[i*3+1]=vy[i]; P[i*3+2]=vz[i]; }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P,3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si,4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw,4));
  geo.setIndex(g0.concat(g1));
  geo.computeVertexNormals();                     // welded + indexed -> genuinely smooth shading
  geo.addGroup(0,g0.length,0);                    // legs -> material 0
  geo.addGroup(g0.length,g1.length,1);            // top  -> material 1
  return geo;
}

/* Build + attach a seamless body. root already holds the joint groups (bones).
   Call at the END of mkPerson, AFTER root.scale is set. bones = 11 groups in BODY.order. */
function attachSkinnedBody(o, root, bones, bodyMat){
  try{
    if(!BODY.geo) BODY.geo = bakeCanonBody(G.isTouch?48:72);
    const metallicBody = (o.skinMetal||0) > 0.4;   // Cybermen: keep clean metal, no weave
    const legMat = o.skirt ? M(o.skin,o.skinRough,o.skinMetal)
                 : metallicBody ? M(o.trousers,0.4,0.85)
                 : TM(o.trousers,0.88,0,'fabric',7,7,0.5);
    const topMat = bodyMat || (metallicBody ? M(o.jacket??o.top,0.38,0.85)
                 : TM(o.jacket??o.top, 0.88, 0.02, 'fabric',7,7,0.5));
    const mesh = new THREE.SkinnedMesh(BODY.geo, [legMat, topMat]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    root.add(mesh);
    root.updateMatrixWorld(true);            // bones + mesh world matrices current
    mesh.bind(new THREE.Skeleton(bones));    // captures bindMatrix = mesh.matrixWorld, boneInverses from bones
    return mesh;
  }catch(e){ console.error('skinned body failed', e); return null; }
}
