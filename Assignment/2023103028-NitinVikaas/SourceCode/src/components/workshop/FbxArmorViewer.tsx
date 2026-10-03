import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

export function FbxArmorViewer({reactorPowered=false}:{reactorPowered?:boolean}){
  const hostRef=useRef<HTMLDivElement>(null);
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [autoRotate,setAutoRotate]=useState(true);
  const autoRotateRef=useRef(autoRotate);

  useEffect(()=>{autoRotateRef.current=autoRotate},[autoRotate]);

  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(38,1,.01,100);
    camera.position.set(0,.2,6);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.45;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFShadowMap;
    host.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.enablePan=false;
    controls.minDistance=2.5;
    controls.maxDistance=8;
    controls.target.set(0,0,0);

    scene.add(new THREE.HemisphereLight(0x9cf7ff,0x071014,2.2));
    const keyLight=new THREE.DirectionalLight(0xd9fbff,4.2);
    keyLight.position.set(3,5,4);
    keyLight.castShadow=true;
    scene.add(keyLight);
    const rimLight=new THREE.PointLight(0x00e5ff,18,8);
    rimLight.position.set(-3,2,-2);
    scene.add(rimLight);

    const floor=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshBasicMaterial({color:0x071014,transparent:true,opacity:.85}));
    floor.rotation.x=-Math.PI/2;
    floor.position.y=-1.52;
    scene.add(floor);
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.45,1.49,96),new THREE.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:.6,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;
    ring.position.y=-1.5;
    scene.add(ring);

    const loader=new FBXLoader();
    let model:THREE.Group|undefined;
    loader.load('/Iron_Man_Mark_44_Hulkbuster_fbx.fbx',loaded=>{
      loaded.updateMatrixWorld(true);
      const flattened=new THREE.Group();
      const armorMaterial=new THREE.MeshStandardMaterial({color:0x9bbac0,metalness:.88,roughness:.22,emissive:0x071014,emissiveIntensity:.35});
      const reactorMaterial=new THREE.MeshStandardMaterial({color:0x00e5ff,metalness:.55,roughness:.16,emissive:0x00e5ff,emissiveIntensity:2.2});
      loaded.traverse(child=>{
        if(child instanceof THREE.Mesh){
          const geometry=child.geometry.clone();
          geometry.applyMatrix4(child.matrixWorld);
          const isReactor=reactorPowered&&/reactor|arc[_ -]?core|power[_ -]?core/i.test(child.name);
          const mesh=new THREE.Mesh(geometry,isReactor?reactorMaterial:armorMaterial);
          mesh.castShadow=true;
          mesh.receiveShadow=true;
          flattened.add(mesh);
        }
      });
      model=flattened;
      const bounds=new THREE.Box3().setFromObject(model);
      const size=bounds.getSize(new THREE.Vector3());
      const center=bounds.getCenter(new THREE.Vector3());
      const maxSize=Math.max(size.x,size.y,size.z)||1;
      model.position.sub(center);
      model.scale.setScalar(3/maxSize);
      model.position.y=-.05;
      scene.add(model);
      const normalizedBounds=new THREE.Box3().setFromObject(model);
      const normalizedCenter=normalizedBounds.getCenter(new THREE.Vector3());
      const normalizedSize=normalizedBounds.getSize(new THREE.Vector3());
      model.position.sub(normalizedCenter);
      model.position.y-=.05;
      const fitHeight=Math.max(normalizedSize.y,2.4);
      const fitDistance=(fitHeight*.5)/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
      camera.position.set(0,fitHeight*.08,fitDistance*1.35);
      camera.near=Math.max(.01,fitDistance/100);
      camera.far=fitDistance*20;
      camera.updateProjectionMatrix();
      setStatus('ready');
    },undefined,()=>setStatus('error'));

    const resize=()=>{
      const width=host.clientWidth||640;
      const height=host.clientHeight||520;
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height,false);
    };
    const observer=new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let frame=0;
    const animate=()=>{
      frame=requestAnimationFrame(animate);
      if(model&&autoRotateRef.current)model.rotation.y+=.0018;
      controls.update();
      renderer.render(scene,camera);
    };
    animate();
    return()=>{
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse(object=>{
        if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose())}
      });
    };
  },[reactorPowered]);

  return <div className="relative h-[520px] min-h-[420px] overflow-hidden rounded border border-accent/15 bg-[#05080A] sm:h-[620px]" ref={hostRef}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,229,255,.14),transparent_34%),linear-gradient(180deg,rgba(10,26,32,.18),rgba(2,4,12,.7))]"/>
    <div className="pointer-events-none absolute left-4 top-4 z-10"><div className="badge text-accent">LIVE ARMOR SCHEMATIC</div><div className="mt-1 text-xs text-slate-500">MARK 44 / DRAG TO INSPECT</div></div>
    <button type="button" onClick={()=>setAutoRotate(value=>!value)} className="btn focus-ring absolute right-4 top-4 z-10 px-3 py-2 text-[10px] text-slate-300">{autoRotate?'PAUSE ROTATION':'RESUME ROTATION'}</button>
    <div className="pointer-events-none absolute bottom-4 right-4 z-10 badge text-slate-600">FBX ASSET / LOCAL</div>
    {status==='loading'&&<div className="pointer-events-none absolute inset-0 z-10 grid place-items-center"><div className="badge text-accent">LOADING ARMOR MODEL...</div></div>}
    {status==='error'&&<div className="absolute inset-0 z-10 grid place-items-center p-6 text-center"><div><div className="badge text-accent">MODEL LOAD FAILED</div><p className="mt-2 max-w-xs text-sm text-slate-500">The armor schematic could not be loaded. The component map remains available below.</p></div></div>}
  </div>;
}
