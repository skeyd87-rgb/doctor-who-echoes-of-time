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
  [[0,0.90,0],[0,1.02,0],0.155],    // pelvis
  [[0,1.00,0],[0,1.20,0],0.150],    // lower torso
  [[0,1.18,0],[0,1.44,0],0.190],    // chest
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
  const N = mc.count|0, pa = mc.positionArray;
  const pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){
    pos[i*3]   = C[0]+pa[i*3]*H;
    pos[i*3+1] = C[1]+pa[i*3+1]*H;
    pos[i*3+2] = C[2]+pa[i*3+2]*H;
  }
  // per-vertex skin weights + region (0=legs,1=top)
  const si=new Float32Array(N*4), sw=new Float32Array(N*4); const region=new Uint8Array(N);
  for(let i=0;i<N;i++){
    const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2];
    let b0=0,b1=0,d0=1e9,d1=1e9;
    for(let s=0;s<_SEG.length;s++){ const d=_distSeg(x,y,z,_SEG[s][0],_SEG[s][1]);
      if(d<d0){ d1=d0;b1=b0; d0=d;b0=s; } else if(d<d1){ d1=d;b1=s; } }
    const w0=1/(d0*d0+1e-4), w1=1/(d1*d1+1e-4), ws=w0+w1;
    si[i*4]=b0; si[i*4+1]=b1;
    sw[i*4]=w0/ws; sw[i*4+1]=w1/ws;
    region[i] = (b0===0||b0===7||b0===8||b0===9||b0===10) ? 0 : 1;   // pelvis+legs = trousers
  }
  // reorder triangles into 2 contiguous groups (legs, top) for 2-material coloring
  const triN=N/3; const g0=[],g1=[];
  for(let t=0;t<triN;t++){ const a=t*3,b=a+1,c=a+2;
    const legs=(region[a]?0:1)+(region[b]?0:1)+(region[c]?0:1); // count region0 verts
    (legs>=2?g0:g1).push(t);
  }
  const order=g0.concat(g1);
  const P=new Float32Array(N*3),SI=new Float32Array(N*4),SW=new Float32Array(N*4);
  for(let k=0;k<order.length;k++){ const t=order[k];
    for(let j=0;j<3;j++){ const from=(t*3+j), to=(k*3+j);
      P[to*3]=pos[from*3]; P[to*3+1]=pos[from*3+1]; P[to*3+2]=pos[from*3+2];
      for(let m=0;m<4;m++){ SI[to*4+m]=si[from*4+m]; SW[to*4+m]=sw[from*4+m]; }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P,3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(SI,4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(SW,4));
  geo.computeVertexNormals();
  const c0=g0.length*3;
  geo.addGroup(0,c0,0);          // legs -> material 0
  geo.addGroup(c0,g1.length*3,1);// top  -> material 1
  return geo;
}

/* Build + attach a seamless body. root already holds the joint groups (bones).
   Call at the END of mkPerson, AFTER root.scale is set. bones = 11 groups in BODY.order. */
function attachSkinnedBody(o, root, bones, bodyMat){
  try{
    if(!BODY.geo) BODY.geo = bakeCanonBody(G.isTouch?48:72);
    const legMat = o.skirt ? M(o.skin,o.skinRough,o.skinMetal) : M(o.trousers,0.85,0);
    const topMat = bodyMat || M(o.jacket??o.top, 0.85, 0.02);
    const mesh = new THREE.SkinnedMesh(BODY.geo, [legMat, topMat]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    root.add(mesh);
    root.updateMatrixWorld(true);            // bones + mesh world matrices current
    mesh.bind(new THREE.Skeleton(bones));    // captures bindMatrix = mesh.matrixWorld, boneInverses from bones
    return mesh;
  }catch(e){ console.error('skinned body failed', e); return null; }
}
