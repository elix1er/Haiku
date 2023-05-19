/*
<script type="importmap">
{
    "imports": {
        "three": "https://unpkg.com/three@0.138.0/build/three.module.js"
    }
}
</script>
*/

import * as THREE from './three/three.module.js';

import AnchorLink from 'anchor-link'
import AnchorLinkBrowserTransport from 'anchor-link-browser-transport'
import * as waxjs from "@waxio/waxjs/dist";
import {ExplorerApi, RpcApi, deserialize} from "atomicassets"
import { base58_to_binary } from "base58-js";




/*
import { MTLLoader } from './three/examples/jsm/loaders/MTLLoader.js';
import { MTLLoaderP } from './three/examples/jsm/loaders/MTLLoaderP.js';
import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader.js';
*/
/*
import { EffectComposer } from '/assets/js/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/assets/js/three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from '/assets/js/three/examples/jsm/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from '/assets/js/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from '/assets/js/three/examples/jsm/postprocessing/OutlinePass.js';
import { SAOPass } from '/assets/js/three/examples/jsm/postprocessing/SAOPass.js';
import { SSAOPass } from '/assets/js/three/examples/jsm/postprocessing/SSAOPass.js';
import { BokehPass } from '/assets/js/three/examples/jsm/postprocessing/BokehPass.js';
*/

import { ParticleEngine, Tween, Type } from './three/ParticleEngine.js';


const sleep = m => new Promise(r => setTimeout(r, m));


const meshsInfos = { 'car2': { suspensionRestLength: 0.6, rollInfluence: 0.5, wheelRadius : 0.3 , wheelWidth : 0.2, extents : {size:{x:1.5025140047073364,y:1.2076700329780579,z:3.6953179836273193}, center :{x:0,y:0.18090900778770447,"z":-0.19572603702545166}}}, 
                     'car3': { suspensionRestLength: 0.4, rollInfluence: 0.1, wheelRadius : 0.3 , wheelWidth : 0.2, extents : {"size":{"x":1.7839179635047913,"y":1.4801300466060638,"z":4.243614077568054},"center":{"x":0.0356920063495636,"y":0.4461500197649002,"z":-0.18802005052566528}}},
                     'car4': { suspensionRestLength: 0.2, rollInfluence: 0.1, wheelRadius : 0.3 , wheelWidth : 0.2, extents : {"size":{"x":1.7839179635047913,"y":1.4801300466060638,"z":4.243614077568054},"center":{"x":0.0356920063495636,"y":0.4461500197649002,"z":-0.18802005052566528}}},
                     'buggy': { suspensionRestLength: 0.6, rollInfluence: 0.1, wheelRadius : 0.3 , wheelWidth : 0.2, extents : {size:{x:1.755288004875183,y:1.4563030004501343,z:3.0623929500579834},center:{x:0.02275097370147705,y:-0.12212505340576172,z:0.01649951934814453}}},
                     'car5': { suspensionRestLength: 0.2, rollInfluence: 0.1, wheelRadius : 0.3 , wheelWidth : 0.2, extents : {"size":{"x":1.7839179635047913,"y":1.4801300466060638,"z":4.243614077568054},"center":{"x":0.0356920063495636,"y":0.4461500197649002,"z":-0.18802005052566528}}},
                     'buggyB': { suspensionRestLength: 0.7, rollInfluence: 0.4, wheelRadius : 0.4 , wheelWidth : 0.4, extents : {"size":{"x":2.0623510479927063,"y":1.693336009979248,"z":3.5725289583206177},"center":{"x":0.06175550818443298,"y":0.29022300243377686,"z":0.17158550024032593}}}, 
                     'lambo': { suspensionRestLength: 0.4, rollInfluence: 0.5, wheelRadius : 0.5 , wheelWidth : 0.4 , extents : {"size":{"x":2.007147967815399,"y":1.115267038345337,"z":4.371685147285461},"center":{"x":0.0113619863986969,"y":0.08561050891876221,"z":0.3787035346031189}}} , 
                     'terradyne': { suspensionRestLength: 0.5, rollInfluence: 0.5 , wheelRadius : 0.5 , wheelWidth : 0.4, extents : {"size":{"x":1.761555016040802,"y":1.4558640103787184,"z":3.8780161142349243},"center":{"x":0.0038565099239349365,"y":0.7340140054002404,"z":-0.07079905271530151}} }};

const alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const candle_params =
	{
		positionStyle  : Type.SPHERE,
		positionBase   : new THREE.Vector3( 0, 50, 0 ),
		positionRadius : 15,
		
		velocityStyle  : Type.CUBE,
		velocityBase   : new THREE.Vector3(0,20,0),
		velocitySpread : new THREE.Vector3(20,0,20),
		
		particleTexture :  new THREE.TextureLoader().load( 'https://crazy-cars.io/assets/textures/smokeparticle.png' ),
		
        sizeBase     : 1,
        sizeSpread   : 3,
		sizeTween    : new Tween( [0, 0.3, 1.2], [8, 25, 12] ),
		opacityTween : new Tween( [0.9, 1.5], [1, 0] ),
		colorTween   : new Tween( [0.5, 1.0], [ new THREE.Vector3(0.02, 1, 0.5), new THREE.Vector3(0.05, 1, 0) ] ),
		blendStyle : THREE.AdditiveBlending,  
		
		particlesPerSecond : 20,
		particleDeathAge   : 2.5,		
		emitterDeathAge    : 300
	}

var SoundCfg = {
    musicVolume: 50,
    sfxVolume: 50,
    engineVolume: 50
};


function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function getTimeTxt(t) {
    var hours = 0;
    var mins = 0;

    if (t >= 3600)
        hours = parseInt(t / 3600);

    if (t >= 60)
        mins = parseInt((t % 3600) / 60);

    var secs = parseInt(t % 60);

    var txt = '';

    if (hours > 0) {

        if (hours > 1)
            txt += hours + ' hrs ';
        else
            txt += hours + ' hr ';
    }


    if (mins > 1)
        txt += mins + ' mins ';
    else
        txt += mins + ' min ';


    return txt;
}

class Car {

    constructor(id, carDef, carPos, carQuat) {
        this.wheels = [];
        this.skidPlanes = [];
        this.ChassisMesh = null;
        this.massVehicle = 0;
        this.speed = 0;
        this.contacts = [];
        this.nitroSpheres = [];
        this.pos = carPos.clone();
        this.quat = carQuat.clone();
        this.scale = new THREE.Vector3(1,1,1);
        this.remainingTime = -1;
        this.carDef = carDef;
        this.id = id;
        this.maxdmg = carDef.maxdmg;

    }
    addContact(p, dmg, now) {
        this.contacts.push({ 'pos': p, 'dmg': dmg, 'time': now, 'object': null });
    }

    addSkidding(p, norm, skid, now) {

        this.skidPlanes.push({ object: null, pos: p, normal: norm, skid: skid, time: now });
    }
    
    updateWheels()
    {
        this.wheelRadius= 0.3;
        this.wheelWidth = 0.2;

        this.wheelAxisPositionBack = -this.chassisLength * 0.4 + this.wheelRadius;
        this.wheelRadiusBack = this.wheelRadius;
        this.wheelWidthBack = this.wheelWidth;
        this.wheelHalfTrackBack = this.chassisWidth / 2 + this.wheelWidth / 2;
        this.wheelAxisHeightBack = -.1;
    
        this.wheelAxisFrontPosition = this.chassisLength * 0.4 - this.wheelRadius;
        this.wheelRadiusFront = this.wheelRadius;
        this.wheelWidthFront = this.wheelWidth;
        this.wheelHalfTrackFront = this.chassisWidth / 2 + this.wheelWidth / 2;
        this.wheelAxisHeightFront = -0.1;

        this.wheels[0]={ isFront: true, pos: { x:  -this.wheelHalfTrackFront, y:  + this.wheelAxisHeightFront, z:  + this.wheelAxisFrontPosition },quat: {x:this.quat.x,y:this.quat.y,z:this.quat.z,w:this.quat.w},radius: this.wheelRadiusFront, width: this.wheelWidthFront , scale : {x: 1,y:1,z:1}};
        this.wheels[1]={ isFront: true, pos: { x:  + this.wheelHalfTrackFront, y:  + this.wheelAxisHeightFront, z:  + this.wheelAxisFrontPosition }, quat: {x:this.quat.x,y:this.quat.y,z:this.quat.z,w:this.quat.w},radius: this.wheelRadiusFront, width: this.wheelWidthFront , scale : {x:-1,y:1,z:1}};
        this.wheels[2]={ isFront: false, pos: { x:  + this.wheelHalfTrackBack, y:  + this.wheelAxisHeightBack, z:  + this.wheelAxisPositionBack },   quat: {x:this.quat.x,y:this.quat.y,z:this.quat.z,w:this.quat.w},radius: this.wheelRadiusBack, width: this.wheelWidthBack   , scale : {x:-1,y:1,z:1}};
        this.wheels[3]={ isFront: false, pos: { x:  - this.wheelHalfTrackBack, y:  + this.wheelAxisHeightBack, z:  + this.wheelAxisPositionBack },  quat: {x:this.quat.x,y:this.quat.y,z:this.quat.z,w:this.quat.w},radius: this.wheelRadiusBack, width: this.wheelWidthBack   , scale : {x: 1,y:1,z:1}};


    }
    

    id;
    carDef;
    maxdmg;
    massVehicle;
    speed;
    pos;
    quat;

    ChassisMesh;
    wheels;

    skidPlanes;
    contacts;
    nitroSpheres;
    remainingTime;
}

class Track {

    constructor(npts) {
        this.trackPoints = [];
        this.roadObj = null;
        this.walls = [];
        this.woods = [];
        this.bonuses = [];
        this.jumpers = [];
        this.turrets = [];
        this.springs = [];
        this.ropes = [];
        this.loopings = [];
        this.worms = [];
        this.tubes = [];
        this.waves= [];
        this.plateform = null;

        this.lastId = 1;

        this.NPoints = npts;
        this.lapTime = 60;

        this.Zv = new THREE.Vector3(1, 0, 0);
        this.Uv = new THREE.Vector3(0, 1, 0);




        this.SphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

        this.sphereShot = new THREE.SphereGeometry(1, 32, 16);

        this.HM = null;
    }

    getCenter()
    {
        let min = null;
        let max = null;

        for(let n = 0; n<this.trackPoints.length;n++)
        {
            if(min == null)
                min= [this.trackPoints[n].pos.x,this.trackPoints[n].pos.y,this.trackPoints[n].pos.z];
            else
                min= [Math.min(this.trackPoints[n].pos.x, min[0]),Math.min(this.trackPoints[n].pos.y, min[1]), Math.min(this.trackPoints[n].pos.z, min[2])];

            if(max== null)
                max= [this.trackPoints[n].pos.x,this.trackPoints[n].pos.y,this.trackPoints[n].pos.z];
            else
                max= [Math.max(this.trackPoints[n].pos.x, max[0]),Math.max(this.trackPoints[n].pos.y, max[1]), Math.max(this.trackPoints[n].pos.z, max[2])];
        }

        const sz=[max[0]-min[0], max[1]-min[1], max[2]-min[2]];
        const hsz = [sz[0]/2,sz[1]/2,sz[2]/2];

        return {x: min[0]+hsz[0] , y: min[1]+hsz[1], z: min[2]+hsz[2]};
    }

    doCenter()
    {
        const c = this.getCenter();
        this.terrain.offset = {x : -c.x, y:-c.y, z:-c.z};
        for(let n = 0; n<this.trackPoints.length;n++)
        {
            this.trackPoints[n].pos.x -= c.x;
            this.trackPoints[n].pos.y -= c.y;
            this.trackPoints[n].pos.z -= c.z;    
        }
    }


    addWave(ptId, amplitude, frequency, phase, npts)
    {
        this.waves.push({ id: this.lastId++, idx: ptId, amplitude: amplitude, frequency: frequency, phase: phase, npts: npts })
    }

    addLooping(ptId, height, dir, npts, hide) {
        this.loopings.push({ id: this.lastId++, idx: ptId, height: height, dir: dir, npts: npts, hide: hide })
    }
    addWorm(ptId, height, dir, npts) {
        this.worms.push({ id: this.lastId++, idx: ptId, height: height, dir: dir, npts: npts })
    }
    addTube(ptId, height, width, dir, npts) {
        this.tubes.push({ id: this.lastId++, idx: ptId, height: height, width: width, dir: dir, npts: npts })
    }

    getWave(ptId) {
        for (let n = 0; n < this.waves.length; n++) {
            if (this.waves[n].idx == ptId)
                return this.waves[n];
        }
        return null;
    }

    getLooping(ptId) {
        for (let n = 0; n < this.loopings.length; n++) {
            if (this.loopings[n].idx == ptId)
                return this.loopings[n];
        }
        return null;
    }

    getWorm(ptId) {
        for (let n = 0; n < this.worms.length; n++) {
            if (this.worms[n].idx == ptId)
                return this.worms[n];
        }
        return null;
    }

    getTube(ptId) {
        for (let n = 0; n < this.tubes.length; n++) {
            if (this.tubes[n].idx == ptId)
                return this.tubes[n];
        }
        return null;
    }




    getSidePoint(p1, p2) {
        var rotat = new THREE.Quaternion().setFromAxisAngle(this.Uv, 3.14 / 2);

        var diff = new THREE.Vector3().subVectors(p2, p1);
        var ndiff = diff.clone().normalize();

        var qrot = new THREE.Quaternion();
        qrot.setFromUnitVectors(this.Zv, ndiff); // (unit vectors)
        qrot.multiply(rotat);

        var np = this.Zv.clone().applyQuaternion(qrot);
        np.y = 0;
        return np;
    }

    /*
    getMidPts(p1, p2) {
        var diffL = p2.clone().sub(p1);
        var nDiff = diffL.clone().normalize();

        var eul = new THREE.Euler(0, Math.atan2(nDiff.x, nDiff.z), 0, "XYZ");
        var wallRot = new THREE.Quaternion().setFromEuler(eul);
        var wallPos = diffL.clone().divideScalar(2).add(p1)

        return { pos: wallPos, rot: wallRot, eul: eul, len: diffL.length() };
    }
    */

    
  getMidPts(p1, p2, dir) {
    var diffL = p2.clone().sub(p1);
    var nDiff = diffL.clone().normalize();


    var eul = new THREE.Euler(0, Math.atan2(nDiff.x, nDiff.z), 0, "XYZ");

    if(dir == -1)
        eul.y += Math.PI;

    var wallRot = new THREE.Quaternion().setFromEuler(eul);
    

    var wallPos = diffL.clone().divideScalar(2).add(p1)

    return { pos: wallPos, quat: wallRot, eul: eul, len: diffL.length() };

  }

    createTrackWalls() {
        this.walls = [];

        if (this.trackPoints.length < 2)
            return;

           for (let n = 0; n < this.NPoints - 1; n++) {
            var pos1L = this.curveL.getPoint(n / this.NPoints);
            var pos1R = this.curveR.getPoint(n / this.NPoints);
            var pos2L;
            var pos2R;

            if (n < this.NPoints) {
                pos2L = this.curveL.getPoint((n + 1) / this.NPoints);
                pos2R = this.curveR.getPoint((n + 1) / this.NPoints);
            }
            else {
                pos2L = this.curveL.getPoint(0);
                pos2R = this.curveR.getPoint(0);
            }

            var ptsL = this.getMidPts(pos1L, pos2L, 1);
            var ptsR = this.getMidPts(pos1R, pos2R, -1);

            ptsL.boxSize = new THREE.Vector3(0.25, 7, ptsL.len);
            ptsR.boxSize = new THREE.Vector3(0.25, 7, ptsR.len);

            this.walls.push(ptsL);
            this.walls.push(ptsR);
        }
    }

    



    

    createTrackMesh(uvPos, uvScale) {
        if (this.trackPoints.length < 2)
            return null;

        var yOfset = 0.5;
        var curvePointsL = [];
        var curvePointsR = [];
        var np1;
        let npos = null;

        for (let n = 0; n < this.trackPoints.length; n++) {
            var p1, p2, w;


            if (npos === null)
                p1 = this.trackPoints[n].pos;
            else {
                p1 = npos;
                npos = null;
            }

            if (n < this.trackPoints.length - 1) {
                p2 = this.trackPoints[n + 1].pos;
            }
            else {
                p2 = this.trackPoints[0].pos;
            }

            var diffL = p2.clone().sub(p1);
            var nDiff = diffL.clone().normalize();

            this.trackPoints[n].rot = new THREE.Quaternion();
            this.trackPoints[n].rot.setFromUnitVectors(this.Zv, nDiff); // (unit vecto                
            this.trackPoints[n].length = p1.distanceTo(p2);

            const np = this.getSidePoint(p1, p2);
            np1 = np.clone().multiplyScalar(this.trackPoints[n].width);

            var pos1 = new THREE.Vector3().addVectors(p1, np1);
            var pos2 = new THREE.Vector3().subVectors(p1, np1);

            this.trackPoints[n].l = pos1.clone();
            this.trackPoints[n].r = pos2.clone();


            curvePointsL.push(pos1);
            curvePointsR.push(pos2);

            const looping = this.getLooping(n);
            const worm = this.getWorm(n);
            const tube = this.getTube(n);
            const wave = this.getWave(n);

            if (looping) {

                const nextId = ((n + 2) < this.trackPoints.length) ? n + 1 : 0;
                const sz = this.trackPoints[n].width;
                const sz2 = this.trackPoints[nextId].width;

                const p1 = new THREE.Vector3(this.trackPoints[n].pos.x, this.trackPoints[n].pos.y, this.trackPoints[n].pos.z);
                const p2 = new THREE.Vector3(this.trackPoints[nextId].pos.x, this.trackPoints[nextId].pos.y, this.trackPoints[nextId].pos.z);

                const size = new THREE.Vector3().subVectors(p2, p1);

                const halfSz = size.clone().divideScalar(2);
                const l = Math.sqrt(halfSz.x * halfSz.x + halfSz.z * halfSz.z);
                const delta = new THREE.Vector3().subVectors(p2, p1).divideScalar(looping.npts);
                const rot = this.trackPoints[n].rot.clone();
                const dz = (sz2 - sz);
                const nBonus = 5;
                const scale = 4;

                looping.min = [10000, 10000, 10000];
                looping.max = [-10000, -10000, -10000];

                looping.bonuses = [];

                let lpos1, lpos2;

                for (let i = 0; i <= looping.npts; i++) {
                    const a = (i * Math.PI * 2.0) / looping.npts + Math.PI / 2;
                    const pt = new THREE.Vector3((l - (Math.cos(a) * l)) * looping.dir, (-Math.sin(a)) * looping.height / 2 + looping.height / 2, (sz * 3 * (1.0 - i / looping.npts) - sz * 3) * looping.dir);
                    const norm = new THREE.Vector3(Math.cos(a) * 2, Math.sin(a) * 2, 0);
                    const dd = new THREE.Vector3().addVectors(pt, norm);

                    pt.applyQuaternion(rot);
                    dd.applyQuaternion(rot);

                    pt.add(p1);

                    if (i % nBonus == 0)
                        looping.bonuses.push({ ptIdx: n, offset: dd, type: 0, time: 0, scale: scale });

                    lpos1 = new THREE.Vector3().addVectors(pt, np1);
                    lpos2 = new THREE.Vector3().subVectors(pt, np1);

                    curvePointsL.push(lpos1);
                    curvePointsR.push(lpos2);

                    const min = [Math.min(lpos2.x, lpos1.x), Math.min(lpos2.y, lpos1.y), Math.min(lpos2.z, lpos1.z)];
                    const max = [Math.max(lpos2.x, lpos1.x), Math.max(lpos2.y, lpos1.y), Math.max(lpos2.z, lpos1.z)];

                    looping.min = [Math.min(looping.min[0], min[0]), Math.min(looping.min[1], min[1]), Math.min(looping.min[2], min[2])];
                    looping.max = [Math.max(looping.max[0], max[0]), Math.max(looping.max[1], max[1]), Math.max(looping.max[2], max[2])];
                }

                npos = new THREE.Vector3().lerpVectors(lpos1, lpos2, 0.5);

                const halfSize = new THREE.Vector3((looping.max[0] - looping.min[0]) / 2.0, (looping.max[1] - looping.min[1]), (looping.max[2] - looping.min[2]) / 2.0);
                looping.center = new THREE.Vector3(looping.min[0] + halfSize.x, looping.min[1] + halfSize.y / 2.0, looping.min[2] + halfSize.z);
            } else if (worm) {

                const nextId = ((n + 2) < this.trackPoints.length) ? n + 1 : 0;
                const sz = this.trackPoints[n].width;

                const p1 = new THREE.Vector3(this.trackPoints[n].pos.x, this.trackPoints[n].pos.y, this.trackPoints[n].pos.z);
                const p2 = new THREE.Vector3(this.trackPoints[nextId].pos.x, this.trackPoints[nextId].pos.y, this.trackPoints[nextId].pos.z);

                const size = new THREE.Vector3().subVectors(p2, p1);

                const l = size.length();
                const rot = this.trackPoints[n].rot.clone();
                const nBonus = 5;
                const scale = 4;

                worm.min = [10000, 10000, 10000];
                worm.max = [-10000, -10000, -10000];

                const c1 = 1.0;
                const c2 = 2.0;

                for (let i = 0; i <= worm.npts; i++) {
                    const a = (i * Math.PI * c1 + Math.PI * (2.0 - c1)) / worm.npts;
                    const a2 = (i * Math.PI * c2 + Math.PI * (2.0 - c2)) / worm.npts;

                    const eul1 = new THREE.Euler(-a, 0, 0, "ZYX");
                    const eul2 = new THREE.Euler(-a2, 0, 0, "ZYX");

                    const pos1 = new THREE.Vector3(i * l / worm.npts, 0, sz);
                    const pos2 = new THREE.Vector3(i * l / worm.npts, 0, sz + sz);

                    pos1.applyEuler(eul1);
                    pos2.applyEuler(eul2);

                    /*
                    pos1.y += ((Math.sin(a) + 1.0) / 2.0) * sz;
                    pos2.y += ((Math.sin(a) + 1.0) / 2.0) * sz;
                    */


                    pos1.applyQuaternion(rot);
                    pos2.applyQuaternion(rot);

                    pos1.add(p1);
                    pos2.add(p1);

                    /*
                    const norm = new THREE.Vector3(0, Math.cos(a) * 2, Math.sin(a) * 2);
                    const dd = new THREE.Vector3().addVectors(pt, norm);
                    dd.applyQuaternion(rot);


                    if (i % nBonus == 0)
                        this.bonusDefs.push({ ptIdx: n, offset: dd, type: 0, time: 0, scale: scale });
                    */

                    curvePointsL.push(pos1);
                    curvePointsR.push(pos2);

                    const min = [Math.min(pos2.x, pos1.x), Math.min(pos2.y, pos1.y), Math.min(pos2.z, pos1.z)];
                    const max = [Math.max(pos2.x, pos1.x), Math.max(pos2.y, pos1.y), Math.max(pos2.z, pos1.z)];

                    worm.min = [Math.min(worm.min[0], min[0]), Math.min(worm.min[1], min[1]), Math.min(worm.min[2], min[2])];
                    worm.max = [Math.max(worm.max[0], max[0]), Math.max(worm.max[1], max[1]), Math.max(worm.max[2], max[2])];

                }

                const halfSize = new THREE.Vector3((worm.max[0] - worm.min[0]) / 2.0, (worm.max[1] - worm.min[1]), (worm.max[2] - worm.min[2]) / 2.0);
                worm.center = new THREE.Vector3(worm.min[0] + halfSize.x, worm.min[1] + halfSize.y / 2.0, worm.min[2] + halfSize.z);
            } else if (tube) {



                const nextId = ((n + 2) < this.trackPoints.length) ? n + 1 : 0;
                const sz = this.trackPoints[n].width;

                const p1 = new THREE.Vector3(this.trackPoints[n].pos.x, this.trackPoints[n].pos.y, this.trackPoints[n].pos.z);
                const p2 = new THREE.Vector3(this.trackPoints[nextId].pos.x, this.trackPoints[nextId].pos.y, this.trackPoints[nextId].pos.z);

                const size = new THREE.Vector3().subVectors(p2, p1);

                const l = size.length() - sz * 4;
                const rot = this.trackPoints[n].rot.clone();
                const nBonus = 5;
                const scale = 4;

                tube.min = [10000, 10000, 10000];
                tube.max = [-10000, -10000, -10000];

                const c = 1.8
                const cs = -0.4;

                const ofset = -Math.sin(Math.PI * cs);
                const hpt = tube.npts / 2.0;

                for (let i = 0; i <= tube.npts; i++) {
                    const a = (i * Math.PI * c) / tube.npts + Math.PI * cs;
                    let z = Math.cos(a) * tube.width;

                    let zofs1 = 0;
                    let zofs2 = 0;

                    const coef = i < hpt ? (hpt - i) / hpt : 0;

                    const pos1 = new THREE.Vector3(i * l / tube.npts + sz * 2, (Math.sin(a) + ofset) * tube.height, z + zofs1);
                    const pos2 = new THREE.Vector3(i * l / tube.npts + sz * coef, (Math.sin(a) + ofset) * tube.height, z + zofs2 + sz * coef);

                    pos1.applyQuaternion(rot);
                    pos2.applyQuaternion(rot);

                    pos1.add(p1);
                    pos2.add(p1);

                    /*
                    const norm = new THREE.Vector3(0, Math.cos(a) * 2, Math.sin(a) * 2);
                    const dd = new THREE.Vector3().addVectors(pt, norm);
                    dd.applyQuaternion(rot);


                    if (i % nBonus == 0)
                        this.bonusDefs.push({ ptIdx: n, offset: dd, type: 0, time: 0, scale: scale });
                    */

                    curvePointsL.push(pos1);
                    curvePointsR.push(pos2);

                    const min = [Math.min(pos2.x, pos1.x), Math.min(pos2.y, pos1.y), Math.min(pos2.z, pos1.z)];
                    const max = [Math.max(pos2.x, pos1.x), Math.max(pos2.y, pos1.y), Math.max(pos2.z, pos1.z)];

                    tube.min = [Math.min(tube.min[0], min[0]), Math.min(tube.min[1], min[1]), Math.min(tube.min[2], min[2])];
                    tube.max = [Math.max(tube.max[0], max[0]), Math.max(tube.max[1], max[1]), Math.max(tube.max[2], max[2])];
                }

                const halfSize = new THREE.Vector3((tube.max[0] - tube.min[0]) / 2.0, (tube.max[1] - tube.min[1]), (tube.max[2] - tube.min[2]) / 2.0);
                tube.center = new THREE.Vector3(tube.min[0] + halfSize.x, tube.min[1] + halfSize.y / 2.0, tube.min[2] + halfSize.z);

            }else if (wave) {
                
                const nextId = ((n + 2) < this.trackPoints.length) ? n + 1 : 0;
                const sz = this.trackPoints[n].width;

                const p1 = new THREE.Vector3(this.trackPoints[n].pos.x, this.trackPoints[n].pos.y, this.trackPoints[n].pos.z);
                const p2 = new THREE.Vector3(this.trackPoints[nextId].pos.x, this.trackPoints[nextId].pos.y, this.trackPoints[nextId].pos.z);

                const size = new THREE.Vector3().subVectors(p2, p1);

                const l = size.length();
                const rot = this.trackPoints[n].rot.clone();

                wave.min = [10000, 10000, 10000];
                wave.max = [-10000, -10000, -10000];

                const shift = 1.4;

                for (let i = 1; i < wave.npts; i++) {

                    const yofs = (Math.sin(i * wave.frequency * Math.PI * 2 / wave.npts + wave.phase) + 1.0) * wave.amplitude;
                    const yofs2 = (Math.sin(i * wave.frequency * Math.PI * 2 / wave.npts + wave.phase + shift) + 1.0) * wave.amplitude;
                    const p = new THREE.Vector3().lerpVectors(p1, p2, i / wave.npts);

                    const pos1 = new THREE.Vector3().addVectors(p, np1);
                    const pos2 = new THREE.Vector3().subVectors(p, np1);

                    pos1.y += yofs;
                    pos2.y += yofs2;

                    curvePointsL.push(pos1);
                    curvePointsR.push(pos2);

                    const min = [Math.min(pos2.x, pos1.x), Math.min(pos2.y, pos1.y), Math.min(pos2.z, pos1.z)];
                    const max = [Math.max(pos2.x, pos1.x), Math.max(pos2.y, pos1.y), Math.max(pos2.z, pos1.z)];

                    wave.min = [Math.min(wave.min[0], min[0]), Math.min(wave.min[1], min[1]), Math.min(wave.min[2], min[2])];
                    wave.max = [Math.max(wave.max[0], max[0]), Math.max(wave.max[1], max[1]), Math.max(wave.max[2], max[2])];

                }

                const halfSize = new THREE.Vector3((wave.max[0] - wave.min[0]) / 2.0, (wave.max[1] - wave.min[1]), (wave.max[2] - wave.min[2]) / 2.0);
                wave.center = new THREE.Vector3(wave.min[0] + halfSize.x, wave.min[1] + halfSize.y / 2.0, wave.min[2] + halfSize.z);

            }
        }

        this.curveL = new THREE.CatmullRomCurve3(curvePointsL);
        this.curveR = new THREE.CatmullRomCurve3(curvePointsR);

        //this.curveL.closed= true;
        //this.curveR.closed= true;


        this.positions = [];
        this.indices = [];
        this.indices2 = [];
        this.texcoords = [];

        let yccoord = 0;

        let lastpos2 = null;
        let lastpos1 = null;

        const upVector= new THREE.Vector3(0,1,0);
        const wallLen = 4;

        for (let n = 0; n < this.NPoints; n++) {


            const posL = this.curveL.getPoint(n / this.NPoints);
            const posR = this.curveR.getPoint(n / this.NPoints);

            let pos2L, pos2R;

            if((n+1)<this.NPoints)
            {
                pos2L = this.curveL.getPoint((n+1) / this.NPoints);
                pos2R = this.curveR.getPoint((n+1) / this.NPoints);
            }else{
                pos2L = this.curveL.getPoint(0);
                pos2R = this.curveR.getPoint(0);
            }

            const diffL = new THREE.Vector3().subVectors(pos2L, posL  );
            const diffR = new THREE.Vector3().subVectors(pos2R, posR  );
            const latL = diffL.normalize().clone().cross(upVector).multiplyScalar(-wallLen).add(posL);
            const latR = diffR.normalize().clone().cross(upVector).multiplyScalar(wallLen).add(posR);

            latL.y += wallLen;
            latR.y += wallLen;


            if (lastpos2 != null) {
                const d = posL.distanceTo(lastpos1);
                const d2 = posR.distanceTo(lastpos2);

                this.texcoords.push(uvPos.x              , uvPos.y - yccoord);
                this.texcoords.push(uvPos.x + uvScale.x  , uvPos.y - yccoord);

                
                this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);
                this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);

                if (d > d2)
                    yccoord += d * uvScale.y / 4000;
                else
                    yccoord += d2 * uvScale.y / 4000;
            }


            lastpos1 = posL.clone();
            lastpos2 = posR.clone();

            this.positions.push(posL.x, posL.y, posL.z);
            this.positions.push(posR.x, posR.y, posR.z);

            this.positions.push(latL.x, latL.y, latL.z);
            this.positions.push(latR.x, latR.y, latR.z);
        }


        this.texcoords.push(uvPos.x, uvPos.y - yccoord);
        this.texcoords.push(uvPos.x + uvScale.x, uvPos.y - yccoord);

        
        this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);
        this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);

        const lposL = this.curveL.getPoint(0);
        const lposR = this.curveR.getPoint(0);


        const fdiffL = new THREE.Vector3().subVectors(lposL, lastpos1  );
        const fdiffR = new THREE.Vector3().subVectors(lposR, lastpos2  );
        const flatL = fdiffL.normalize().clone().cross(upVector).multiplyScalar(-wallLen).add(lposL);
        const flatR = fdiffR.normalize().clone().cross(upVector).multiplyScalar(wallLen).add(lposR);

        flatL.y += wallLen;
        flatR.y += wallLen;

        yccoord += this.trackPoints[this.trackPoints.length - 1].length * uvScale.y / 4000;
        yccoord = Math.ceil(yccoord);

        this.texcoords.push(uvPos.x, uvPos.y - yccoord);
        this.texcoords.push(uvPos.x + uvScale.x, uvPos.y - yccoord);
        
        this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);
        this.texcoords.push(uvPos.x + 1 , uvPos.y - yccoord);

        this.positions.push(lposL.x, lposL.y, lposL.z);
        this.positions.push(lposR.x, lposR.y, lposR.z);

        this.positions.push(flatL.x, flatL.y, flatL.z);
        this.positions.push(flatR.x, flatR.y, flatR.z);

        for (let n = 0; n < this.NPoints; n++) {
            let i1 = n * 4 + 0;
            let i2 = n * 4 + 1;

            let i3= (n + 1) * 4 + 0;
            let i4= (n + 1) * 4 + 1;

            this.indices.push(i1, i2, i3);
            this.indices.push(i4, i3, i2);
        }

        for (let n = 0; n < this.NPoints; n++) {
            let i1 = n * 4 + 0;
            let i2 = n * 4 + 2;

            let i3= (n + 1) * 4 + 0;
            let i4= (n + 1) * 4 + 2;

            this.indices2.push(i3, i2, i1);
            this.indices2.push(i2, i3, i4);

            i1 = n * 4 + 1;
            i2 = n * 4 + 3;

            i3= (n + 1) * 4 + 1;
            i4= (n + 1) * 4 + 3;

            this.indices2.push(i1, i2, i3);
            this.indices2.push(i4, i3, i2);
        }
    }


    makeWoods(wood, object = null) {
        const tpts = this.trackPoints[wood.ptIdx];
        const tpts2 = this.trackPoints[wood.ptIdx + 1];
        const diff = tpts2.pos.clone().sub(tpts.pos);
        const lPt = wood.radius * 2.2;
        const ndiff = diff.clone().normalize();

        const eul1 = new THREE.Euler(Math.PI / 2, 0, 0, "XYZ");
        const rot1 = new THREE.Quaternion().setFromEuler(eul1);

        wood.rot = tpts.rot.clone();
        wood.rot.multiply(rot1);


        const eul = new THREE.Euler().setFromQuaternion(wood.rot);
        var newWoods = [];

        wood.objects = [];

        for (let n = 0; n < wood.num; n++) {
            var woodMesh;
            if (object === null) {
                const t = new THREE.CylinderGeometry(wood.radius, wood.radius, wood.width, 24, 1);
                woodMesh = new THREE.Mesh(t, this.material2);
            }
            else {
                object.traverse((child) => {

                    if (child.type == 'Mesh') {
                        woodMesh = child.clone();

                        woodMesh.materials = object.materials;

                        woodMesh.castShadow = true;
                        woodMesh.receiveShadow = true;

                    }
                });
            }
            const posDelta = ndiff.clone().multiplyScalar(n * lPt);

            woodMesh.position.x = tpts.pos.x + wood.offset.x + posDelta.x;
            woodMesh.position.y = tpts.pos.y + wood.offset.y + posDelta.y + wood.radius;
            woodMesh.position.z = tpts.pos.z + wood.offset.z + posDelta.z;

            woodMesh.rotation.x = eul.x;
            woodMesh.rotation.y = eul.y;
            woodMesh.rotation.z = eul.z;

            newWoods.push({ 'object': woodMesh, "rot": wood.rot });
            wood.objects.push(woodMesh);
        }

        return newWoods;
    }




    makeRope(rope, object) {

        const tpts = this.trackPoints[rope.ptIdx];

        rope.anchor.pos = { x: tpts.pos.x + rope.offset.x, y: tpts.pos.y + rope.offset.y, z: tpts.pos.z + rope.offset.z };
        rope.obj.pos = { x: rope.anchor.pos.x + rope.initPts.x, y: rope.anchor.pos.y + rope.initPts.y, z: rope.anchor.pos.z + rope.initPts.z };
        rope.obj.rot = { x: rope.initA.x, y: rope.initA.y, z: rope.initA.z, w: rope.initA.w };
        rope.obj.angles = new THREE.Euler("ZYX").setFromQuaternion(new THREE.Quaternion(rope.obj.rot.x, rope.obj.rot.y, rope.obj.rot.z, rope.obj.rot.w));

        const a = new THREE.SphereGeometry(0.2);
        const ropeAnchorMesh = new THREE.Mesh(a, this.platformMaterial);

        ropeAnchorMesh.position.x = rope.anchor.pos.x;
        ropeAnchorMesh.position.y = rope.anchor.pos.y;
        ropeAnchorMesh.position.z = rope.anchor.pos.z;

        rope.anchor.object = ropeAnchorMesh;


        if (object) {
            rope.obj.object = object.clone();
            rope.obj.object.scale.set(rope.obj.size.x, rope.obj.size.y, rope.obj.size.z);
        }
        else {
            const t = rope.obj.shape === 0 ? new THREE.BoxGeometry(rope.obj.size.x, rope.obj.size.y, rope.obj.size.z) : new THREE.CylinderGeometry(rope.obj.size.x / 2, rope.obj.size.x / 2, rope.obj.size.y, 12);
            rope.obj.object = new THREE.Mesh(t, this.platformMaterial);
        }


        rope.obj.object.position.x = rope.obj.pos.x;
        rope.obj.object.position.y = rope.obj.pos.y;
        rope.obj.object.position.z = rope.obj.pos.z;

        rope.obj.object.rotation.x = rope.obj.angles.x;
        rope.obj.object.rotation.y = rope.obj.angles.y;
        rope.obj.object.rotation.z = rope.obj.angles.z;



        return rope;
    }


    makeSpring(spring, object = null) {

        const tpts = this.trackPoints[spring.ptIdx];

        spring.anchor.pos = { x: tpts.pos.x + spring.offset.x, y: tpts.pos.y + spring.offset.y, z: tpts.pos.z + spring.offset.z };
        spring.obj.pos = { x: spring.anchor.pos.x + spring.eqPts.x, y: spring.anchor.pos.y + spring.eqPts.y, z: spring.anchor.pos.z + spring.eqPts.z };
        spring.obj.rot = { x: spring.initA.x, y: spring.initA.y, z: spring.initA.z, w: spring.initA.w };
        spring.obj.angles = new THREE.Euler("ZYX").setFromQuaternion(new THREE.Quaternion(spring.obj.rot.x, spring.obj.rot.y, spring.obj.rot.z, spring.obj.rot.w));

        const a = new THREE.SphereGeometry(0.2);
        spring.anchor.object = new THREE.Mesh(a, this.platformMaterial);

        spring.anchor.object.position.x = spring.anchor.pos.x;
        spring.anchor.object.position.y = spring.anchor.pos.y;
        spring.anchor.object.position.z = spring.anchor.pos.z;

        if (object) {
            spring.obj.object = object.clone();
            spring.obj.object.scale.set(spring.obj.size.x, spring.obj.size.y, spring.obj.size.z);
        }
        else {
            const t = spring.obj.shape === 0 ? new THREE.BoxGeometry(spring.obj.size.x, spring.obj.size.y, spring.obj.size.z) : new THREE.CylinderGeometry(spring.obj.size.x / 2, spring.obj.size.x / 2, spring.obj.size.y, 12);
            spring.obj.object = new THREE.Mesh(t, this.platformMaterial);
        }


        spring.obj.object.position.x = spring.obj.pos.x;
        spring.obj.object.position.y = spring.obj.pos.y;
        spring.obj.object.position.z = spring.obj.pos.z;

        spring.obj.object.rotation.x = spring.obj.angles.x;
        spring.obj.object.rotation.y = spring.obj.angles.y;
        spring.obj.object.rotation.z = spring.obj.angles.z;

        return spring;
    }


    makeBonus(bonus, object = null) {
        const tpts = this.trackPoints[bonus.ptIdx];

        bonus.pos = {x : tpts.pos.x + bonus.offset.x, y : tpts.pos.y + bonus.offset.y, z : tpts.pos.z + bonus.offset.z};
        bonus.angles = {x : 0, y : 0, z : 35};
        bonus.size = [bonus.scale,bonus.scale,bonus.scale];
        
        
        if (object === null) {
            const t = new THREE.BoxGeometry(1, 1, 1);
            bonus.object = new THREE.Mesh(t, this.bonusMaterial);
        } else {

            object.traverse((child) => {

                if (child.type == 'Mesh') {
                    bonus.object = child.clone();

                    bonus.object.materials = child.materials;
                    bonus.object.castShadow = true;
                    bonus.object.receiveShadow = false;
                }
            });
        }


        bonus.object.position.x =  bonus.pos.x;
        bonus.object.position.y =  bonus.pos.y;
        bonus.object.position.z =  bonus.pos.z;

        bonus.object.rotation.x = bonus.angles.x;
        bonus.object.rotation.y = bonus.angles.y;
        bonus.object.rotation.z = bonus.angles.z;

        bonus.object.scale.x = bonus.size.x;
        bonus.object.scale.y = bonus.size.y;
        bonus.object.scale.z = bonus.size.z;
        
        return bonus;
    }

    async makeJumper(jumper, object = null) {
        const tpts = this.trackPoints[jumper.ptIdx];
        const eul = new THREE.Euler(0, 0, 0, "XYZ");
        eul.setFromQuaternion(tpts.rot);

        jumper.pos = { x: tpts.pos.x + jumper.offset.x, y: tpts.pos.y + jumper.offset.y , z: tpts.pos.z + jumper.offset.z};
        jumper.angles = new THREE.Euler(eul.x + jumper.angle.x, eul.y + jumper.angle.y, eul.z + jumper.angle.z, "XYZ");
        jumper.rot = new THREE.Quaternion().setFromEuler(jumper.angles);



        var JumperMesh;
        if (object === null) {

            const name = "jumper";

            const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
            materials.preload();

            const manager = new THREE.LoadingManager();
            manager.onProgress = function (item, loaded, total) { };

            const jumperLoader = new OBJLoader(manager);
            jumperLoader.setMaterials(materials);
            object = await jumperLoader.loadAsync("assets/mesh/" + name + ".obj");

        }

        object.traverse((child) => {

            if (child.type == 'Mesh') {
                JumperMesh = child.clone();

                JumperMesh.materials = child.materials;
                JumperMesh.castShadow = true;
                JumperMesh.receiveShadow = false;
            }
        });


        JumperMesh.position.x = jumper.pos.x;
        JumperMesh.position.y = jumper.pos.y + 0.75;
        JumperMesh.position.z = jumper.pos.z -0.25 ;

        JumperMesh.rotation.x = jumper.angles.x;
        JumperMesh.rotation.y = jumper.angles.y;
        JumperMesh.rotation.z = jumper.angles.z;

        JumperMesh.scale.x = jumper.size.x;
        JumperMesh.scale.y = jumper.size.y;
        JumperMesh.scale.z = jumper.size.z;

        jumper.object = JumperMesh;

        return jumper;
    }

    async makeTurret(turret) {
        const tpts = this.trackPoints[turret.ptIdx];
        turret.pos = { x: tpts.pos.x + turret.offset.x, y: tpts.pos.y + turret.offset.y, z: tpts.pos.z + turret.offset.z };
        turret.angles = new THREE.Euler(turret.angle.x, turret.angle.y, turret.angle.z, "XYZ");
        turret.rot = new THREE.Quaternion().setFromEuler(turret.angles);

        const name = turret.model ? turret.model : "turret";

        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
        materials.preload();

        const manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {
            //console.log(item, loaded, total);
        };

        const turretLoader = new OBJLoader(manager);
        turretLoader.setMaterials(materials);
        const object = await turretLoader.loadAsync("assets/mesh/" + name + ".obj");
        let body, head, canon;

        object.traverse((child) => {

            if (child.type == 'Mesh') {

                if (child.name === 'body') {
                    body = child.clone();
                    body.materials = child.materials;
                    body.castShadow = true;
                    body.receiveShadow = false;
                }
                if (child.name === 'head') {
                    head = child.clone();
                    head.materials = child.materials;
                    head.castShadow = true;
                    head.receiveShadow = false;


                }
                if (child.name === 'canon') {
                    canon = child.clone();
                    canon.materials = child.materials;
                    canon.castShadow = true;
                    canon.receiveShadow = false;
                    canon.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -turret.projPts.y, 0));
                    canon.position.y = turret.projPts.y;
                }
            }
        });


        if ((turret.shotModel) && (turret.shotModel.length > 0)) {
            const materials = await this.MTLLoader.loadAsync("assets/mesh/" + turret.shotModel + ".mtl");
            materials.preload();

            const manager = new THREE.LoadingManager();
            manager.onProgress = function (item, loaded, total) {
                //console.log(item, loaded, total);
            };

            const shotLoader = new OBJLoader(manager);
            shotLoader.setMaterials(materials);
            turret.shotObject = await shotLoader.loadAsync("assets/mesh/" + turret.shotModel + ".obj");
        }

        body.position.x = turret.pos.x;
        body.position.y = turret.pos.y;
        body.position.z = turret.pos.z;

        body.rotation.x = turret.angles.x;
        body.rotation.y = turret.angles.y;
        body.rotation.z = turret.angles.z;

        head.rotation.y = turret.projAngle;
        canon.rotation.z = turret.projAngle2;

        body.scale.x = turret.size.x;
        body.scale.y = turret.size.y;
        body.scale.z = turret.size.z;

        head.add(canon);
        body.add(head);

        turret.object = body;
        turret.head = head;
        turret.canon = canon;
       

        return turret;
    }

    
    addWoods(ptsIdx, num, width, radius, mass, offset) {
        const woodObj = { id: this.lastId++, offset: { x: offset.x, y: offset.y, z: offset.z }, ptIdx: ptsIdx, "num": num, "mass": mass, "width": width, "radius": radius, objects: [] }

        const tpts = this.trackPoints[woodObj.ptIdx];
        const tpts2 = this.trackPoints[woodObj.ptIdx + 1];
        const diff = tpts2.pos.clone().sub(tpts.pos);
        const lPt = woodObj.radius * 2.2;
        const ndiff = diff.clone().normalize();

        const eul1 = new THREE.Euler(Math.PI / 2, 0, 0, "XYZ");
        const rot1 = new THREE.Quaternion().setFromEuler(eul1);

        woodObj.rot = tpts.rot.clone();
        woodObj.rot.multiply(rot1);

        const eul = new THREE.Euler().setFromQuaternion(woodObj.rot);

        for (let n = 0; n < woodObj.num; n++) {
            const posDelta = ndiff.clone().multiplyScalar(n * lPt);
            woodObj.objects.push({  pos:{x:tpts.pos.x + woodObj.offset.x + posDelta.x, y:tpts.pos.y + woodObj.offset.y + posDelta.y + woodObj.radius, z : tpts.pos.z + woodObj.offset.z + posDelta.z},
                                    angles : {x : eul.x,y : eul.y, z : eul.z},
                                    quat : {x : woodObj.rot.x, y : woodObj.rot.y, z : woodObj.rot.z, w : woodObj.rot.w}});
        }
        this.woods.push(woodObj);

        return woodObj;

        //const newWoods = [];
        //newWoods.push({ 'object': woodMesh, "rot": wood.rot });
        //return newWoods;
    }

    addJumper(ptsIdx, offset, angle, size) {
        const tpts = this.trackPoints[ptsIdx];
        
        const qa = new THREE.Quaternion().setFromEuler(angle.x,angle.y,angle.z);
        const myq = tpts.rot.clone().multiply(qa);

        const eul = new THREE.Euler(0, 0, 0, "XYZ").setFromQuaternion(tpts.rot);
        const nangles = new THREE.Euler(eul.x + angle.x, eul.y + angle.y, eul.z + angle.z, "XYZ");

        const jumper = { id: this.lastId++, offset: { x: offset.x, y: offset.y, z: offset.z }, pos : { x: tpts.pos.x + offset.x, y: tpts.pos.y + offset.y , z: tpts.pos.z + offset.z}, rot : myq, size: { x: size.x, y: size.y, z: size.z }, angles: { x: nangles.x, y: nangles.y, z: nangles.z }, ptIdx: ptsIdx, object: null };
        

        this.jumpers.push(jumper);

        return jumper;
    }

    addTurret(ptsIdx, model, shotmodel, activation, offset, angle, size, projPts, projSize, projMass, projSpeed, projAngle, projAngle2, projDelay, projTTL) {
        const tpts = this.trackPoints[ptsIdx];
        const eul = new THREE.Euler(angle.x, angle.y, angle.z, "XYZ");
        const newTurret = {
            id: this.lastId++,
            model: model,
            shotModel: shotmodel,
            activation: activation,
            offset: { x: offset.x, y: offset.y, z: offset.z },
            pos : { x: tpts.pos.x + offset.x, y: tpts.pos.y + offset.y, z: tpts.pos.z + offset.z },
            angles : {x: eul.x, y: eul.y, z: eul.z},
            rot : new THREE.Quaternion().setFromEuler(eul),
            size: { x: size.x, y: size.y, z: size.z },
            projPts: { x: projPts.x, y: projPts.y, z: projPts.z },
            projSize: projSize,
            projMass: projMass,
            projSpeed: projSpeed,
            projAngle: projAngle,
            projAngle2: projAngle2,
            projDelay: projDelay,
            projTTL: projTTL,
            ptIdx: ptsIdx, shots: [], object: null
        };
        this.turrets.push(newTurret);
        return newTurret;
    }

    addSpring(ptsIdx, offset, eqPts, eqA, mass, size, stiffness, damping, initPts, initA, limit, limitA, shape) {
        const tpts = this.trackPoints[ptIdx];
        const spring = {
            id: this.lastId++,
            offset: { x: offset.x, y: offset.y, z: offset.z },
            obj: { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, shape: shape, mass: mass, size: { x: size.x, y: size.y, z: size.z }, },
            anchor: { pos: { x: tpts.pos.x + offset.x, y: tpts.pos.y + offset.y, z: tpts.pos.z + offset.z }, rot: { x: 0, y: 0, z: 0, w: 1 } },
            eqPts: { x: eqPts.x, y: eqPts.y, z: eqPts.z },
            initPts: { x: initPts.x, y: initPts.y, z: initPts.z },
            initA: { x: initA.x, y: initA.y, z: initA.z, w: initA.w },
            eqA: { x: eqA.x, y: eqA.y, z: eqA.z },
            limit: { x: limit.x, y: limit.y, z: limit.z },
            limitA: { x: limitA.x, y: limitA.y, z: limitA.z },
            stiffness: stiffness,
            damping: damping,
            shape: shape,
            ptIdx: ptsIdx
        };

        spring.obj.pos = { x: spring.anchor.pos.x + spring.eqPts.x, y: spring.anchor.pos.y + spring.eqPts.y, z: spring.anchor.pos.z + spring.eqPts.z };
        spring.obj.rot = { x: spring.initA.x, y: spring.initA.y, z: spring.initA.z, w: spring.initA.w };
        spring.obj.angles = new THREE.Euler("ZYX").setFromQuaternion(new THREE.Quaternion(spring.obj.rot.x, spring.obj.rot.y, spring.obj.rot.z, spring.obj.rot.w));

        /*const newSpring = this.makeSpring(springObj, object);*/
        this.springs.push(newSpring);

        return newSpring;
    }

    addRope(ptsIdx, offset, eqPts, eqA, mass, size, softness, damping, motorforce, bounce, initPts, initA, limit, limitA, shape) {
        const tpts = this.trackPoints[ptIdx];

        const rope = {
            id: this.lastId++,
            offset: { x: offset.x, y: offset.y, z: offset.z },
            obj: { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 }, shape: shape, mass: mass, size: { x: size.x, y: size.y, z: size.z }, },
            anchor: { pos: { x: tpts.pos.x + offset.x, y: tpts.pos.y + offset.y, z: tpts.pos.z + offset.z }, rot: { x: 0, y: 0, z: 0, w: 1 } },
            eqPts: { x: eqPts.x, y: eqPts.y, z: eqPts.z },
            initPts: { x: initPts.x, y: initPts.y, z: initPts.z },
            initA: { x: initA.x, y: initA.y, z: initA.z, w: initA.w },
            eqA: { x: eqA.x, y: eqA.y, z: eqA.z },
            limit: { x: limit.x, y: limit.y, z: limit.z },
            limitA: { x: limitA.x, y: limitA.y, z: limitA.z },
            softness: softness,
            damping: damping,
            motorforce: motorforce,
            bounce: bounce,
            shape: shape,
            ptIdx: ptsIdx
        };

        rope.obj.pos = { x: rope.anchor.pos.x + rope.initPts.x, y: rope.anchor.pos.y + rope.initPts.y, z: rope.anchor.pos.z + rope.initPts.z };
        rope.obj.rot = { x: rope.initA.x, y: rope.initA.y, z: rope.initA.z, w: rope.initA.w };
        rope.obj.angles = new THREE.Euler("ZYX").setFromQuaternion(new THREE.Quaternion(rope.obj.rot.x, rope.obj.rot.y, rope.obj.rot.z, rope.obj.rot.w));

        this.ropes.push(rope);

        return newRope;
    }

    addBonus(ptsIdx, type, time, offset, size) {
        const tpts = this.trackPoints[ptsIdx];
        const newBonus = {  id: this.lastId++, 
                            offset: { x: offset.x, y: offset.y, z: offset.z }, 
                            pos : {x : tpts.pos.x + offset.x, y : tpts.pos.y + offset.y, z : tpts.pos.z + offset.z}, 
                            angles : {x : 0, y : 0, z : 35},
                            scale : [size,size,size],
                            ptIdx: ptsIdx, "type": type, "time": time, taken: 0, size: size, enabled: true, object: null };

        
        //const newBonus = this.makeBonus(bonusObj, object);
        this.bonuses.push(newBonus);

        return newBonus;
    }

    setTexture(tex, norm = null, spec = null, emm = null, rought = null, scale = null) {
        this.roadTex = tex;
        this.roadNorm = norm;
        this.roadSpec = spec;
        this.roadRought = rought;
        this.roadEmm = emm;

        this.roadTexScale = scale ? { x: scale.x, y: scale.y } : { x: 2, y: 4 };

        this.createRoadMat();

        if (this.roadObj) {
            this.roadObj.material = this.roadMaT;
            this.roadObj.material.needsUpdate = true;
        }
    }

    async saveTrack(name) {
        var mytrack = { nPts: this.NPoints, gravity: this.gravity, music: this.music, skyBoxImg: this.skyBoxImg, restitution: this.restitution, friction: this.friction, class: this.class, difficulty: this.difficulty, roadMat: { t: this.roadTex, n: this.roadNorm, s: this.roadSpec, e: this.roadEmm, r: this.roadRought, scale: { x: this.roadTexScale.x, y: this.roadTexScale.y } }, lapTime: this.lapTime, wall: { name: this.wallName }, terrain: { name: this.terrain.name }, pts: [], woods: [], bonuses: [], jumpers: [], loopings: [], worms: [], tubes: [], turrets: [], springs: [], ropes: [], waves : [] };

        for (let n = 0; n < this.trackPoints.length; n++) {
            mytrack.pts.push({ pos: { x: this.trackPoints[n].pos.x, y: this.trackPoints[n].pos.y, z: this.trackPoints[n].pos.z }, width: this.trackPoints[n].width });
        }

        for (let n = 0; n < this.woods.length; n++) {
            mytrack.woods.push({ ptIdx: this.woods[n].ptIdx, offset: { x: this.woods[n].offset.x, y: this.woods[n].offset.y, z: this.woods[n].offset.z }, width: this.woods[n].width, num: this.woods[n].num, radius: this.woods[n].radius, mass: this.woods[n].mass });
        }

        for (let n = 0; n < this.bonuses.length; n++) {
            mytrack.bonuses.push({ ptIdx: this.bonuses[n].ptIdx, offset: { x: this.bonuses[n].offset.x, y: this.bonuses[n].offset.y, z: this.bonuses[n].offset.z }, type: this.bonuses[n].type, time: this.bonuses[n].time, scale: this.bonuses[n].scale });
        }
        for (let n = 0; n < this.jumpers.length; n++) {
            mytrack.jumpers.push({ ptIdx: this.jumpers[n].ptIdx, offset: { x: this.jumpers[n].offset.x, y: this.jumpers[n].offset.y, z: this.jumpers[n].offset.z }, size: { x: this.jumpers[n].size.x, y: this.jumpers[n].size.y, z: this.jumpers[n].size.z }, angle: { x: this.jumpers[n].angle.x, y: this.jumpers[n].angle.y, z: this.jumpers[n].angle.z } });
        }

        for (let n = 0; n < this.loopings.length; n++) {
            mytrack.loopings.push({ ptIdx: this.loopings[n].idx, height: this.loopings[n].height, dir: this.loopings[n].dir, hide: this.loopings[n].hide, npts: this.loopings[n].npts });
        }


        for (let n = 0; n < this.worms.length; n++) {
            mytrack.worms.push({ ptIdx: this.worms[n].idx, height: this.worms[n].height, dir: this.worms[n].dir, npts: this.worms[n].npts });
        }

        for (let n = 0; n < this.tubes.length; n++) {
            mytrack.tubes.push({ ptIdx: this.tubes[n].idx, height: this.tubes[n].height, width: this.tubes[n].width, dir: this.tubes[n].dir, npts: this.tubes[n].npts });
        }

        for (let n = 0; n < this.waves.length; n++) {
            mytrack.waves.push({ ptIdx: this.waves[n].idx, amplitude: this.waves[n].amplitude, frequency: this.waves[n].frequency, phase: this.waves[n].phase, npts: this.waves[n].npts });
        }

        for (let n = 0; n < this.turrets.length; n++) {
            mytrack.turrets.push({ ptIdx: this.turrets[n].ptIdx, model: this.turrets[n].model, shotModel: this.turrets[n].shotModel, activation: this.turrets[n].activation, offset: { x: this.turrets[n].offset.x, y: this.turrets[n].offset.y, z: this.turrets[n].offset.z }, size: { x: this.turrets[n].size.x, y: this.turrets[n].size.y, z: this.turrets[n].size.z }, angle: { x: this.turrets[n].angle.x, y: this.turrets[n].angle.y, z: this.turrets[n].angle.z }, projPts: { x: this.turrets[n].projPts.x, y: this.turrets[n].projPts.y, z: this.turrets[n].projPts.z }, projSize: this.turrets[n].projSize, projMass: this.turrets[n].projMass, projSpeed: this.turrets[n].projSpeed, projAngle: this.turrets[n].projAngle, projAngle2: this.turrets[n].projAngle2, projDelay: this.turrets[n].projDelay, projTTL: this.turrets[n].projTTL });
        }


        for (let n = 0; n < this.springs.length; n++) {
            mytrack.springs.push({
                ptIdx: this.springs[n].ptIdx,
                offset: { x: this.springs[n].offset.x, y: this.springs[n].offset.y, z: this.springs[n].offset.z },
                size: { x: this.springs[n].obj.size.x, y: this.springs[n].obj.size.y, z: this.springs[n].obj.size.z },
                eqPts: { x: this.springs[n].eqPts.x, y: this.springs[n].eqPts.y, z: this.springs[n].eqPts.z },
                eqA: { x: this.springs[n].eqA.x, y: this.springs[n].eqA.y, z: this.springs[n].eqA.z },
                initPts: { x: this.springs[n].initPts.x, y: this.springs[n].initPts.y, z: this.springs[n].initPts.z },
                initA: { x: this.springs[n].initA.x, y: this.springs[n].initA.y, z: this.springs[n].initA.z, w: this.springs[n].initA.w },
                limit: { x: this.springs[n].limit.x, y: this.springs[n].limit.y, z: this.springs[n].limit.z },
                limitA: { x: this.springs[n].limitA.x, y: this.springs[n].limitA.y, z: this.springs[n].limitA.z },
                shape: this.springs[n].obj.shape,
                mass: this.springs[n].obj.mass,
                stiffness: this.springs[n].stiffness,
                damping: this.springs[n].damping
            });
        }


        for (let n = 0; n < this.ropes.length; n++) {
            mytrack.ropes.push({
                ptIdx: this.ropes[n].ptIdx,
                offset: { x: this.ropes[n].offset.x, y: this.ropes[n].offset.y, z: this.ropes[n].offset.z },
                size: { x: this.ropes[n].obj.size.x, y: this.ropes[n].obj.size.y, z: this.ropes[n].obj.size.z },
                eqPts: { x: this.ropes[n].eqPts.x, y: this.ropes[n].eqPts.y, z: this.ropes[n].eqPts.z },
                eqA: { x: this.ropes[n].eqA.x, y: this.ropes[n].eqA.y, z: this.ropes[n].eqA.z },
                initPts: { x: this.ropes[n].initPts.x, y: this.ropes[n].initPts.y, z: this.ropes[n].initPts.z },
                initA: { x: this.ropes[n].initA.x, y: this.ropes[n].initA.y, z: this.ropes[n].initA.z, w: this.ropes[n].initA.w },
                limit: { x: this.ropes[n].limit.x, y: this.ropes[n].limit.y, z: this.ropes[n].limit.z },
                limitA: { x: this.ropes[n].limitA.x, y: this.ropes[n].limitA.y, z: this.ropes[n].limitA.z },
                shape: this.ropes[n].obj.shape,
                mass: this.ropes[n].obj.mass,
                softness: this.ropes[n].softness,
                damping: this.ropes[n].damping,
                motorforce: this.ropes[n].motorforce,
                bounce: this.ropes[n].bounce
            });
        }


        if (this.HM) {
            mytrack.terrain.hm = { file: this.HM.file, scale: { x: this.HM.scale.x, y: this.HM.scale.y, z: this.HM.scale.z }, pos: { x: this.HM.pos.x, y: this.HM.pos.y, z: this.HM.pos.z } }
        }

        $.ajax({
            type: "POST",
            url: '/saveTrack?trackName=' + name,
            data: { track: JSON.stringify(mytrack) },
            dataType: 'json',
            success: function (result) {

                if (result.result === true)
                    return true;
                else
                    return false;
            }
        });
    }

    roadObj;
    trackPoints;
    walls;
}


const tires = [{ id: 201, friction: 200, stiffness: 20, damping: 0.2, compression: 0.6, tire: "tire" }];
const motors = [{ id: 101, maxEngineForce: 300, maxBreakingForce: 30 }];
const cars = [{ id: 1, isfree: true, name: "free car", chassis: 'car2', massVehicle: 350, steeringClamp: 0.4, steeringIncrement: .04, motorid: 101, tireid: 201 }];

//var scale = chroma.scale(['blue', 'green', 'red']).domain([0, 50]);

class CircuitRace {


    constructor() {

        this.track = null;
        this.myCar = null;
        this.carId = 1;
        this.lastCarData = null;
        this.dataDelta = null;
        this.lastBufferTime = null;
        this.deltaTime = null;
        this.lastScreech = 0;
        this.cars = [];
    }

    initData(buffer) {
        let curOfs = 0;
        if (this.lastCarData !== null)
            return;

        
        const ncars = buffer[curOfs++];

        this.lastCarData = { cars: [], woods: [], bonuses: [], segs: [], turrets: [], springs: [], ropes: [] };
        this.dataDelta = { cars: [], woods: [] };

        for (let n = 0; n < ncars; n++) {
            this.lastCarData.cars[n] = {id : buffer[curOfs], pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 }, wheels: [], contacts: [], contactsDMG: [], speed: 0.0, RPM: 0.0, damage: 0.0, curSeg: 0.0, nLaps: 0.0, nitros: 0.0, nextNitro: 0.0, nBonus: 0.0 }
            this.cars[n].servId = buffer[curOfs];

            this.dataDelta.cars[n] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 }, wheels: [] };

            curOfs += 17;

            this.dataDelta.cars[n].nbonuses = buffer[curOfs++];
            this.dataDelta.cars[n].ncontacts = buffer[curOfs++];


            curOfs += this.dataDelta.cars[n].ncontacts * 4;

            for (let i = 0; i < 4; i++) {
                this.lastCarData.cars[n].wheels[i] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 }, skidding: 1, contactNormal: { x: 0, y: 1, z: 0 } };
                this.dataDelta.cars[n].wheels[i] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 } };
                curOfs += 11;
            }
        }

        const nwoods = buffer[curOfs++];

        for (let n = 0; n < nwoods; n++) {
            this.lastCarData.woods[n] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 } };
            this.dataDelta.woods[n] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 } };
            curOfs += 7;
        }

        const nbonuses = buffer[curOfs++];

        for (let n = 0; n < nbonuses; n++) {
            this.lastCarData.bonuses[n] = { taken: false, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 }, scale: 1.0 };
            curOfs += 6;
        }

        for (let n = 0; n < this.track.loopings.length * 7; n++) {
            this.lastCarData.bonuses.push({ taken: false, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 }, scale: 1.0 });
        }


        const nturrets = buffer[curOfs++];
        for (let n = 0; n < nturrets; n++) {
            this.lastCarData.turrets[n] = { headAngle: 0 };
            curOfs++;
            const nshots = buffer[curOfs++];
            curOfs += nshots * 4;
        }

        const nsprings = buffer[curOfs++];
        for (let n = 0; n < nsprings; n++) {
            this.lastCarData.springs[n] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 } };
            curOfs += 7;
        }

        const nropes = buffer[curOfs++];
        for (let n = 0; n < nropes; n++) {
            this.lastCarData.ropes[n] = { pos: { x: 0.0, y: 0.0, z: 0.0 }, quat: { x: 0.0, y: 0.0, z: 0.0, w: 0.0 } };
            curOfs += 7;
        }

        const nSegs = buffer[curOfs++];
        for (let n = 0; n < nSegs; n++) {
            this.lastCarData.segs[n] = { center: { x: 0.0, y: 0.0, z: 0.0 }, halfSize: { x: 0.0, y: 0.0, z: 0.0 } };
            curOfs += 6;
        }


    }

    bin2cars(buffer, now) {

        let curOfs = 0;

        
        const ncars = buffer[curOfs++];

        if(ncars<this.lastCarData.cars.length)
        {

            if(this.lastCarData.cars[0].id == buffer[curOfs])
            {
                this.lastCarData.cars.shift();
                this.dataDelta.cars.shift();
            }
            else
            {
                this.lastCarData.cars.pop();
                this.dataDelta.cars.pop();
            }
        }

        for (let n = 0; n < ncars; n++) {

            this.lastCarData.cars[n].id  =buffer[curOfs++];
            this.lastCarData.cars[n].remainingTime = buffer[curOfs++];

            if (this.lastBufferTime !== null) {
                
                this.dataDelta.cars[n].pos.x = buffer[curOfs] - this.lastCarData.cars[n].pos.x;
                this.dataDelta.cars[n].pos.y = buffer[curOfs + 1] - this.lastCarData.cars[n].pos.y;
                this.dataDelta.cars[n].pos.z = buffer[curOfs + 2] - this.lastCarData.cars[n].pos.z;

                this.dataDelta.cars[n].quat.x = buffer[curOfs + 3] - this.lastCarData.cars[n].quat.x;
                this.dataDelta.cars[n].quat.y = buffer[curOfs + 4] - this.lastCarData.cars[n].quat.y;
                this.dataDelta.cars[n].quat.z = buffer[curOfs + 5] - this.lastCarData.cars[n].quat.z;
                this.dataDelta.cars[n].quat.w = buffer[curOfs + 6] - this.lastCarData.cars[n].quat.w;

                this.deltaTime = now - this.lastBufferTime;
            }

            this.lastCarData.cars[n].pos.x = buffer[curOfs++];
            this.lastCarData.cars[n].pos.y = buffer[curOfs++];
            this.lastCarData.cars[n].pos.z = buffer[curOfs++];

            this.lastCarData.cars[n].quat.x = buffer[curOfs++];
            this.lastCarData.cars[n].quat.y = buffer[curOfs++];
            this.lastCarData.cars[n].quat.z = buffer[curOfs++];
            this.lastCarData.cars[n].quat.w = buffer[curOfs++];

            this.lastCarData.cars[n].speed = buffer[curOfs++];
            this.lastCarData.cars[n].RPM = buffer[curOfs++];
            this.lastCarData.cars[n].damage = buffer[curOfs++];
            this.lastCarData.cars[n].curSeg = buffer[curOfs++];
            this.lastCarData.cars[n].nLaps = buffer[curOfs++];
            this.lastCarData.cars[n].nitros = buffer[curOfs++];
            this.lastCarData.cars[n].nextNitro = buffer[curOfs++];

            this.lastCarData.cars[n].multiplier = buffer[curOfs++];
            this.lastCarData.cars[n].nBonus = buffer[curOfs++];

            this.lastCarData.cars[n].contacts = new Array(buffer[curOfs]);
            this.lastCarData.cars[n].contactsDMG = new Array(buffer[curOfs++]);

            for (let i = 0; i < this.lastCarData.cars[n].contacts.length; i++) {
                this.lastCarData.cars[n].contacts[i] = new THREE.Vector3(buffer[curOfs], buffer[curOfs + 1], buffer[curOfs + 2]);
                this.lastCarData.cars[n].contactsDMG[i] = buffer[curOfs + 3];
                curOfs += 4;
            }

            for (let i = 0; i < 4; i++) {

                this.lastCarData.cars[n].wheels[i].pos.x = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].pos.y = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].pos.z = buffer[curOfs++];

                this.lastCarData.cars[n].wheels[i].quat.x = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].quat.y = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].quat.z = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].quat.w = buffer[curOfs++];

                this.lastCarData.cars[n].wheels[i].skidding = buffer[curOfs++];

                this.lastCarData.cars[n].wheels[i].contactNormal.x = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].contactNormal.y = buffer[curOfs++];
                this.lastCarData.cars[n].wheels[i].contactNormal.z = buffer[curOfs++];

            }
        }

        const nwoods = buffer[curOfs++];

        for (let n = 0; n < nwoods; n++) {
            this.lastCarData.woods[n].pos.x = buffer[curOfs++];
            this.lastCarData.woods[n].pos.y = buffer[curOfs++];
            this.lastCarData.woods[n].pos.z = buffer[curOfs++];
            this.lastCarData.woods[n].quat.x = buffer[curOfs++];
            this.lastCarData.woods[n].quat.y = buffer[curOfs++];
            this.lastCarData.woods[n].quat.z = buffer[curOfs++];
            this.lastCarData.woods[n].quat.w = buffer[curOfs++];
        }


        const nbonuses = buffer[curOfs++];
        for (let n = 0; n < nbonuses; n++) {
            this.lastCarData.bonuses[n].taken = buffer[curOfs++];
            this.lastCarData.bonuses[n].quat.x = buffer[curOfs++];
            this.lastCarData.bonuses[n].quat.y = buffer[curOfs++];
            this.lastCarData.bonuses[n].quat.z = buffer[curOfs++];
            this.lastCarData.bonuses[n].quat.w = buffer[curOfs++];
            this.lastCarData.bonuses[n].scale = buffer[curOfs++];
        }

        const nTurrets = buffer[curOfs++];

        for (let n = 0; n < nTurrets; n++) {
            this.lastCarData.turrets[n].headAngle = buffer[curOfs++];

            const nshots = buffer[curOfs++];

            this.lastCarData.turrets[n].shots = new Array(nshots);
            for (let i = 0; i < nshots; i++) {
                const sid = parseInt(buffer[curOfs++]);
                const x = buffer[curOfs++];
                const y = buffer[curOfs++];
                const z = buffer[curOfs++];
                this.lastCarData.turrets[n].shots[i] = { id: sid, pos: { x: x, y: y, z: z } };
            }
        }
        const nsprings = buffer[curOfs++];

        for (let n = 0; n < nsprings; n++) {
            this.lastCarData.springs[n].pos.x = buffer[curOfs++];
            this.lastCarData.springs[n].pos.y = buffer[curOfs++];
            this.lastCarData.springs[n].pos.z = buffer[curOfs++];
            this.lastCarData.springs[n].quat.x = buffer[curOfs++];
            this.lastCarData.springs[n].quat.y = buffer[curOfs++];
            this.lastCarData.springs[n].quat.z = buffer[curOfs++];
            this.lastCarData.springs[n].quat.w = buffer[curOfs++];
        }


        const nropes = buffer[curOfs++];
        for (let n = 0; n < nropes; n++) {
            this.lastCarData.ropes[n].pos.x = buffer[curOfs++];
            this.lastCarData.ropes[n].pos.y = buffer[curOfs++];
            this.lastCarData.ropes[n].pos.z = buffer[curOfs++];
            this.lastCarData.ropes[n].quat.x = buffer[curOfs++];
            this.lastCarData.ropes[n].quat.y = buffer[curOfs++];
            this.lastCarData.ropes[n].quat.z = buffer[curOfs++];
            this.lastCarData.ropes[n].quat.w = buffer[curOfs++];
        }

        const nSegs = buffer[curOfs++];

        for (let n = 0; n < nSegs; n++) {
            this.lastCarData.segs[n].center.x = buffer[curOfs++];
            this.lastCarData.segs[n].center.y = buffer[curOfs++];
            this.lastCarData.segs[n].center.z = buffer[curOfs++];

            this.lastCarData.segs[n].halfSize.x = buffer[curOfs++];
            this.lastCarData.segs[n].halfSize.y = buffer[curOfs++];
            this.lastCarData.segs[n].halfSize.z = buffer[curOfs++];
        }

        this.lastBufferTime = now;
    }


    async setHM(name, rgba, scale, pos) {
        if ((this.track.HM !== null) && (this.track.HM.mesh !== null)) {
            this.engine.scene.remove(this.track.HM.mesh);
            this.track.HM.geom.dispose();
            this.track.HM.mesh = null;
        }
        this.track.HM = { file: name, data: rgba, scale: scale, pos: pos, mesh: null, geom: null };

        this.createGeometryFromMap();

        this.engine.scene.add(this.track.HM.mesh);


    }

    getHighPoint(geometry, face) {

        var v1 = geometry.vertices[face.a].y;
        var v2 = geometry.vertices[face.b].y;
        var v3 = geometry.vertices[face.c].y;

        return Math.max(v1, v2, v3);
    }

    createGeometryFromMap() {

        if (this.track.HM === null)
            return;

        var depth = 512;
        var width = 512;

        var spacingX = this.track.HM.scale.x;
        var spacingZ = this.track.HM.scale.z;


        var geom = new THREE.BufferGeometry();
        var vertices = [];
        var faces = [];
        var output = [];
        for (var x = 0; x < depth; x++) {
            for (var z = 0; z < width; z++) {
                // get pixel
                // since we're grayscale, we only need one element



                var yValue = this.track.HM.data[z * 4 + (depth * x * 4)] * this.track.HM.scale.y;
                var vertex = new THREE.Vector3(x * spacingX + this.track.HM.pos.x, yValue + this.track.HM.pos.y, z * spacingZ + this.track.HM.pos.z);

                /*
                console.log(this.track.HM.data[z * 4 + (depth * x * 4)]);
                console.log(vertex);
                */


                vertices.push(vertex.x, vertex.y, vertex.z);
            }
        }

        // we create a rectangle between four vertices, and we do
        // that as two triangles.
        for (var z = 0; z < depth - 1; z++) {
            for (var x = 0; x < width - 1; x++) {
                // we need to point to the position in the array
                // a - - b
                // |  x  |
                // c - - d
                var a = x + z * width;
                var b = (x + 1) + (z * width);
                var c = x + ((z + 1) * width);
                var d = (x + 1) + ((z + 1) * width);

                /*
                var face1 = new THREE.Face3(a, b, d);
                var face2 = new THREE.Face3(d, c, a);

                face1.color = new THREE.Color(scale(this.getHighPoint(geom, face1)).hex());
                face2.color = new THREE.Color(scale(this.getHighPoint(geom, face2)).hex())
                */

                faces.push(a, b, d);
                faces.push(d, c, a);
            }
        }

        geom.setIndex(faces);
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        geom.computeVertexNormals(true);
        //geom.computeFaceNormals();
        geom.computeBoundingBox();

        var zMax = geom.boundingBox.max.z;
        var xMax = geom.boundingBox.max.x;

        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

        material.side = THREE.DoubleSide;

        var mesh = new THREE.Mesh(geom, material);
        mesh.translateX(-xMax / 2);
        mesh.translateZ(-zMax / 2);
        mesh.name = 'ground';

        this.track.HM.mesh = mesh;
        this.track.HM.geom = geom;


    }


    allCarsLoaded()
    {

        if((this.cars.length ==0)&&(this.myCar!=null) && (this.myCar.ChassisMesh!==null))
            return true;

        for(let car of this.cars)
        {
            if(!car.ChassisMesh)
                return false;
        }

        return true;
    }




    async loadTrack(name, site = '') {

        const response = await fetch(site + '/getTrack?trackName=' + name);
        const data = await response.json();

        this.track = new Track(data.nPts);

        for (let n = 0; n < data.pts.length; n++) {
            this.track.trackPoints.push({ pos: new THREE.Vector3(data.pts[n].pos.x, data.pts[n].pos.y, data.pts[n].pos.z), width: parseFloat(data.pts[n].width) });
        }
        /*
        for (let n = 0; n < this.track.trackPoints.length; n++) {
            this.track.trackPoints[n].pos.z -= 40.0;
        }
        */
        this.track.woodDefs = [];
        this.track.bonusDefs = [];
        this.track.jumpersDefs = [];
        this.track.turretsDefs = [];
        this.track.springDefs = [];
        this.track.ropeDefs = [];

        this.track.startPts = data.startPts ? data.startPts : 0;
        this.track.lapTime = data.lapTime ? data.lapTime : 60;

        this.track.class = data.class !== undefined ? data.class : 0;
        this.track.difficulty = data.difficulty !== undefined ? data.difficulty : 0;

        this.track.friction = data.friction !== undefined ? data.friction : 0.4;
        this.track.restitution = data.restitution !== undefined ? data.restitution : 0.8;

        this.track.skyBoxImg = data.skyBoxImg !== undefined ? data.skyBoxImg : 'city.jpg';
        this.track.music = data.music !== undefined ? data.music : 'music1.ogg';
        this.track.gravity = data.gravity !== undefined ? parseFloat(data.gravity) : 10;

        if (data.woods) {
            for (let n = 0; n < data.woods.length; n++) {
                this.track.woodDefs.push({ ptIdx: data.woods[n].ptIdx, offset: { x: data.woods[n].offset.x, y: data.woods[n].offset.y, z: data.woods[n].offset.z }, width: data.woods[n].width, num: data.woods[n].num, radius: data.woods[n].radius, mass: data.woods[n].mass });
            }
        }

        if (data.bonuses) {
            for (let n = 0; n < data.bonuses.length; n++) {
                this.track.bonusDefs.push({ ptIdx: data.bonuses[n].ptIdx, offset: { x: data.bonuses[n].offset.x, y: data.bonuses[n].offset.y, z: data.bonuses[n].offset.z }, type: data.bonuses[n].type, time: data.bonuses[n].time, scale: data.bonuses[n].scale ? data.bonuses[n].scale : 1 });
            }
        }

        

        if (data.jumpers) {
            for (let n = 0; n < data.jumpers.length; n++) {
                this.track.jumpersDefs.push({ ptIdx: data.jumpers[n].ptIdx, offset: { x: data.jumpers[n].offset.x, y: data.jumpers[n].offset.y, z: data.jumpers[n].offset.z }, angle: { x: data.jumpers[n].angle.x, y: data.jumpers[n].angle.y, z: data.jumpers[n].angle.z }, size: { x: data.jumpers[n].size.x, y: data.jumpers[n].size.y, z: data.jumpers[n].size.z } });
            }
        }

        if (data.loopings) {
            for (let n = 0; n < data.loopings.length; n++) {
                this.track.loopings.push({ idx: data.loopings[n].ptIdx, height: data.loopings[n].height, dir: data.loopings[n].dir, hide: data.loopings[n].hide, npts: data.loopings[n].npts });
            }
        }

        if (data.worms) {
            for (let n = 0; n < data.worms.length; n++) {
                this.track.worms.push({ idx: data.worms[n].ptIdx, height: data.worms[n].height, dir: data.worms[n].dir, npts: data.worms[n].npts });
            }
        }

        if (data.tubes) {
            for (let n = 0; n < data.tubes.length; n++) {
                this.track.tubes.push({ idx: data.tubes[n].ptIdx, height: data.tubes[n].height, width: data.tubes[n].width, dir: data.tubes[n].dir, npts: data.tubes[n].npts });
            }
        }

        if (data.waves) {
            for (let n = 0; n < data.waves.length; n++) {
                this.track.waves.push({ idx: data.waves[n].ptIdx, amplitude: data.waves[n].amplitude, frequency: data.waves[n].frequency, phase: data.waves[n].phase, npts: data.waves[n].npts });
            }
        }

        if (data.turrets) {
            for (let n = 0; n < data.turrets.length; n++) {
                this.track.turretsDefs.push({ ptIdx: data.turrets[n].ptIdx, model: data.turrets[n].model, shotModel: data.turrets[n].shotModel, activation: data.turrets[n].activation, offset: { x: data.turrets[n].offset.x, y: data.turrets[n].offset.y, z: data.turrets[n].offset.z }, angle: { x: data.turrets[n].angle.x, y: data.turrets[n].angle.y, z: data.turrets[n].angle.z }, size: { x: data.turrets[n].size.x, y: data.turrets[n].size.y, z: data.turrets[n].size.z }, projPts: { x: data.turrets[n].projPts.x, y: data.turrets[n].projPts.y, z: data.turrets[n].projPts.z }, projSpeed: data.turrets[n].projSpeed, projMass: data.turrets[n].projMass, projSize: data.turrets[n].projSize, projAngle: data.turrets[n].projAngle ? data.turrets[n].projAngle : 0, projAngle2: data.turrets[n].projAngle2 ? data.turrets[n].projAngle2 : 0, projDelay: data.turrets[n].projDelay ? data.turrets[n].projDelay : 300, projTTL: data.turrets[n].projTTL ? data.turrets[n].projTTL : 0 });
            }
        }


        if (data.springs) {
            for (let n = 0; n < data.springs.length; n++) {

                this.track.springDefs.push({
                    ptIdx: data.springs[n].ptIdx,
                    offset: { x: data.springs[n].offset.x, y: data.springs[n].offset.y, z: data.springs[n].offset.z },
                    size: { x: data.springs[n].size.x, y: data.springs[n].size.y, z: data.springs[n].size.z },
                    eqA: { x: data.springs[n].eqA.x, y: data.springs[n].eqA.y, z: data.springs[n].eqA.z },
                    eqPts: { x: data.springs[n].eqPts.x, y: data.springs[n].eqPts.y, z: data.springs[n].eqPts.z },
                    initPts: { x: data.springs[n].initPts.x, y: data.springs[n].initPts.y, z: data.springs[n].initPts.z },
                    initA: { x: data.springs[n].initA.x, y: data.springs[n].initA.y, z: data.springs[n].initA.z, w: data.springs[n].initA.w },
                    limit: { x: data.springs[n].limit.x, y: data.springs[n].limit.y, z: data.springs[n].limit.z },
                    limitA: { x: data.springs[n].limitA.x, y: data.springs[n].limitA.y, z: data.springs[n].limitA.z },
                    mass: data.springs[n].mass,
                    shape: data.springs[n].shape ? data.springs[n].shape : 0,
                    stiffness: data.springs[n].stiffness,
                    damping: data.springs[n].damping
                });
            }
        }


        if (data.ropes) {
            for (let n = 0; n < data.ropes.length; n++) {

                this.track.ropeDefs.push({
                    ptIdx: data.ropes[n].ptIdx,
                    offset: { x: data.ropes[n].offset.x, y: data.ropes[n].offset.y, z: data.ropes[n].offset.z },
                    size: { x: data.ropes[n].size.x, y: data.ropes[n].size.y, z: data.ropes[n].size.z },
                    eqA: { x: data.ropes[n].eqA.x, y: data.ropes[n].eqA.y, z: data.ropes[n].eqA.z },
                    eqPts: { x: data.ropes[n].eqPts.x, y: data.ropes[n].eqPts.y, z: data.ropes[n].eqPts.z },
                    initPts: { x: data.ropes[n].initPts.x, y: data.ropes[n].initPts.y, z: data.ropes[n].initPts.z },
                    initA: { x: data.ropes[n].initA.x, y: data.ropes[n].initA.y, z: data.ropes[n].initA.z, w: data.ropes[n].initA.w },
                    limit: { x: data.ropes[n].limit.x, y: data.ropes[n].limit.y, z: data.ropes[n].limit.z },
                    limitA: { x: data.ropes[n].limitA.x, y: data.ropes[n].limitA.y, z: data.ropes[n].limitA.z },
                    mass: data.ropes[n].mass,
                    shape: data.ropes[n].shape ? data.ropes[n].shape : 0,
                    softness: data.ropes[n].softness,
                    damping: data.ropes[n].damping,
                    motorforce: data.ropes[n].motorforce,
                    bounce: data.ropes[n].bounce
                });
            }
        }


        if (data.terrain.hm) {
            this.track.HM = { file: data.terrain.hm.file, scale: { x: data.terrain.hm.scale.x, y: data.terrain.hm.scale.y, z: data.terrain.hm.scale.z }, pos: { x: data.terrain.hm.pos.x, y: data.terrain.hm.pos.y, z: data.terrain.hm.pos.z } };
        }

        if (data.roadMat) {
            this.track.roadTex = data.roadMat.t;
            this.track.roadNorm = data.roadMat.n;
            this.track.roadSpec = data.roadMat.s;
            this.track.roadEmm = data.roadMat.e;
            this.track.roadRought = data.roadMat.r;
            this.track.roadTexScale = { x: data.roadMat.scale.x, y: data.roadMat.scale.y };
        }
        else {
            this.track.roadTex = 'mud.jpg';
            this.track.roadNorm = 'mud_n.png';
            this.track.roadSpec = 'mud_s.png';
            this.track.roadEmm = '';
            this.track.roadRought = '';
            this.track.roadTexScale = { x: 2, y: 4 };
        }

        this.track.terrain = {name : data.terrain.name};

        this.track.doCenter();

        //this.track.NPoints = 100;

        if (data.wall)
            this.track.wallName = data.wall.name;
        else
            this.track.wallName = 'Crystal';
        
        


        this.track.createTrackMesh(new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 20));
        this.track.createTrackWalls();
    }

    async createCar(carDef) {
        let carPos;
        let carQuat;

        if ((this.track !== null) && (this.track.trackPoints.length > 1)) {
            carPos = this.track.trackPoints[this.track.startPts].pos.clone();
            carPos.y += 2;
            carQuat = this.track.trackPoints[this.track.startPts].rot.clone();
        }
        else {
            carPos = new THREE.Vector3(0, 0, 0);
            carQuat = new THREE.Quaternion();
        }
        return new Car(this.carId++, carDef, carPos, carQuat);


    }

    carId;
    cars;
    track;
}

const AudioContext = window.AudioContext || window.webkitAudioContext;

class EngineMain {

    constructor(audio = false, matType = 1) {

        const w = $('#gl-dom').innerWidth();
        const h = $('#gl-dom').innerHeight();

        this.hiddenObjects = [];

        this.scene = new THREE.Scene();

        this.sceneNOPP = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(65, w / h, 0.8, 700);
        this.camMode = 1;

        this.digits = [];
        this.particles = [];
        this.sceneUI = new THREE.Scene();
        this.cameraUI = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 10000);
        this.cameraUI.updateProjectionMatrix();

        this.cameraUI.position.z = 10;
        this.cameraUI.lookAt(0, 0, 0);

        this.sceneUI.add(this.cameraUI);
        this.lastCamAngle = null;

        this.MatType = matType;

        switch (matType) {
            default:
            case 0:
                this.MTLLoader = new MTLLoader();
                break;
            case 1:
                this.MTLLoader = new MTLLoaderP();
                break;
        }

        this.manager = new THREE.LoadingManager();
        this.texLoader = new THREE.TextureLoader();
        this.objLoader = new OBJLoader(this.manager);
       
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight1.position.x = -400;
        directionalLight1.position.y = 100;
        directionalLight1.position.z = -800;
        this.scene.add(directionalLight1);

        /*
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight2.position.x = 20;
        directionalLight2.position.y = 10;
        directionalLight2.position.z = 20;
        this.scene.add(directionalLight2);
        */


        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(w, h);

        this.composer = null;

        var glDom = document.getElementById('gl-dom');
        if (glDom !== null) {
            glDom.appendChild(this.renderer.domElement);
        }

        this.materialInteractive = new THREE.MeshStandardMaterial({ color: 0xffFFFF });

        this.skidTex = this.texLoader.load("assets/textures/skid.png");
        this.skidTex.wrapS = THREE.RepeatWrapping;
        this.skidTex.wrapT = THREE.RepeatWrapping;
        this.skidTex.repeat.set(1, 1);

        this.skidPlane = new THREE.PlaneGeometry(0.8, 0.8, 1, 1);

        const neon = this.texLoader.load("assets/textures/plateforme.png");
        neon.wrapS = THREE.RepeatWrapping;
        neon.wrapT = THREE.RepeatWrapping;
        neon.repeat.set(1, 1);


        this.platformMaterial = new THREE.MeshPhongMaterial({ color: 0xffFFFF });
        this.platformMaterial.map = neon;
        this.platformMaterial.emissiveMap = neon;


        //this.arrowTex = this.texLoader.load("assets/textures/border/color_map.jpg");
        this.arrowTex = this.texLoader.load("assets/textures/arrows.png");
        this.arrowTex.wrapS = THREE.RepeatWrapping;
        this.arrowTex.wrapT = THREE.RepeatWrapping;
        this.arrowTex.repeat.set(1, 20);
        //this.arrowTex.rotation = -Math.PI /2;
        

        //const arrowsNormals = this.texLoader.load("assets/textures/border/normal_map_opengl.jpg");
        this.arrowsNormals = this.texLoader.load("assets/textures/arrows_n.png");
        this.arrowsNormals.wrapS = THREE.RepeatWrapping;
        this.arrowsNormals.wrapT = THREE.RepeatWrapping;
        this.arrowsNormals.repeat.set(1, 20);
        this.arrowsNormals.intensity = 1.0;
        //this.arrowsNormals.rotation = -Math.PI /2;

        
        this.arrowMat = new THREE.MeshLambertMaterial({ map: this.arrowTex, depthWrite :false, transparent : true});

        const texture = this.texLoader.load("assets/textures/wood.jpg");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        const normals = this.texLoader.load("assets/textures/wood_n.png");
        normals.wrapS = THREE.RepeatWrapping;
        normals.wrapT = THREE.RepeatWrapping;
        normals.repeat.set(1, 1);

        this.material2 = new THREE.MeshPhongMaterial({ color: 0xffFFFF });
        this.material2.map = texture;
        this.material2.normalMap = normals;

        const metal = new THREE.TextureLoader().load("assets/textures/metal.jpg");
        metal.wrapS = THREE.RepeatWrapping;
        metal.wrapT = THREE.RepeatWrapping;
        metal.repeat.set(1, 1);

        const metalnormals = new THREE.TextureLoader().load("assets/textures/metal_n.png");
        metalnormals.wrapS = THREE.RepeatWrapping;
        metalnormals.wrapT = THREE.RepeatWrapping;
        metalnormals.repeat.set(1, 1);

        this.bonusMaterial = new THREE.MeshPhongMaterial({ color: 0xffFFFF });
        this.bonusMaterial.map = metal;
        this.bonusMaterial.normalMap = metalnormals;

        this.clock = new THREE.Clock(true);
        this.lastTime = this.clock.getElapsedTime();

        this.camFollowCar = true;


        this.audioSamples = {};

        /*
        this.world = null;
        this.world = new CircuitRace(this);
        */

        this.numSamples = 0;
        this.lastSample = new Date().getTime();
        this.AudioMusic = new Audio();
        this.AudioMusicPlaying = false;
        this.engineSound = [];
        this.pads = [];

        this.GAME_PAD_KEY_MAPPING = { 'PadTop': 12, 'PadBottom': 13, 'PadLeft': 14, 'PadRight': 15 };

        this.tclassNames = ['C', 'B', 'A'];
        this.tdiffNames = ['easy', 'medium', 'hard'];

        const postProcessing = localStorage.getItem('postProcessing');

        if(postProcessing === null)
            this.postProcessing = true;    
        else{
            this.postProcessing = parseInt(postProcessing) === 1 ? true : false;
        }




        if (audio) {
            var sfxVolume = localStorage.getItem('sfxVolume');
            var musicVolume = localStorage.getItem('musicVolume');
            var engineVolume = localStorage.getItem('engineVolume');

            if (sfxVolume !== null) {
                SoundCfg.sfxVolume = sfxVolume;
            }
            if (musicVolume !== null) {
                SoundCfg.musicVolume = musicVolume;
            }
            if (engineVolume !== null) {
                SoundCfg.engineVolume = engineVolume;
            }

            var slider1 = document.getElementById("music-volume");
            slider1.value = SoundCfg.musicVolume;

            var slider2 = document.getElementById("engine-volume");
            slider2.value = SoundCfg.engineVolume;

            var slider3 = document.getElementById("sfx-volume");
            slider3.value = SoundCfg.sfxVolume;
        }
    }

    addFire(pos)
    {
        const particles = new ParticleEngine(this.scene, pos);
        candle_params.positionBase = pos;
        particles.setValues(candle_params);
        particles.initialize();


        this.particles.push(particles);
    }

    getPad(index) {
        return this.pads.find(p => p.index == index);
    }

    handleGamePadDisconnected(e) {
        this.removePad(e.gamepad.id);
        $('#pad').attr('src', '/assets/img/gamepad-icon-off.png');
    }

    handleGamePadConnected(e) {
        const pad = {
            index: e.gamepad.index,
            id: e.gamepad.id,
            nButtons: e.gamepad.buttons.length,
            nAxes: e.gamepad.axes.length,
            pressed: [],
            axes: [],
        };

        for (let i = 0; i < e.gamepad.buttons.length; i++) {
            pad.pressed[i] = e.gamepad.buttons[i].pressed;
        }

        for (let i = 0; i < e.gamepad.axes.length; i++) {
            pad.axes[i] = e.gamepad.axes[i];
        }

        $('#pad').attr('src', '/assets/img/gamepad-icon.png');

        this.pads.push(pad);
    }

    updatePadsStatus() {
        const navigator = window.navigator;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

        var events = [];

        for (const gamepad of gamepads) {
            if (!gamepad) {
                continue;
            }

            

            const pad = this.getPad(gamepad.index);
            if (pad != null) {
                for (let n = 0; n < gamepad.buttons.length; n++) {
                    if (gamepad.buttons[n].pressed == pad.pressed[n]) {
                        continue;
                    }
                    pad.pressed[n] = gamepad.buttons[n].pressed;
                    events.push({ idx: pad.index, btn: n });
                }

                for (let n = 0; n < gamepad.axes.length; n++) {
                    if (Math.abs(gamepad.axes[n]-pad.axes[n]) < 0.1 ) {
                        continue;
                    }
                    pad.axes[n] = gamepad.axes[n];
                    events.push({ idx: pad.index, axis: n });
                }

            }
        }

        return events;
    }

    initAudio() {
        this.audioCtx = new AudioContext();

        this.sfxGainNode = this.audioCtx.createGain();
        this.sfxGainNode.gain.value = SoundCfg.sfxVolume / 100.0;
        this.sfxGainNode.connect(this.audioCtx.destination);

        this.enginegainNode = this.audioCtx.createGain();
        this.enginegainNode.gain.value = SoundCfg.engineVolume / 100.0;
        this.enginegainNode.connect(this.audioCtx.destination);
    }

    setMusicVolume(volume) {
        SoundCfg.musicVolume = volume;
        localStorage.setItem('musicVolume', SoundCfg.musicVolume);

        if (this.AudioMusic)
            this.AudioMusic.volume = SoundCfg.musicVolume / 100.0;

    }

    setEngineVolume(volume) {
        SoundCfg.engineVolume = volume;
        localStorage.setItem('engineVolume', SoundCfg.engineVolume);

        if (this.enginegainNode)
            this.enginegainNode.gain.value = SoundCfg.engineVolume / 100.0;
    }

    setSFXVolume(volume) {
        SoundCfg.sfxVolume = volume;
        localStorage.setItem('sfxVolume', SoundCfg.sfxVolume);

        if (this.sfxGainNode)
            this.sfxGainNode.gain.value = SoundCfg.sfxVolume / 100.0;
    }

    isBetween(min, v, max) {
        if (v < min)
            return false;

        if (v > max)
            return false;

        return true;
    }

    clamp(p, min, max) {

        return Math.min(Math.max(p, min), max);
    }



    async setEngineSoundPath(path) {
        this.engineSound = [];

        for (let n = 0; n < path.length; n++) {
            const response = await fetch(path[n].file);
            const aBuffer = await response.arrayBuffer();
            const buffer = await this.audioCtx.decodeAudioData(aBuffer);

            const node = this.audioCtx.createBufferSource();
            node.buffer = buffer;
            node.loop = true;
            node.connect(this.enginegainNode);

            this.engineSound[n] = { path: path[n].file, buffer: buffer, node: node, pitch: path[n].pitch, playing: false, curPitch: path[n].pitch };
        }
    }

    findBestNode(pitch) {
        let result = null;
        let bestRatio = 0.0;

        for (let snd of this.engineSound) {
            let recorded = snd.pitch;
            let ratio;
            if (pitch > recorded) {
                ratio = recorded / pitch;
            } else {
                ratio = pitch / recorded;
            }

            //console.log('pitch '+pitch+' rec:'+recorded+' ratio:'+ratio);

            //if( ratio > 0.0 && ratio < 1.0)

            if (ratio > bestRatio) {
                bestRatio = ratio;
                result = snd;
            }
        }

        if (bestRatio === 0)
            return this.engineSound[0];

        return result;
    }

    canAccuratelySimulate(node, pitch) {
        let minPitch = 0.5 * node.pitch;
        let maxPitch = 2 * node.pitch;
        return this.isBetween(minPitch, pitch, maxPitch);
    }

    setPitch(pitch) {

        if (this.activeNode == null || !this.canAccuratelySimulate(this.activeNode, pitch)) {
            // Find the best AudioNode for the desired pitch.
            var bestNode = this.findBestNode(pitch);

            if (bestNode != this.activeNode && this.activeNode != null) {

                this.activeNode.node.stop();
                this.activeNode.playing = false;

                //console.log("change pitch "+pitch);
                //console.log(bestNode);

            }
            this.activeNode = bestNode;
        }

        if (!this.activeNode) {
            console.log('no active node ' + pitch);
            return;
        }

        const playbackSpeed = pitch / this.activeNode.pitch;
        const clampedSpeed = this.clamp(playbackSpeed, 0.5, 2);

        if (playbackSpeed != clampedSpeed) {
            //console.log("Clamped playback speed: sound="+pitch+", pitch={"+this.activeNode.pitch+"} Hz to "+clampedSpeed);
        }

        if (clampedSpeed != this.activeNode.curPitch) {
            this.activeNode.curPitch = clampedSpeed;
            this.activeNode.node.playbackRate.value = this.activeNode.curPitch;
        }

        if (!this.activeNode.playing) {

            //console.log("start new node ");
            this.activeNode.node = this.audioCtx.createBufferSource();
            this.activeNode.node.buffer = this.activeNode.buffer;
            this.activeNode.node.loop = true;
            this.activeNode.node.connect(this.enginegainNode);
            this.activeNode.node.start(0);
            this.activeNode.playing = true;
        }
    }

    async stopEngine() {
        for (let snd of this.engineSound) {

            if (snd.playing)
                snd.node.stop();
        }
    }

    async loadSample(audioFile, name) {
        const response = await fetch(audioFile);
        const aBuffer = await response.arrayBuffer();
        const buffer = await this.audioCtx.decodeAudioData(aBuffer);

        this.audioSamples[name] = { file: audioFile, buffer: buffer };
    }

    playMusic(url) {
        if (!this.AudioMusicPlaying) {

            this.AudioMusic.src = url;
            this.AudioMusic.volume = SoundCfg.musicVolume / 100;
            this.AudioMusicPlaying = true;
        }
    }

    async playAudio(sample, volume) {
        const now = new Date().getTime();

        if (!this.audioSamples[sample])
            return;

        if (this.audioSamples[sample].buffer == null) {
            return;
        }

        if ((now - this.lastSample) < 150)
            return;

        if (this.numSamples >= 15)
            return;

        const self = this;

        const track = this.audioCtx.createBufferSource();
        track.buffer = this.audioSamples[sample].buffer;
        track.connect(this.sfxGainNode);
        track.start(0);

        this.numSamples++;
        this.lastSample = new Date().getTime();

        track.addEventListener('ended', () => {
            self.numSamples--;
        })
    }

    async loadDigitFont()
    {
        this.digitsTex=[];
        this.digitsMat = [];

        for(let n=0; n< 10;n++)
        {
            this.digitsTex[n] = this.texLoader.load("assets/fonts/"+n+".png");
            this.digitsTex[n].wrapS = THREE.ClampToEdgeWrapping;
            this.digitsTex[n].wrapT = THREE.ClampToEdgeWrapping;
            this.digitsTex[n].repeat.set(1, 1);

            this.digitsMat[n] = new THREE.SpriteMaterial({ map: this.digitsTex[n], color: 0xffffff });

            this.digitsMat[n].depthTest = false;
            this.digitsMat[n].depthWrite = false;
        }
        
        this.digits[0] = new THREE.Sprite(this.digitsMat[0]);
        this.digits[1] = new THREE.Sprite(this.digitsMat[0]);
        this.digits[2] = new THREE.Sprite(this.digitsMat[0]);

        this.digits[0].position.x = -90;
        this.digits[0].position.y =  -45;
        this.digits[0].scale.set(15, 15, 1)

        this.digits[1].position.x = -75;
        this.digits[1].position.y =  -45;
        this.digits[1].scale.set(15, 15, 1)

        this.digits[2].position.x = -60;
        this.digits[2].position.y =  -45;
        this.digits[2].scale.set(15, 15, 1)

        this.sceneUI.add(this.digits[0]);
        this.sceneUI.add(this.digits[1]);
        this.sceneUI.add(this.digits[2]);        
        
    }

    drawText(text)
    {
        if(this.digits.length<3)
            return;

        const nc = text.length;
        const nnc = 3 - nc;


        for(let n=0;n<nnc;n++)
        {
            this.digits[n].material = this.digitsMat[0];
        }

        for(let n=nnc;n<3;n++)
        {
            const nm = parseInt(text[n-nnc]);
            this.digits[n].material = this.digitsMat[nm];
        }
    }

    async loadPlatform(name) {
        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
        materials.preload();

        this.objLoader.setMaterials(materials);
        const object = await this.objLoader.loadAsync("assets/mesh/" + name + ".obj");
        const self= this;
        object.traverse((child) => {

            if (child.type == 'Mesh') {
                self.plateform = child;
                //this.plateform.material.envMap = this.skyTexture;
                self.plateform.material.transmission = 1.0;
                self.plateform.material.thickness = 0.2;
                self.plateform.material.roughness = 0.0;
                self.plateform.material.reflectivity= 0.1;

                
            }
        });
    }

    
    async loadStartLine(track, startname) {

        const self= this;

        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + startname + ".mtl");
        materials.preload();

        this.objLoader.setMaterials(materials);
        const object = await this.objLoader.loadAsync("assets/mesh/" + startname + ".obj");

        object.traverse((child) => {

            if (child.type == 'Mesh') {
                self.startLine = child;

                self.startLine.position.set(track.trackPoints[track.startPts].pos.x, track.trackPoints[track.startPts].pos.y, track.trackPoints[track.startPts].pos.z);
                self.startLine.quaternion.set(track.trackPoints[track.startPts].rot.x, track.trackPoints[track.startPts].rot.y, track.trackPoints[track.startPts].rot.z, track.trackPoints[track.startPts].rot.w);
            }
        });
    }

    async createTrack(track)
    {
        await this.loadStartLine(track, 'start');
        await this.makeTrack(track);
        await this.loadTerrain(track);

        
    }

    async makeWalls(track, obj)
    {
        for(let wall of track.walls)
        {
            wall.object = obj.clone();
            wall.object.material = obj.material;
            wall.object.position.x = wall.pos.x;
            wall.object.position.y = wall.pos.y;
            wall.object.position.z = wall.pos.z;
    
            wall.object.rotation.x = wall.eul.x;
            wall.object.rotation.y = wall.eul.y;
            wall.object.rotation.z = wall.eul.z;
        }
    }

    createRoadMat(track) {
        this.roadMaT = new THREE.MeshPhysicalMaterial({ color: 0xffFFFF });

        this.roadMaT.transmission = 0.0;
        this.roadMaT.thickness = 0.0;
        this.roadMaT.reflectivity= 0.4;

        this.roadMaT.envMap = this.skyTexture;
        this.roadMaT.envMapIntensity = 4;


        this.roadMaT.map = this.texLoader.load("assets/textures/" + track.roadTex);
        this.roadMaT.map.wrapS = THREE.RepeatWrapping;
        this.roadMaT.map.wrapT = THREE.RepeatWrapping;
        this.roadMaT.map.repeat.set(track.roadTexScale.x, track.roadTexScale.y);
        this.roadMaT.side = THREE.DoubleSide;

        if (track.roadNorm) {
            this.roadMaT.normalMap = this.texLoader.load("assets/textures/" + track.roadNorm);
            this.roadMaT.normalMap.wrapS = THREE.RepeatWrapping;
            this.roadMaT.normalMap.wrapT = THREE.RepeatWrapping;
            this.roadMaT.normalMap.intensity = 0.4;
            this.roadMaT.roughness = 0.05;
            this.roadMaT.normalScale = new THREE.Vector2(1.4, 1.4);
            this.roadMaT.normalMap.repeat.set(track.roadTexScale.x, track.roadTexScale.y);
        }

        /*
        if (track.roadSpec) {
            track.roadMaT.specularMap = this.texLoader.load("assets/textures/" + track.roadSpec);
            track.roadMaT.specularMap.wrapS = THREE.RepeatWrapping;
            track.roadMaT.specularMap.wrapT = THREE.RepeatWrapping;
            track.roadMaT.specularMap.repeat.set(track.roadTexScale.x, track.roadTexScale.y);
        }
        */

        if (track.roadRought) {
            this.roadMaT.roughnessMap = this.texLoader.load("assets/textures/" + track.roadRought);
            this.roadMaT.roughnessMap.wrapS = THREE.RepeatWrapping;
            this.roadMaT.roughnessMap.wrapT = THREE.RepeatWrapping;
            this.roadMaT.roughnessMap.repeat.set(track.roadTexScale.x, track.roadTexScale.y);
        }


        if (track.roadEmm) {
            this.roadMaT.emissiveMap = this.texLoader.load("assets/textures/" + track.roadEmm);
            this.roadMaT.emissiveMap.wrapS = THREE.RepeatWrapping;
            this.roadMaT.emissiveMap.wrapT = THREE.RepeatWrapping;
            this.roadMaT.emissiveMap.repeat.set(track.roadTexScale.x, track.roadTexScale.y);
            this.roadMaT.emissive.r = 0.4;
            this.roadMaT.emissive.g = 0.4;
            this.roadMaT.emissive.b = 0.4;
            this.roadMaT.emissiveIntensity = 1.0;
        }


    }


    createTrackGeometry(track)
    {
        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(track.indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(track.positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(track.texcoords, 2));

        geometry.addGroup(0,track.NPoints * 6, 0);
        geometry.addGroup(track.NPoints * 6, track.NPoints * 12, 1);
        geometry.computeVertexNormals();

        track.roadObj = new THREE.Mesh(geometry, [this.roadMaT, this.arrowMat]);
        track.roadObj.name = "TrackMesh";
    }


    async makeTrack(track) {
        if (this.creating)
            return;

        this.creating = true;


        if (!track.roadTexScale)
            track.roadTexScale = { x: 2, y: 4 };
   
        this.createRoadMat(track);
        this.createTrackGeometry(track);

        const self = this;

        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + track.wallName + ".mtl");
        materials.preload();

        this.objLoader.setMaterials(materials);
        this.wallObject = await this.objLoader.loadAsync("assets/mesh/" + track.wallName + ".obj");

        this.wallObject.traverse((child) => {

            if (child.type == 'Mesh') {
                
                self.makeWalls(track, child);
            }
        });

        this.creating = false;
    }


    createWheelMesh(radius, width) {

        const mat = new THREE.MeshStandardMaterial({ color: 0xffFFFF });

        var t = new THREE.CylinderGeometry(radius, radius, width, 24, 1);
        t.rotateZ(Math.PI / 2);
        const WheelMesh = new THREE.Mesh(t, mat);
        WheelMesh.add(new THREE.Mesh(new THREE.BoxGeometry(width * 1.5, radius * 1.75, radius * .25, 1, 1, 1), mat));
        return WheelMesh;
    }

    createChassisMesh(w, l, h) {

        var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
        this.ChassisMesh = new THREE.Mesh(shape, this.materialInteractive);
        return this.ChassisMesh;
    }


    
    async loadTerrain(track) {
           
        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + track.terrain.name + ".mtl");
        materials.preload();

        this.objLoader.setMaterials(materials);
        track.terrain.mesh = await this.objLoader.loadAsync("assets/mesh/" + track.terrain.name + ".obj");
        
        track.terrain.mesh.position.set(track.terrain.offset.x, track.terrain.offset.y, track.terrain.offset.z);

        track.terrain.mesh.traverse((child) => {

            if ((child.name.startsWith('Wheel'))||(child.name.startsWith('Crystal'))||(child.name.startsWith('buddha')) ||(child.name.startsWith('fire-start'))) {

                child.geometry.computeBoundingSphere();

                const gc = { x: child.geometry.boundingSphere.center.x, y: child.geometry.boundingSphere.center.y, z: child.geometry.boundingSphere.center.z };

                child.geometry.translate(-gc.x, -gc.y, -gc.z);
                child.position.set(gc.x, gc.y, gc.z);
            }
        
            if (child.name == 'Plane') {
                self.ground = child;
            }
        });
  
    }


    async loadCar(car) {


        const chassisMaterials = await this.MTLLoader.loadAsync("/assets/mesh/" + car.carDef.chassis + ".mtl");
        chassisMaterials.preload();
        
        this.objLoader.setMaterials(chassisMaterials);
        const object = await this.objLoader.loadAsync("/assets/mesh/" + car.carDef.chassis + ".obj");

        object.traverse((child) => {

            if (child.type == 'Mesh') {

                child.castShadow = true;
                child.receiveShadow = true;

                child.geometry.computeBoundingBox();
                car.ChassisMesh = child;
            }
        });

        if (car.carDef.suspension) {

            const tireMaterials = await this.MTLLoader.loadAsync("/assets/mesh/" + car.carDef.suspension.tire + ".mtl");
            tireMaterials.preload();
            
            this.objLoader.setMaterials(tireMaterials);
            const tireObj = await this.objLoader.loadAsync("/assets/mesh/" + car.carDef.suspension.tire + ".obj");
            tireObj.traverse((child) => {

                if (child.type == 'Mesh') {

                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.geometry.computeBoundingBox();
                    car.tireMesh = child;
                }
            });
        }

        if (car.ChassisMesh == null) {
            car.chassisWidth = 1.8;
            car.chassisHeight = .6;
            car.chassisLength = 4;

            car.ChassisMesh = this.createChassisMesh(car.chassisWidth, car.chassisHeight, car.chassisLength);

            car.center = car.pos.clone();
        } else {

            const bbox = car.ChassisMesh.geometry.boundingBox;

            car.chassisWidth = bbox.max.x - bbox.min.x;
            car.chassisHeight = bbox.max.y - bbox.min.y;
            car.chassisLength = bbox.max.z - bbox.min.z;

            car.center = new THREE.Vector3(car.pos.x + bbox.min.x + car.chassisWidth / 2, car.pos.y + bbox.min.y + car.chassisHeight / 2, car.pos.z + bbox.min.z + car.chassisLength / 2);
        }

        car.updateWheels();

        for (let n = 0; n < 4; n++) {

            car.wheels[n].mesh = (car.tireMesh === null) ? this.createWheelMesh(car.wheels[n].radius, car.wheels[n].width) : car.tireMesh.clone();

            if (car.wheels[n].pos.x < 0)
                car.wheels[n].mesh.scale.x = 1;
            else
                car.wheels[n].mesh.scale.x = -1;

            car.wheels[n].mesh.position.x = car.wheels[n].pos.x;
            car.wheels[n].mesh.position.y = car.wheels[n].pos.y;
            car.wheels[n].mesh.position.z = car.wheels[n].pos.z;
        }

        car.massVehicle = car.carDef.massVehicle;
    }


    loadPod() {

        this.podMat = new THREE.MeshPhongMaterial({ color: 0xffFFFF });

        const podTex = this.texLoader.load("assets/textures/tiles_0042_color_1k.jpg");
        podTex.wrapS = THREE.RepeatWrapping;
        podTex.wrapT = THREE.RepeatWrapping;
        podTex.repeat.set(1, 1);

        const podNormals = this.texLoader.load("assets/textures/tiles_0042_normal_opengl_1k.png");
        podNormals.wrapS = THREE.RepeatWrapping;
        podNormals.wrapT = THREE.RepeatWrapping;
        podNormals.repeat.set(1, 1);

        this.podMat.map = podTex;
        this.podMat.normalMap = podNormals;

        this.podGeom = new THREE.CylinderGeometry(3, 3, 0.5, 64, 1);
        this.podMesh = new THREE.Mesh(this.podGeom, this.podMat);
        this.podMesh.position.y = -0.8;

        this.podMesh.receiveShadow = true;
        this.podMesh.castShadow = false;


        this.scene.add(this.podMesh);
    }

    updateCamera(myCar, loop, tube, tmesh, dt) {

        const p = myCar.ChassisMesh.position;
        const r = myCar.ChassisMesh.quaternion;

        if (myCar.ChassisMesh === null)
            return;

        if ((loop !== null) && (p.distanceTo(loop.center) < loop.height)) {
            this.camDest = new THREE.Vector3(loop.center.x, loop.center.y, loop.center.z);
            this.targetFov = 55;

            if (loop.hide.length > 0) {
                const objects = loop.hide.split(',');

                for (let obj of objects) {
                    tmesh.traverse((child) => {

                        if (child.name === obj) {
                            child.visible = false;
                            this.hiddenObjects.push(child);
                        }
                    });
                }
            }

            this.camera.position.x = this.camDest.x;
            this.camera.position.y = this.camDest.y;
            this.camera.position.z = this.camDest.z;
            this.camera.lookAt(p.x, p.y, p.z);
        }
        else if ((tube !== null) && (p.distanceTo(tube.center) < tube.width)) {
            this.camDest = new THREE.Vector3(tube.center.x, tube.center.y, tube.center.z);
            this.targetFov = 75;

            this.camera.position.x = this.camDest.x;
            this.camera.position.y = this.camDest.y;
            this.camera.position.z = this.camDest.z;
            this.camera.lookAt(p.x, p.y, p.z);

        }
        else {
            this.targetFov = 100;

            let obj = null;

            while ((obj = this.hiddenObjects.pop()) != null) {
                obj.visible = true;
            }
            const camOfset = new THREE.Vector3(0, 2.5, -2.5).applyQuaternion(myCar.ChassisMesh.quaternion);
            const camDest = new THREE.Vector3().addVectors(p, camOfset);
            const t = new THREE.Vector3(0, 0, 5).applyQuaternion(myCar.ChassisMesh.quaternion);

            switch (this.camMode) {
                case 1:
                    this.camera.position.x = camDest.x;
                    this.camera.position.y = camDest.y;
                    this.camera.position.z = camDest.z;
                    this.camera.lookAt(p.x, p.y, p.z);
                    this.lastCamAngle = null;
                    break;
                case 2:

                    const frontVec = new THREE.Vector3(0, 0, 1.0).applyQuaternion(myCar.ChassisMesh.quaternion);
                    /*const camDiff = new THREE.Vector3().subVectors(camDest, this.camera.position);*/
                    

                    /*const camAngle = Math.atan2(camDiff.x, camDiff.z);*/
                    const carAngle = Math.atan2(frontVec.x, frontVec.z);
                    let curAngle = carAngle;

                    if (this.lastCamAngle !== null) {
                        if ((carAngle - this.lastCamAngle) < - Math.PI)
                            this.lastCamAngle -= Math.PI * 2;
                        else if ((carAngle - this.lastCamAngle) > Math.PI)
                            this.lastCamAngle += Math.PI * 2;

                        curAngle = this.lastCamAngle + ((carAngle - this.lastCamAngle) * 2 * dt)
                    }

                    //console.log('carAngle:'+carAngle + ' curAngle: '+curAngle+' this.lastCamAngle:'+this.lastCamAngle +' dt:'+dt);

                    const d = 7;

                    //const camMove = camDiff.clone().multiplyScalar(dt * 3);

                    this.camera.position.x = p.x - Math.sin(curAngle) * d;
                    this.camera.position.y = p.y + 2.5;
                    this.camera.position.z = p.z - Math.cos(curAngle) * d;

                    this.camera.rotation.x = 0;
                    this.camera.rotation.y = curAngle + Math.PI;
                    this.camera.rotation.z = 0;

                    this.lastCamAngle = curAngle;
                    //this.camera.lookAt(p.x, p.y, p.z);
                    break;
                case 3:
                    this.camera.position.x = camDest.x;
                    this.camera.position.y = p.y + 8;
                    this.camera.position.z = camDest.z;
                    this.camera.lookAt(p.x + t.x, p.y + t.y, p.z + t.z);
                    this.lastCamAngle = null;
                    break;
                case 4:
                    const frontOfset = new THREE.Vector3(0, 1.3, 1.2).applyQuaternion(myCar.ChassisMesh.quaternion);
                    this.camera.position.x = p.x + frontOfset.x;
                    this.camera.position.y = p.y + frontOfset.y;
                    this.camera.position.z = p.z + frontOfset.z;

                    this.camera.lookAt(p.x + t.x, p.y + t.y, p.z + t.z);
                    this.lastCamAngle = null;


                    break;
            }

        }




        /*
        */
        /*
        if(this.lastCamPos)
        {
            this.camera.lookAt( this.lastCamPos.x, this.lastCamPos.y, this.lastCamPos.z );
            const q1 = new THREE.Quaternion().copy( this.camera.quaternion );

            this.camera.lookAt(p.x, p.y, p.z);
            const q2 = new THREE.Quaternion().copy( this.camera.quaternion );

            this.camera.quaternion.slerpQuaternions( q1, q2, dt ); // 0 < time < 
        }
        else
        */


        //this.lastCamAngle = this.camera.quaternion.clone();
        this.lastCamPos = p.clone();

        const fovDiff = this.targetFov - this.camera.fov;
        const fovMov = fovDiff / 20;
        this.camera.fov += fovMov;
    }

    
    updateCars(world, time) {

        const cars = world.lastCarData.cars;
        const woods = world.lastCarData.woods;
        const bonuses = world.lastCarData.bonuses;
        const turrets = world.lastCarData.turrets;
        const springs = world.lastCarData.springs;
        const ropes = world.lastCarData.ropes;

        const delta = time - world.lastBufferTime;

        for (let n = 0; n < cars.length; n++) {
            
            let mycar = null;

            for(let i=0;i<world.cars.length;i++)
            {
                if(world.cars[i].servId == cars[n].id)
                {
                    mycar = world.cars[i];
                    break;
                }
            }

            if ((world.deltaTime !== null) && (delta < world.deltaTime)) {

                let x, y, z, q;
                if (mycar.lastPos) {

                    x = mycar.lastPos.x + world.dataDelta.cars[n].pos.x * delta / world.deltaTime;
                    y = mycar.lastPos.y + world.dataDelta.cars[n].pos.y * delta / world.deltaTime;
                    z = mycar.lastPos.z + world.dataDelta.cars[n].pos.z * delta / world.deltaTime;
                    mycar.ChassisMesh.position.set(x, y, z);


                    //mycar.ChassisMesh.position.set(cars[n].pos.x, cars[n].pos.y, cars[n].pos.z);
                }
                mycar.lastPos = new THREE.Vector3(x, y, z);

                if (mycar.lastAngle) {
                    /*
                    const qq = new THREE.Quaternion(cars[n].quat.x, cars[n].quat.y, cars[n].quat.z, cars[n].quat.w);
                    q= new THREE.Quaternion().slerpQuaternions(mycar.lastAngle,qq, delta / world.deltaTime)
                    mycar.ChassisMesh.quaternion.set(q.x, q.y, q.z, q.w);
                    */

                    mycar.ChassisMesh.quaternion.set(cars[n].quat.x, cars[n].quat.y, cars[n].quat.z, cars[n].quat.w);
                }
                mycar.lastAngle = q.clone();
            }
            else {

                mycar.ChassisMesh.position.set(cars[n].pos.x, cars[n].pos.y, cars[n].pos.z);
                mycar.ChassisMesh.quaternion.set(cars[n].quat.x, cars[n].quat.y, cars[n].quat.z, cars[n].quat.w);
            }

            mycar.remainingTime = cars[n].remainingTime;

            mycar.speed = cars[n].speed;
            mycar.RPM = cars[n].RPM;
            mycar.damage = cars[n].damage;
            mycar.curSeg = parseInt(cars[n].curSeg);
            mycar.nLaps = parseInt(cars[n].nLaps);

            mycar.nitros = cars[n].nitros;
            mycar.nextNitro = cars[n].nextNitro;
            mycar.nBonus = parseInt(cars[n].nBonus);
            mycar.multiplier = cars[n].multiplier.toFixed(1);

            for (let i = 0; i < cars[n].contacts.length; i++) {
                mycar.addContact(cars[n].contacts[i], cars[n].contactsDMG[i], time);
            }

            for (let i = 0; i < cars[n].wheels.length; i++) {

                const skid = 1.0 - cars[n].wheels[i].skidding;

                if (skid > 0.1) {
                    const pos = new THREE.Vector3(cars[n].wheels[i].pos.x, cars[n].wheels[i].pos.y, cars[n].wheels[i].pos.z);
                    const down = new THREE.Vector3(0, -1, 0);

                    const rc = new THREE.Raycaster(pos, down, 0.0, 10.0);
                    const pts = rc.intersectObjects([world.track.roadObj]);

                    for (let p = 0; p < pts.length; p++) {

                        mycar.addSkidding(pts[p].point, cars[n].wheels[i].contactNormal, skid, time);

                        if ((time - world.lastScreech) > 0.1) {
                            
                            this.playAudio('screech', skid);
                            world.lastScreech = time;
                        }
                    }
                }

                if (mycar.wheels[i].mesh) {
                    mycar.wheels[i].mesh.position.set(cars[n].wheels[i].pos.x, cars[n].wheels[i].pos.y, cars[n].wheels[i].pos.z);
                    mycar.wheels[i].mesh.quaternion.set(cars[n].wheels[i].quat.x, cars[n].wheels[i].quat.y, cars[n].wheels[i].quat.z, cars[n].wheels[i].quat.w);
                }
            }
        }

        $('#user-bonus-multiplier').html('x ' + world.myCar.multiplier);

        if (woods.length > 0) {
            let c = 0;
            for (let n = 0; n < world.track.woods.length; n++) {
                for (let i = 0; i < world.track.woods[n].objects.length; i++) {
                    world.track.woods[n].objects[i].object.position.set(woods[c].pos.x, woods[c].pos.y, woods[c].pos.z);
                    world.track.woods[n].objects[i].object.quaternion.set(woods[c].quat.x, woods[c].quat.y, woods[c].quat.z, woods[c].quat.w);
                    c++;
                }
            }
        }

        if (turrets.length > 0) {

            for (let n = 0; n < world.track.turrets.length; n++) {

                world.track.turrets[n].headAngle = world.lastCarData.turrets[n].headAngle;

                //const eul = new THREE.Euler(0,0,0,"XYZ");
                //const q = new THREE.Quaternion().setFromEuler(eul).multiply(world.track.turrets[n].rot.conjugate().clone());
                //const me = new THREE.Euler().setFromQuaternion(q);

                //world.track.turrets[n].head.rotation.x = me.x;
                world.track.turrets[n].head.rotation.y = world.track.turrets[n].headAngle - Math.PI / 2;
                //world.track.turrets[n].head.rotation.z = me.z;

                var rem = [];
                let j = 0;

                while (j < world.track.turrets[n].shots.length) {
                    let fnd = false;

                    for (let i = 0; i < world.lastCarData.turrets[n].shots.length; i++) {
                        if (world.track.turrets[n].shots[j].id === world.lastCarData.turrets[n].shots[i].id) {
                            fnd = true;
                            break;
                        }
                    }

                    if (!fnd) {
                        this.scene.remove(world.track.turrets[n].shots[j].object);
                        world.track.turrets[n].shots.splice(j, 1);
                    }
                    else
                        j++;
                }


                for (let i = 0; i < world.lastCarData.turrets[n].shots.length; i++) {
                    let fnd = false;
                    for (let j = 0; j < world.track.turrets[n].shots.length; j++) {
                        if (world.track.turrets[n].shots[j].id === world.lastCarData.turrets[n].shots[i].id) {
                            world.track.turrets[n].shots[j].object.position.x = world.lastCarData.turrets[n].shots[i].pos.x;
                            world.track.turrets[n].shots[j].object.position.y = world.lastCarData.turrets[n].shots[i].pos.y;
                            world.track.turrets[n].shots[j].object.position.z = world.lastCarData.turrets[n].shots[i].pos.z;
                            fnd = true;
                            break;
                        }
                    }

                    if (!fnd) {
                        var newshot = {};

                        if (world.track.turrets[n].shotObject)
                            newshot.object = world.track.turrets[n].shotObject.clone();
                        else
                            newshot.object = new THREE.Mesh(world.track.sphereShot, world.SphereMaterial);;

                        newshot.id = world.lastCarData.turrets[n].shots[i].id;

                        newshot.object.scale.x = world.track.turrets[n].projSize;
                        newshot.object.scale.y = world.track.turrets[n].projSize;
                        newshot.object.scale.z = world.track.turrets[n].projSize;

                        this.scene.add(newshot.object);


                        newshot.object.position.x = world.lastCarData.turrets[n].shots[i].pos.x;
                        newshot.object.position.y = world.lastCarData.turrets[n].shots[i].pos.y;
                        newshot.object.position.z = world.lastCarData.turrets[n].shots[i].pos.z;
                        world.track.turrets[n].shots.push(newshot);
                    }
                }
            }
        }





        if (bonuses.length > 0) {

            //console.log(bonuses)

            for (let n = 0; n < world.track.bonuses.length; n++) {
                world.track.bonuses[n].taken = bonuses[n].taken;
                world.track.bonuses[n].scale = bonuses[n].scale;

                world.track.bonuses[n].object.scale.x = world.track.bonuses[n].scale;
                world.track.bonuses[n].object.scale.y = world.track.bonuses[n].scale;
                world.track.bonuses[n].object.scale.z = world.track.bonuses[n].scale;

                if (bonuses[n].taken !== 0) {
                    if (world.track.bonuses[n].enabled === true) {
                        world.track.bonuses[n].object.visible = false;
                        world.track.bonuses[n].enabled = false;

                        this.playAudio('coin', 0.8);
                        $('#user-bonus').html('x' + world.myCar.nBonus);
                    }
                }
                else if (world.track.bonuses[n].enabled === false) {
                    world.track.bonuses[n].object.visible = true;
                    world.track.bonuses[n].enabled = true;
                }

                //world.track.bonuses[n].object.quaternion.set(bonuses[n].quat.x,bonuses[n].quat.y, bonuses[n].quat.z, bonuses[n].quat.w);
            }

        }


        if (springs.length > 0) {
            let c = 0;
            for (let n = 0; n < world.track.springs.length; n++) {
                world.track.springs[n].obj.object.position.set(springs[n].pos.x, springs[n].pos.y, springs[n].pos.z);
                world.track.springs[n].obj.object.quaternion.set(springs[n].quat.x, springs[n].quat.y, springs[n].quat.z, springs[n].quat.w);
            }
        }

        if (ropes.length > 0) {
            let c = 0;
            for (let n = 0; n < world.track.ropes.length; n++) {
                world.track.ropes[n].obj.object.position.set(ropes[n].pos.x, ropes[n].pos.y, ropes[n].pos.z);
                world.track.ropes[n].obj.object.quaternion.set(ropes[n].quat.x, ropes[n].quat.y, ropes[n].quat.z, ropes[n].quat.w);
            }
        }
    }


    addTrackRope(rope) {

        const a = new THREE.SphereGeometry(0.2);
        rope.anchor.object = new THREE.Mesh(a, this.platformMaterial);

        rope.anchor.object.position.x = rope.anchor.pos.x;
        rope.anchor.object.position.y = rope.anchor.pos.y;
        rope.anchor.object.position.z = rope.anchor.pos.z;

        if (object) {
            rope.obj.object = object.clone();
            rope.obj.object.scale.set(rope.obj.size.x, rope.obj.size.y, rope.obj.size.z);
        }
        else {
            const t = rope.obj.shape === 0 ? new THREE.BoxGeometry(rope.obj.size.x, rope.obj.size.y, rope.obj.size.z) : new THREE.CylinderGeometry(rope.obj.size.x / 2, rope.obj.size.x / 2, rope.obj.size.y, 12);
            rope.obj.object = new THREE.Mesh(t, this.platformMaterial);
        }

        rope.obj.object.position.x = rope.obj.pos.x;
        rope.obj.object.position.y = rope.obj.pos.y;
        rope.obj.object.position.z = rope.obj.pos.z;

        rope.obj.object.rotation.x = rope.obj.angles.x;
        rope.obj.object.rotation.y = rope.obj.angles.y;
        rope.obj.object.rotation.z = rope.obj.angles.z;

        this.scene.add(rope.anchor.object);
        this.scene.add(rope.obj.object);
    }

    addTrackSpring(spring) {
        
        const a = new THREE.SphereGeometry(0.2);
        spring.anchor.object = new THREE.Mesh(a, this.platformMaterial);

        spring.anchor.object.position.x = spring.anchor.pos.x;
        spring.anchor.object.position.y = spring.anchor.pos.y;
        spring.anchor.object.position.z = spring.anchor.pos.z;

        if (object) {
            spring.obj.object = object.clone();
            spring.obj.object.scale.set(spring.obj.size.x, spring.obj.size.y, spring.obj.size.z);
        }
        else {
            const t = spring.obj.shape === 0 ? new THREE.BoxGeometry(spring.obj.size.x, spring.obj.size.y, spring.obj.size.z) : new THREE.CylinderGeometry(spring.obj.size.x / 2, spring.obj.size.x / 2, spring.obj.size.y, 12);
            spring.obj.object = new THREE.Mesh(t, this.platformMaterial);
        }

        spring.obj.object.position.x = spring.obj.pos.x;
        spring.obj.object.position.y = spring.obj.pos.y;
        spring.obj.object.position.z = spring.obj.pos.z;

        spring.obj.object.rotation.x = spring.obj.angles.x;
        spring.obj.object.rotation.y = spring.obj.angles.y;
        spring.obj.object.rotation.z = spring.obj.angles.z;

        this.scene.add(spring.anchor.object);
        this.scene.add(spring.obj.object);
    }

    addTrackbonus(bonus, object = null) {
        

        if (object === null) {
            const t = new THREE.CylinderGeometry(bonus.scale, bonus.scale, 0.2);
            bonus.object = new THREE.Mesh(t, this.bonusMaterial);
        } else {

            object.traverse((child) => {

                if (child.type == 'Mesh') {
                    bonus.object = child.clone();

                    bonus.object.materials = child.materials;
                    bonus.object.castShadow = true;
                    bonus.object.receiveShadow = false;
                }
            });
        }

        bonus.object.position.x =  bonus.pos.x;
        bonus.object.position.y =  bonus.pos.y;
        bonus.object.position.z =  bonus.pos.z;

        bonus.object.rotation.x = bonus.angles.x;
        bonus.object.rotation.y = bonus.angles.y;
        bonus.object.rotation.z = bonus.angles.z;

        bonus.object.scale.x = bonus.size.x;
        bonus.object.scale.y = bonus.size.y;
        bonus.object.scale.z = bonus.size.z;

        bonus.light = new THREE.PointLight(0xffffff, 4, 4);
        bonus.light.position.x = bonus.pos.x;
        bonus.light.position.y = bonus.pos.y + 1;
        bonus.light.position.z = bonus.pos.z;

        bonus.enabled=true;

        this.scene.add(bonus.light);
        this.scene.add(bonus.object);
    }

    addTrackWoods(wood, object = null) {
        
        for (let n = 0; n < wood.objects.length; n++) {
       
            if (object === null) {
                const t = new THREE.CylinderGeometry(wood.radius, wood.radius, wood.width, 24, 1);
                wood.objects[n].object = new THREE.Mesh(t, this.material2);
            } else {
                object.traverse((child) => {
                    if (child.type == 'Mesh') {
                        wood.objects[n].object = child.clone();
                        wood.objects[n].object.materials = object.materials;
                        wood.objects[n].object.castShadow = true;
                        wood.objects[n].object.receiveShadow = true;
                    }
                });
            }
    
            wood.objects[n].object.position.x = wood.objects[n].pos.x;
            wood.objects[n].object.position.y = wood.objects[n].pos.y;
            wood.objects[n].object.position.z = wood.objects[n].pos.z;
    
            wood.objects[n].object.rotation.x = wood.objects[n].angles.x;
            wood.objects[n].object.rotation.y = wood.objects[n].angles.y;
            wood.objects[n].object.rotation.z = wood.objects[n].angles.z;

            this.scene.add(wood.objects[n].object);
        }
    }

    async addTrackJumper(jumper, object = null) {
        

        if (object === null) {

            const materials = await this.MTLLoader.loadAsync("assets/mesh/jumper.mtl");
            materials.preload();

            this.objLoader.setMaterials(materials);
            object = await this.objLoader.loadAsync("assets/mesh/jumper.obj");
        }

        object.traverse((child) => {

            if (child.type == 'Mesh') {
                jumper.object = child.clone();

                jumper.object.materials = child.materials;
                jumper.object.castShadow = true;
                jumper.object.receiveShadow = false;
            }
        });


        jumper.object.position.x = jumper.pos.x;
        jumper.object.position.y = jumper.pos.y ;
        jumper.object.position.z = jumper.pos.z ;

        jumper.object.rotation.x = jumper.angles.x;
        jumper.object.rotation.y = jumper.angles.y;
        jumper.object.rotation.z = jumper.angles.z;

        jumper.object.scale.x = jumper.size.x;
        jumper.object.scale.y = jumper.size.y;
        jumper.object.scale.z = jumper.size.z;

        this.scene.add(jumper.object);
    }

    async addTrackTurret(turret) {

        const name = turret.model ? turret.model : "turret";

        const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
        materials.preload();
        
        this.objLoader.setMaterials(materials);
        const object = await this.objLoader.loadAsync("assets/mesh/" + name + ".obj");

        object.traverse((child) => {

            if (child.type == 'Mesh') {

                if (child.name === 'body') {
                    turret.object = child.clone();
                    turret.object.materials = child.materials;
                    turret.object.castShadow = true;
                    turret.object.receiveShadow = false;

                    turret.object.x = turret.pos.x;
                    turret.object.y = turret.pos.y;
                    turret.object.z = turret.pos.z;

                    turret.object.rotation.x = turret.angles.x;
                    turret.object.rotation.y = turret.angles.y;
                    turret.object.rotation.z = turret.angles.z;

                    turret.object.scale.x = turret.size.x;
                    turret.object.scale.y = turret.size.y;
                    turret.object.scale.z = turret.size.z;
            
                }
                if (child.name === 'head') {
                    turret.head = child.clone();
                    turret.head.materials = child.materials;
                    turret.head.castShadow = true;
                    turret.head.receiveShadow = false;
                    turret.head.rotation.y = turret.projAngle;
                }
                if (child.name === 'canon') {
                    turret.canon = child.clone();
                    turret.canon.materials = child.materials;
                    turret.canon.castShadow = true;
                    turret.canon.receiveShadow = false;
                    turret.canon.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -turret.projPts.y, 0));
                    turret.canon.position.y = turret.projPts.y;
                    turret.canon.rotation.z = turret.projAngle2;
                }
            }
        });
        
        if ((turret.shotModel) && (turret.shotModel.length > 0)) {
            const materials = await this.MTLLoader.loadAsync("assets/mesh/" + turret.shotModel + ".mtl");
            materials.preload();

            this.objLoader.setMaterials(materials);
            turret.shotObject = await this.objLoader.loadAsync("assets/mesh/" + turret.shotModel + ".obj");
        }

        turret.head.add(turret.canon);
        turret.object.add(turret.head);
        this.scene.add(turret.object);

        if (turret.shotObject) {
            this.scene.add(turret.shotObject);
        }

    }

    delTrack(track) {

        if (track.roadObj !== null) {
            this.scene.remove(track.roadObj);
            track.roadObj.geometry.dispose();
        }

        for (let n = 0; n < track.walls.length; n++) {
            this.scene.remove(track.walls[n].object);
            track.walls[n].object.geometry.dispose();
        }


        if (track.woods) {
            for (let n = 0; n < track.woods.length; n++) {
                for (let i = 0; i < track.woods[n].objects.length; i++) {
                    this.scene.remove(track.woods[n].objects[i].object);
                    track.woods[n].objects[i].object.geometry.dispose();
                }
            }
        }

        if (track.bonuses) {
            for (let n = 0; n < track.bonuses.length; n++) {
                
                this.scene.remove(track.bonuses[n].object);
                this.scene.remove(track.bonuses[n].light);

                track.bonuses[n].object.geometry.dispose();
                track.bonuses[n].light.dispose();
            }
        }

        if (track.jumpers) {
            for (let n = 0; n < track.jumpers.length; n++) {
                this.scene.remove(track.jumpers[n].object);
                track.jumpers[n].object.geometry.dispose();
            }
        }


        if (track.turrets) {
            for (let n = 0; n < track.turrets.length; n++) {

                for (let i = 0; i < track.turrets.shots.length; i++) {
                    this.scene.remove(track.turrets[n].shots[i].object);
                    track.turrets[n].shots[i].object.geometry.dispose();
                }

                this.scene.remove(track.turrets[n].object);
                track.turrets[n].object.geometry.dispose();
            }
        }

        if (track.springs) {
            for (let n = 0; n < track.springs.length; n++) {
                this.scene.remove(track.springs[n].obj.object);
                this.scene.remove(track.springs[n].anchor.object);

                track.springs[n].obj.object.geometry.dispose();
                track.springs[n].anchor.object.geometry.dispose();
            }
        }

        if (track.ropes) {
            for (let n = 0; n < track.ropes.length; n++) {
                this.scene.remove(track.ropes[n].obj.object);
                this.scene.remove(track.ropes[n].anchor.object);

                track.ropes[n].obj.object.geometry.dispose();
                track.ropes[n].anchor.object.geometry.dispose();
            }
        }
        this.scene.remove(this.startLine);

        track.woods = [];
        track.jumpers = [];
        track.bonuses = [];
        track.springs = [];
        track.ropes = [];
        track.turrets = [];
        track.ropes = [];
        track.walls = [];
        track.roadObj = null;

    }


    async addTrack(track) {

        //this.wallMat = new THREE.MeshStandardMaterial( { color: 0xffFFFF } );

        for (let n = 0; n < track.trackPoints.length; n++) {

            if(n%2 == 0)
                continue;

            const light = new THREE.PointLight(0xffFF00, 4, 200, 0.2);
            light.position.set(track.trackPoints[n].l.x, track.trackPoints[n].l.y + 4, track.trackPoints[n].l.z);
            light.power = 2;
            this.scene.add(light);

            const light2 = new THREE.PointLight(0x00FFFF, 3, 200, 0.2);
            light2.position.set(track.trackPoints[n].r.x, track.trackPoints[n].r.y + 4, track.trackPoints[n].r.z);
            light2.power = 2;
            this.scene.add(light2);

        }

        if (track.roadObj) {
            track.roadObj.castShadow = false;
            track.roadObj.receiveShadow = true;

            this.scene.add(track.roadObj);

            for (let n = 0; n < track.walls.length; n++) {
                track.walls[n].object.castShadow = true;
                track.walls[n].object.receiveShadow = true;

                track.walls[n].object.material.envMap = this.skyTexture;
                track.walls[n].object.material.needsUpdate = true;

                this.scene.add(track.walls[n].object);
                //this.scene.add(track.walls[n].wall);
            }
        }


        if (track.HM) {
            const img = document.createElement('img');
            img.src = '/assets/img/tracks/hm/' + track.HM.file + '.png';

            const self = this;

            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                track.HM.data = ctx.getImageData(0, 0, img.width, img.height).data;

                self.world.createGeometryFromMap();
                self.scene.add(track.HM.mesh);
            };

        }


        if ((track.woodDefs) && (track.woodDefs.length > 0)) {
            /*
            const name = "stump";

            var trunkLoaderMTL = new MTLLoader();
            const materials = await trunkLoaderMTL.loadAsync("assets/mesh/"+name+".mtl");
            materials.preload();
 
            var manager = new THREE.LoadingManager();
            manager.onProgress = function ( item, loaded, total ) {
                console.log( item, loaded, total );
            };                
 
            const trunkLoader = new OBJLoader( manager );      
            trunkLoader.setMaterials(materials);
            const object = await trunkLoader.loadAsync("assets/mesh/"+name+".obj");
            */

            for (let n = 0; n < track.woodDefs.length; n++) {
                const wood = track.addWoods(track.woodDefs[n].ptIdx, track.woodDefs[n].num, track.woodDefs[n].width, track.woodDefs[n].radius, track.woodDefs[n].mass, track.woodDefs[n].offset);
                this.addTrackWoods(wood);
            }
        }


        if ((track.springDefs) && (track.springDefs.length > 0)) {
            for (let n = 0; n < track.springDefs.length; n++) {
                const spring = track.addSpring(track.springDefs[n].ptIdx, track.springDefs[n].offset, track.springDefs[n].eqPts, track.springDefs[n].eqA, track.springDefs[n].mass, track.springDefs[n].size, track.springDefs[n].stiffness, track.springDefs[n].damping, track.springDefs[n].initPts, track.springDefs[n].initA, track.springDefs[n].limit, track.springDefs[n].limitA, track.springDefs[n].shape);
                this.addTrackSpring(spring);
            }
        }

        if ((track.ropeDefs) && (track.ropeDefs.length > 0)) {
            for (let n = 0; n < track.ropeDefs.length; n++) {
                const rope = track.addRope(track.ropeDefs[n].ptIdx, track.ropeDefs[n].offset, track.ropeDefs[n].eqPts, track.ropeDefs[n].eqA, track.ropeDefs[n].mass, track.ropeDefs[n].size, track.ropeDefs[n].softness, track.ropeDefs[n].damping, track.ropeDefs[n].motorforce, track.ropeDefs[n].bounce, track.ropeDefs[n].initPts, track.ropeDefs[n].initA, track.ropeDefs[n].limit, track.ropeDefs[n].limitA, track.ropeDefs[n].shape);
                this.addTrackRope(rope);
            }
        }

        if (!track.bonusObject) {
            const name = "bonus";
            const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
            materials.preload();
            
            this.objLoader.setMaterials(materials);
            track.bonusObject = await this.objLoader.loadAsync("assets/mesh/" + name + ".obj");
        }

        if ((track.bonusDefs) && (track.bonusDefs.length > 0)) {
            for (let n = 0; n < track.bonusDefs.length; n++) {
                const bonus = track.addBonus(track.bonusDefs[n].ptIdx, track.bonusDefs[n].type, track.bonusDefs[n].time, track.bonusDefs[n].offset, track.bonusDefs[n].scale);
                this.addTrackbonus(bonus, track.bonusObject);
            }
        }

        for (let n = 0; n < track.loopings.length; n++) {
            for (let i = 0; i < track.loopings[n].bonuses.length; i++) {
                const bonus = track.addBonus(track.loopings[n].bonuses[i].ptIdx, track.loopings[n].bonuses[i].type, track.loopings[n].bonuses[i].time, track.loopings[n].bonuses[i].offset, track.loopings[n].bonuses[i].scale);
                this.addTrackbonus(bonus, track.bonusObject);
            }
        }


        if ((track.jumpersDefs) && (track.jumpersDefs.length > 0)) {
            const name = "jumper";

            const materials = await this.MTLLoader.loadAsync("assets/mesh/" + name + ".mtl");
            materials.preload();

            this.objLoader.setMaterials(materials);
            const object = await this.objLoader.loadAsync("assets/mesh/" + name + ".obj");

            for (let n = 0; n < track.jumpersDefs.length; n++) {
                const jumper = await track.addJumper(track.jumpersDefs[n].ptIdx, track.jumpersDefs[n].offset, track.jumpersDefs[n].angle, track.jumpersDefs[n].size);
                await this.addTrackJumper(jumper, object);
            }
        }

        if ((track.turretsDefs) && (track.turretsDefs.length > 0)) {

            for (let n = 0; n < track.turretsDefs.length; n++) {
                const turret = await track.addTurret(track.turretsDefs[n].ptIdx, track.turretsDefs[n].model, track.turretsDefs[n].shotModel, track.turretsDefs[n].activation, track.turretsDefs[n].offset, track.turretsDefs[n].angle, track.turretsDefs[n].size, track.turretsDefs[n].projPts, track.turretsDefs[n].projSize, track.turretsDefs[n].projMass, track.turretsDefs[n].projSpeed, track.turretsDefs[n].projAngle, track.turretsDefs[n].projAngle2, track.turretsDefs[n].projDelay, track.turretsDefs[n].projTTL);
                await this.addTrackTurret(turret);
            }
        }

        this.scene.add(track.terrain.mesh);


    }

    resizeCanvasToDisplaySize(parDiv) {
        const canvas = this.renderer.domElement;
        // look up the size the canvas is being displayed

        const width = $('#gl-dom').innerWidth();
        const height = $('#gl-dom').innerHeight();

        // adjust displayBuffer size to match
        if (canvas.width !== width || canvas.height !== height) {
            // you must pass false here or three.js sadly fights the browser

            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;

            //this.camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 20000 );
            this.camera.updateProjectionMatrix();
            // update any render target sizes here
        }
    }

    initPostProcessing(enable) {
        if (enable === false) {
            this.composer = null;
            return;
        }

        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        /*
        const ssaoPASS = new SSAOPass( this.scene, this.camera, 1024, 1024);

        ssaoPASS.kernelRadius = 200;
        ssaoPASS.minDistance = 0.01;
        ssaoPASS.maxDistance = 0.8;

        this.composer.addPass( ssaoPASS );
        */

        
        const saopass = new SAOPass(this.scene, this.camera, true, true, new THREE.Vector2(1024, 1024));

        saopass.params = {
            output: 0,
            saoBias: 0.1,
            saoIntensity: 0.0040,
            saoScale: 2,
            saoKernelRadius: 80,
            saoMinResolution: 0,
            saoBlur: true,
            saoBlurRadius: 4,
            saoBlurStdDev: 1.2,
            saoBlurDepthCutoff: 0.4
        };

        this.composer.addPass(saopass);
        


        /*
        const RBPass = new UnrealBloomPass({ X: 1024, y: 1024 }, 0.25, 0.4, 0.8);
        this.composer.addPass(RBPass);
        */


        const bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 1.0,
            aperture: 0.000015,
            maxblur: 0.004
        });

        this.composer.addPass(bokehPass);

        /*
        const glitchPass = new GlitchPass();
        this.composer.addPass( glitchPass );
        */
        /*
        const RBPass = new UnrealBloomPass({X : 1024, y: 1024}, 0.45, 1, 0.5);
        this.composer.addPass( RBPass );
        */
        /*
        const OLPass = new OutlinePass({X : 1024, y: 1024}, this.scene, this.camera, [this.world.track.terrain.mesh]);
        this.composer.addPass( OLPass );
        */

        //const rPass = new RenderPass( this.sceneNOPP, this.camera );
        //this.composer.addPass( rPass );


        //const noppPass = new RenderPass( this.sceneNOPP, this.camera );
        //this.composer.addPass( noppPass );

        /*
        const renderUIPass = new RenderPass( this.sceneUI, this.cameraUI);
        this.composer.addPass( renderUIPass );
        */
    }

    setupCarMat(mat) {
        switch (this.MatType) {
            default:
            case 0:

                /*this.envmap = await this.generator.fromEquirectangular(this.skyTexture).texture;*/
                mat.envMapIntensity = 0.4;
                //mat.envMap = await this.generator.fromEquirectangular(this.skyTexture).texture;
                mat.envMap = this.skyTexture;
                mat.needsUpdate = true;
                break;
            case 1:
                mat.envMapIntensity = 8;
                mat.metalness = 1.0;
                mat.bumpScale = 0.01;
                mat.reflectivity = 0.9;
                mat.sheen = 1;
                mat.sheenRoughness = 0.0;
                mat.roughness = 0.0;
                mat.Clearcoat = 0.2;
                mat.needsUpdate = true;
                break;
        }

        
    }


    async postRender(world)
    {

        if (this.skyTexture == null) 
            return;

        if(this.skyTexture.image == null)
            return;

        if (world.allCarsLoaded()) {

            if((world.cars.length ==0)&&(world.myCar!=null))
            {
                if(world.myCar.ChassisMesh)
                {
                    if (world.myCar.ChassisMesh.material.length) {
                        for (let mat of world.myCar.ChassisMesh.material) {
                             this.setupCarMat(mat);
                        }
                    } else {
                         this.setupCarMat(world.myCar.ChassisMesh.material);
                    }
                }

            }else{
                for(let car of world.cars)
                {
                    //const envmap = this.generator.fromEquirectangular(this.skyTexture);
                    if (car.ChassisMesh.material.length) {
                        for (let mat of car.ChassisMesh.material) {
                             this.setupCarMat(mat);
                        }
                    } else {
                         this.setupCarMat(car.ChassisMesh.material);
                    }
                }
    
            }
    

            if(world.track){

                world.track.terrain.mesh.traverse((child) => {

                    

                    if (child.name.startsWith('arch'))
                    {
                        child.material.transmission = 1.0;
                        child.material.thickness = 0.2;
                        child.material.roughness = 0.0;
                        child.material.reflectivity= 0.2;
                    }
        
                    if (child.name.startsWith('tube'))
                    {
                        child.material[0].transmission = 1.0;
                        child.material[0].thickness = 0.2;
                        child.material[0].roughness = 0.0;
                        child.material[0].reflectivity= 0.6;
                        child.material[0].envMap = this.skyTexture;
                        child.material[0].envMapIntensity = 2;
                        child.material[0].ior = 3;
                    }
        
                    if (child.name.startsWith('bull'))
                    {
                        child.material[0].transmission = 0.0;
                        child.material[0].thickness = 0.4;
                        child.material[0].roughness = 0.0;
                        child.material[0].reflectivity= 1.0;
                        child.material[0].envMap = this.skyTexture;
                        child.material[0].envMapIntensity = 2;
                    }
                    
        
                    

                    if (child.type == 'Mesh') {
    
                        if(child.material.opacity < 1.0)
                        {
                            child.material.envMap = this.skyTexture;
                            child.material.envMapIntensity = 8;
                            child.material.metalness = 1.0;
                            child.material.needsUpdate = true;
    
                        }
                    }
                });
            }
        }
    }

    async render() {

        if (this.composer === null) {
            this.renderer.alpha = true;
            this.renderer.preserveDrawingBuffer = false;
            this.renderer.autoClear = true;
            this.renderer.render(this.scene, this.camera);

        }
        else
            this.composer.render();

        if (this.sceneUI) {
            this.renderer.alpha = true;
            this.renderer.preserveDrawingBuffer = true;
            this.renderer.autoClearDepth = true;
            this.renderer.autoClear = false;
            this.renderer.render(this.sceneUI, this.cameraUI);
        }

    }




    addLight(target, pos) {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);

        //const directionalLight = new THREE.SpotLight(0xffa95c,4);

        directionalLight.position.x = pos.x - 10;
        directionalLight.position.y = pos.y + 1;
        directionalLight.position.z = pos.z + 1;

        if (target !== null)
            directionalLight.target = target;



        directionalLight.castShadow = true;

        this.scene.add(directionalLight);


        directionalLight.shadow.mapSize.width = 512;
        directionalLight.shadow.mapSize.height = 512;

        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 1000;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = - 15;

        /*
        const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
        this.scene.add(helper)        
        */
    }

    removeCar(car) {
        if (car === null) 
            return;

        this.scene.remove(car.ChassisMesh);
        for (let n = 0; n < car.wheels.length; n++) {
            this.scene.remove(car.wheels[n].mesh);
        }
    }
    
    addCarObj(car) {

        this.sc = false;

        this.scene.add(car.ChassisMesh);

        var eul = new THREE.Euler(0, 0, 0, "XYZ");
        eul.setFromQuaternion(car.quat);

        car.ChassisMesh.rotation.x = eul.x;
        car.ChassisMesh.rotation.y = eul.y;
        car.ChassisMesh.rotation.z = eul.z;

        /*car.ChassisMesh.material.envMap = this.ldrCubeMap;*/
        car.ChassisMesh.material.needsUpdate = true;

        car.ChassisMesh.castShadow = true;
        car.ChassisMesh.receiveShadow = false;

        for (let n = 0; n < car.wheels.length; n++) {
            this.scene.add(car.wheels[n].mesh);
        }
        return true;
    }

    async addCar(myCar) {
        
        await this.loadCar(myCar);
        await this.addCarObj(myCar);

    }

    async setCar(myCar) {
        await this.loadCar(myCar);
        await this.addCarObj(myCar);
    }

    createPathStrings(filename) {
        const basePath = "./assets/textures/";
        const baseFilename = basePath + filename;
        const fileType = ".jpg";
        const sides = ["ft", "bk", "up", "dn", "rt", "lf"];

        const pathStings = sides.map(side => {
            return baseFilename + "_" + side + fileType;
        });

        return pathStings;
    }

    createMaterialArray(filename) {
        const skyboxImagepaths = this.createPathStrings(filename);

        const materialArray = skyboxImagepaths.map(image => {
            let texture = this.texLoader.load(image);
            const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }); // <---
            mat.depthTest = false;
            mat.depthWrite = false;

            return mat;
        });

        return materialArray;
    }

    async initEnvMap() {
        const ldrUrls = ['afterrain_rt.jpg', 'afterrain_lf.jpg', 'afterrain_up.jpg', 'afterrain_dn.jpg', 'afterrain_ft.jpg', 'afterrain_bk.jpg'];

        this.generator = new THREE.PMREMGenerator(this.renderer);
        await this.generator.compileCubemapShader();

        this.ldrCubeMap = await new THREE.CubeTextureLoader().setPath('/assets/textures/').loadAsync(ldrUrls);
        //this.scene.background = this.ldrCubeMap;
    }

    async addSkyBox(skyboxImage) {

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        const loader = new THREE.TextureLoader();

        this.skyTexture = await loader.loadAsync("/assets/skybox/" + skyboxImage);
        this.skyTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.skyTexture.encoding = THREE.sRGBEncoding;
       

        this.scene.background = this.skyTexture;
        this.scene.environment = this.skyTexture;

        //const hdrmap = await new RGBELoader().load('textures/gothic_manor_02_2k.hdr', (hdrmap) => { // ... let envmap = generator.fromEquirectangular(hdrmap); const ballMaterial = { // ... envMap: envmap.texture }; })

        const material = new THREE.MeshBasicMaterial({ map: this.skyTexture });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.y = 0;

        // add scene
        // this.scene.add(sphere);   
        this.sc = false;

        /*
        await this.initEnvMap();
        this.skyboxMaterialArray = this.createMaterialArray(skyboxImage);
        this.skyboxGeo = new THREE.BoxGeometry(700, 700, 700);
        this.skybox = new THREE.Mesh(this.skyboxGeo, this.skyboxMaterialArray);
        this.scene.add(this.skybox);
        */
    }

    scene;
    camera;
    renderer;
    lastTime;
    camFollowCar;
}




class Wallet {

    constructor(appInfos) {

        this.appInfos = appInfos;
        this.engine = null;
        this.world = null;

        this.curTire = 0;
        this.curMotor = 0;
        this.nTiresPages = 4;
        this.nMotorsPages = 4;
        this.endpoint = 0;

        this.endpointSt = localStorage.getItem('endpoint');
        if (this.endpointSt !== null) {
            for (let n = 0; n < this.appInfos.endpoints.length; n++) {
                if (this.appInfos.endpoints[n] === this.endpointSt) {
                    this.endpoint = n;
                }
            }
        } else {
            localStorage.setItem('endpoint', this.appInfos.endpoints[0]);
        }

        try {
            this.wax = new waxjs.WaxJS({ rpcEndpoint: this.appInfos.endpoints[this.endpoint], freeBandwidth: false });
        }
        catch (e) {
            this.newAlert('unable to initialize wax wallet ' + e.message);
        }

        try {
            const transport = new AnchorLinkBrowserTransport();
            this.link = new AnchorLink({ transport, chains: [{ chainId: this.appInfos.chainId, nodeUrl: this.appInfos.endpoints[this.endpoint] }] });
        }
        catch (e) {
            this.newAlert('unable to initialize anchor wallet ' + e.message);
        }

        try {
            this.explore = new RpcApi(this.appInfos.endpoints[this.endpoint], this.appInfos.AA.contract);
        }
        catch (e) {
            this.newAlert('unable to initialize atomic asset explorer ' + e.message);
        }

        this.TemplateData = [];

        /*
        ScatterJS.plugins( new ScatterEOS() );

        const url = new URL(this.appInfos.endpoints[0]);
        console.log(url);         

        const scatterNetwork = ScatterJS.Network.fromJson({
            blockchain:'wax',
            chainId:this.appInfos.chainId,
            host:url.hostname,
            port:url.port,
            protocol:'https'
        });

        
        ScatterJS.connect('crazycars', {scatterNetwork}).then(connected => {
            if(!connected) return false;
            // ScatterJS.someMethod();
        });
        */


        this.validated = false;
        this.statMod = { "compression": 0, 'damping': 0, 'stiffness': 0, 'friction': 0, 'force': 0 };
        this.statKeysC = { "compression": { max: 1.0 }, 'damping': { max: 1.0 }, 'stiffness': { max: 120.0 }, 'friction': { max: 10.0 }, 'force': { max: 5000 } };
        this.statKeysB = { "compression": { max: 1.0 }, 'damping': { max: 1.0 }, 'stiffness': { max: 240.0 }, 'friction': { max: 50.0 }, 'force': { max: 50000 } };
        this.statKeysA = { "compression": { max: 1.0 }, 'damping': { max: 1.0 }, 'stiffness': { max: 240.0 }, 'friction': { max: 50.0 }, 'force': { max: 50000 } };

    }


    async getSession() {

        let res = null;
        const ac=document.getElementById('navbar-account');

        if(ac)ac.innerHTML+='get session';
        

        try {
            const ires = await fetch(this.site+'/me', { method: 'GET', credentials: 'include' });
            res = await ires.json();
        }
        catch (e) {
            alert('getSession : unable to get server session ' + e.message);
            return false;
        }

        if(ac)ac.innerHTML+='check session';

        if (res.error) {
            this.myAccount = null;
            this.logType = 0;
            alert('getSession : no server session');
            return false;
        }

        const me = res.result;
        this.network = me.network;

        if (!me.validated) {
            this.myAccount = null;
            this.logType = 0;
            return false;
        }

        if(ac)ac.innerHTML+='check wallet';

        switch (me.logtype) {
            case 1:
                this.isAutoLoginAvailable = await this.wax.isAutoLoginAvailable();
                if (this.isAutoLoginAvailable) {

                    if (me.account === this.wax.userAccount) {
                        this.logType = 1;
                        this.myAccount = this.wax.userAccount;
                        if(ac)ac.innerHTML=this.myAccount;

                        this.getBalance();
                        return true;
                    }

                } else {
                    this.myAccount = me.account;
                    this.logType = 1;
                    this.getBalance();
                    return true;
                }
                break;
            case 2:
                try {
                    const session = await this.link.restoreSession(this.appInfos.dAppName);
                    const anchrSessionAccnt = this.getAccountName(session.auth.actor.value.value);
                    if (anchrSessionAccnt == me.account) {
                        this.myAccount = anchrSessionAccnt;
                        this.logType = 2;

                        if(ac)ac.innerHTML=this.myAccount;

                        this.getBalance();
                        return true;
                    }
                    else {
                        console.log('bad anchor session ' + anchrSessionAccnt + ' ' + me.account);
                    }
                } catch (e) {
                    console.log('no anchor session ' + e.message);
                }
                break;
        }
        this.myAccount = null;
        this.logType = 0;
        this.validated = false;

        return false;
    }

    setNetwork(name) {

        if (!name)
            name = "mainnet";

        fetch(this.site+'/setNetwork?net=' + name), { method: 'GET', credentials: 'include' };
    }

    getAccountName(value) {
        var myn = new BN();
        value.copy(myn);
        var arr = myn.toArray();
        var ib8 = new Uint8Array(8);
        for (let n = 0; n < ib8.length; n++) {
            ib8[n] = arr[7 - n];
        }
        return this.getName(ib8);
    }


    async dologin(selected) {
        const logType = parseInt(selected);

        const res = await fetch(this.site+'/identify', { method: 'GET', credentials: 'include' });
        const result = await res.json();
        //const result = await jQuery.getJSON({ dataType: "json", url: '/identify' });
        var payload = null;

        switch (logType) {
            case 0:
                payload = await this.waxlogin(result.result.token);
                this.logType = 1;
                break;
            case 1:
                payload = await this.linkLogin(result.result.token);
                this.logType = 2;
                break;
            default:
                return;
        }

        if (payload !== null) {
            try {

                const res2 = await fetch(this.site+'/validate', { method: 'POST', credentials: 'include' ,   body: JSON.stringify({ 'account': this.myAccount, 'logtype': this.logType, 'payload': payload }), headers: { "Content-Type": "application/json" }});
                const log = await res2.json();
                //const log = await $.ajax({ type: "POST", url: '/validate',   body: JSON.stringify({ 'account': this.myAccount, 'logtype': this.logType, 'payload': payload }), headers: { "Content-Type": "application/json", }});
                if (log.error) {
                    this.newAlert('validate error ' + log.error);
                    console.log('validate error ' + log.error);
                    return;
                }
                await this.getSession();

            }
            catch (e) {
                this.newAlert('validate error ' + e.message);
                console.log('validate error ' + e.message);
                return;
            }
        }
    }
    async getBalance() {
        const b=document.getElementById('my-balance');
        const sb=document.getElementById('my-steel-balance');
        var req = {
            json: true,                             // Get the response as json
            code: "eosio.token",                   // Contract that we target
            scope: this.myAccount,                // Account that owns the data
            table: 'accounts',                      // Table name
            limit: 1000                             // Maximum number of rows that we want to get
        };

        const result = await this.wax.rpc.get_table_rows(req);
        var balance = 0;

        for (let n = 0; n < result.rows.length; n++) {
            var arr = result.rows[n].balance.split(' ');
            if (arr[1] === 'WAX') {
                balance = parseFloat(arr[0]).toFixed(3);
            }
        }
        if(b)b.innerHTML = '';

        var waxImg = document.createElement('img');
        waxImg.className = "wax-token-icon";
        waxImg.src =this.site +  "/assets/img/wax-icon.png";

        var span = document.createElement('span');
        span.innerHTML = balance;

        if(b)b.append(span);
        if(b)b.append(waxImg);

        var req = {
            json: true,                            // Get the response as json
            code: this.appInfos.mainContract,   // Contract that we target
            scope: this.myAccount,                // Account that owns the data
            table: 'accounts',                    // Table name
            limit: 1                              // Maximum number of rows that we want to get
        };

        const STEELres = await this.wax.rpc.get_table_rows(req);
        var steelBalance = 0;

        if (STEELres.rows.length > 0) {
            var arr = STEELres.rows[0].balance.split(' ');
            steelBalance = parseFloat(arr[0]).toFixed(3);
        }

        if(sb)sb.innerHTML = '';

        var steelImg = document.createElement('img');
        steelImg.className = "steel-token-icon";
        steelImg.src = this.site + "/assets/img/steel-icon.ico";

        var span = document.createElement('span');
        span.innerHTML = steelBalance;

        if(sb)sb.append(span);
        if(sb)sb.append(steelImg);
    }

    async get_config() {

        var config_r = null;

        const creq = {
            json: true,                             // Get the response as json
            code: this.appInfos.mainContract,       // Contract that we target
            scope: this.appInfos.mainContract,      // Account that owns the data
            table: 'config',                    // Table name
            limit: 1,                              // Maximum number of rows that we want to get
            reverse: false,                         // Optional: Get reversed data
            show_payer: false                       // Optional: Show ram payer
        };

        try {
            config_r = await this.wax.rpc.get_table_rows(creq);
        }
        catch (e) {
            this.newAlert('get_config : unable to fetch config table ' + e.message);
            return;
        }

        if (config_r.rows.length <= 0) {
            this.newAlert('no config table ' + e.message);
            return;
        }

        this.cfg = config_r.rows[0];
        const arr = this.cfg.nitro_price.split(' ');
        this.cfg.nitro_price = arr[0];
    }

    async logout() {
        if (this.myAccount) {

            switch (this.logType) {
                case 1: break;
                case 2: break;
            }
            this.myAccount = null;
            this.logType = 0;
        }
    }

    async waxlogin(token) {
        try {
            this.isAutoLoginAvailable = await this.wax.isAutoLoginAvailable();
            if (!this.isAutoLoginAvailable)
                this.myAccount = await this.wax.login();
            else
                this.myAccount = this.wax.userAccount;

            const TxData = { actions: [{ account: this.appInfos.mainContract, name: "walletcheck", authorization: [{ actor: this.myAccount, permission: "active" }], data: { caller: this.myAccount, signing_value: token.nonce, assoc_id: token.nonce } }] };
            const TxOptions = { blocksBehind: 3, expireSeconds: 30, broadcast: false, sign: true };
            const result = await this.wax.api.transact(TxData, TxOptions);

            $('#login').popover("hide");

            return JSON.stringify(result);

        } catch (e) {
            this.newAlert('wax login error ' + e.message);
            console.log('wax login error ' + e.message);
            $('#login').popover("hide");
            return null;
        }


    }

    async linkwalletcheck(token) {
        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "walletcheck", authorization: [{ actor: this.myAccount, permission: "active" }], data: { caller: this.myAccount, signing_value: token.nonce, assoc_id: token.nonce } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, broadcast: false, sign: true };

        const result = await this.link.transact(TxData, TxOptions);

        var pdata = { tx: JSON.stringify(result.transaction), sig: JSON.stringify(result.signatures) };
        return await JSON.stringify(pdata);;
    }

    async linkLogin(token) {
        const identity = await this.link.login(this.appInfos.dAppName);
        this.myAccount = identity.payload.sa;

        return await this.linkwalletcheck(token);
    }


    serName(s) {
        if (typeof s !== 'string') {
            throw new Error('Expected string containing name');
        }
        var regex = new RegExp(/^[.1-5a-z]{0,12}[.1-5a-j]?$/);
        if (!regex.test(s)) {
            throw new Error('Name should be less than 13 characters, or less than 14 if last character is between 1-5 or a-j, and only contain the following symbols .12345abcdefghijklmnopqrstuvwxyz'); // eslint-disable-line
        }
        var charToSymbol = function (c) {
            if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
                return (c - 'a'.charCodeAt(0)) + 6;
            }
            if (c >= '1'.charCodeAt(0) && c <= '5'.charCodeAt(0)) {
                return (c - '1'.charCodeAt(0)) + 1;
            }
            return 0;
        };
        var a = new Uint8Array(8);
        var bit = 63;
        for (var i = 0; i < s.length; ++i) {
            var c = charToSymbol(s.charCodeAt(i));
            if (bit < 5) {
                c = c << 1;
            }
            for (var j = 4; j >= 0; --j) {
                if (bit >= 0) {
                    a[Math.floor(bit / 8)] |= ((c >> j) & 1) << (bit % 8);
                    --bit;
                }
            }
        }

        const view = new DataView(a.buffer);
        let value = view.getBigUint64(0);

        return value;
    };

    getName(a) {
        var result = '';
        for (var bit = 63; bit >= 0;) {
            var c = 0;
            for (var i = 0; i < 5; ++i) {
                if (bit >= 0) {
                    c = (c << 1) | ((a[Math.floor(bit / 8)] >> (bit % 8)) & 1);
                    --bit;
                }
            }
            if (c >= 6) {
                result += String.fromCharCode(c + 'a'.charCodeAt(0) - 6);
            }
            else if (c >= 1) {
                result += String.fromCharCode(c + '1'.charCodeAt(0) - 1);
            }
            else {
                result += '.';
            }
        }
        while (result.endsWith('.')) {
            result = result.substr(0, result.length - 1);
        }
        return result;
    };


    updatePage() {

        const net =document.getElementById('my-network');
        const a = document.getElementById('navbar-account');

        /* jquery */
        if (this.network == 'testnet')
            if(net)net.checked = true;
        else
        if(net)net.checked = false;
        

        if (this.myAccount !== null) {

            var h5 = document.createElement('h5');
            h5.innerHTML = this.myAccount;

            var lnk = document.createElement('a');
            lnk.id = "account";
            lnk.append(h5);

            const url= this.site+'/logout';

            if(a)a.innerHTML='';
            if(a)a.append(lnk);
            if(a)a.innerHTML+='<button onclick=" fetch(\''+url+'\', { method: \'GET\', credentials: \'include\' }).then( async() => { await wallet.logout(); wallet.updatePage(); }); ">logout</a>';
           

            /* jquery 
            $('#navbar-account').html('');
            $('#navbar-account').append(lnk);
            */


            /* jquery 
            $('#account').popover({ html: true, content: '<a href="/logout" onclick=" wallet.logout(); ">logout</a>' });
            */


        } else {

            var login = document.createElement('button');
            login.className = 'btn-sm btn-primary';
            login.innerHTML = 'Login';
            login.id = "login";

            login.setAttribute('data-toggle', "popover");
            login.setAttribute('data-placement', "bottom");

            if(a)a.innerHTML='';

            if(a)a.append(login);
            if(a)a.append(this.getWallets());

            /* jquery 
            $('#navbar-account').html('');
            $('#navbar-account').append(login);
            $('#login').popover({ html: true, content: this.getWallets() });
            */
        }

        /* jquery 
        $('#endpoints').attr('data-toggle', "popover");
        $('#endpoints').attr('data-placement', "bottom");
        $('#endpoints').popover({ html: true, content: this.getEndpoints() });
        */

    }

    newAlert(message) {
        alert(message);
    }

    selectEndPoint(eidx) {
        if ((eidx < 0) || (eidx >= this.appInfos.endpoints.length))
            eidx = 0;

        localStorage.setItem('endpoint', this.appInfos.endpoints[edix]);
    }

    getEndpoints() {
        const self = this;
        var main = document.createElement('div');

        for (let n = 0; n < this.appInfos.endpoints.length; n++) {
            var endpointMain = document.createElement('a');
            endpointMain.href = './';
            endpointMain.setAttribute('eidx', n);
            if (this.endpoint == n)
                endpointMain.className = "center-box endpoint-selected";
            else
                endpointMain.className = "center-box endpoint";

            endpointMain.addEventListener('click', function () {
                const eidx = parseInt($(this).attr('eidx'));
                localStorage.setItem('endpoint', self.appInfos.endpoints[eidx]);
            })
            endpointMain.innerHTML = this.appInfos.endpoints[n];
            main.appendChild(endpointMain);
        }

        return main;
    }


    getWallets() {
        const self = this;
        var main = document.createElement('div');

        var anchorMain = document.createElement('div');
        anchorMain.className = "center-box";
        var anchorlogo = document.createElement('i');
        anchorlogo.className = 'anchor-logo';

        var anchor = document.createElement('button');
        anchor.className = 'btn-lg btn-primary login-btn';
        anchor.innerHTML = 'Anchor';
        anchor.onclick = async function () {
            try {
                await self.dologin(1);
            }
            catch (e) {
                /*$('#login').popover("hide");*/
                alert('login error '+e.message);
                return;
            }

            /*$('#login').popover("hide");*/

            self.updatePage();

            if (self.onLogin)
                self.onLogin();
        }

        anchorMain.appendChild(anchorlogo);
        anchorMain.appendChild(anchor);

        main.appendChild(anchorMain);


        var waxMain = document.createElement('div');
        waxMain.className = "center-box";

        var waxlogo = document.createElement('i');
        waxlogo.className = 'wax-logo';

        var wax = document.createElement('button');
        wax.className = 'btn btn-primary login-btn';
        wax.innerHTML = 'wax';
        wax.onclick = async function () {
            try {
                await self.dologin(0);
            }
            catch (e) {
                alert('login error '+e.message);
                /*$('#login').popover("hide");*/
                return;
            }


            /*$('#login').popover("hide");*/
            self.updatePage();

            if (self.onLogin)
                self.onLogin();
        }

        waxMain.appendChild(waxlogo);
        waxMain.appendChild(wax);
        main.appendChild(waxMain);

        return main;
    }


    async doTx(TxData, TxOptions) {
        var result;

        console.log(TxData);
        switch (this.logType) {
            case 1:
                try {
                    if (!this.isAutoLoginAvailable) {
                        await this.wax.login();
                    }
                    result = await this.wax.api.transact(TxData, TxOptions);
                }
                catch (e) {
                    console.log("transaction error " + e.message);
                    this.newAlert("transaction error " + e.message);
                    return false;
                }
                break;
            case 2:
                try {
                    result = await this.link.transact(TxData, TxOptions);
                }
                catch (e) {
                    console.log("transaction error " + e.message);
                    this.newAlert("transaction error " + e.message);
                    return false;
                }
                break;
            default:
                return false;
        }

        return true;
    }

    async doClaim(ids) {
        const TxData = { actions: [{ account: this.appInfos.SA.contract, name: "claim", authorization: [{ actor: this.myAccount, permission: "active" }], data: { claimer: this.myAccount, assetids: ids } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        return await this.doTx(TxData, TxOptions);

    }

    async unmountAccess(carid, type, cat, name) {


        switch (type) {
            case 0: {
                const TxData = { actions: [{ account: this.appInfos.mainContract, name: "unmount", authorization: [{ actor: this.myAccount, permission: "active" }], data: { owner: this.myAccount, carid: carid, category: cat, assetname: name } }] };
                const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
                return await this.doTx(TxData, TxOptions);
            }
            case 1: {
                const TxData = { actions: [{ account: this.appInfos.mainContract, name: "unmountaa", authorization: [{ actor: this.myAccount, permission: "active" }], data: { owner: this.myAccount, carid: carid, category: cat, assetname: name } }] };
                const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
                return await this.doTx(TxData, TxOptions);
            }
        }

    }

    async mountAccess(carid, type, aid) {

        switch (type) {
            case 0: {
                const TxData = { actions: [{ account: this.appInfos.SA.contract, name: "transfer", authorization: [{ actor: this.myAccount, permission: "active" }], data: { from: this.myAccount, to: this.appInfos.mainContract, assetids: [aid], memo: 'm:' + carid } }] };
                const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
                return await this.doTx(TxData, TxOptions);
            }
                break;
            case 1: {
                const TxData = { actions: [{ account: this.appInfos.AA.contract, name: "transfer", authorization: [{ actor: this.myAccount, permission: "active" }], data: { from: this.myAccount, to: this.appInfos.mainContract, asset_ids: [aid], memo: 'm:' + carid } }] };
                const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
                return await this.doTx(TxData, TxOptions);
            }
                break;
        }
    }

    async eraseNitro() {
        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "freenitros", authorization: [{ actor: this.myAccount, permission: "active" }], data: { owner: this.myAccount } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        await this.doTx(TxData, TxOptions);

        await sleep(1000);
        this.getNitros();
    }

    async buyNitro(n) {
        if (n <= 0)
            return;

        const memo = 'b:0';
        const quantity = parseFloat(n * this.cfg.nitro_price).toFixed(4) + ' STEEL';

        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "transfer", authorization: [{ actor: this.myAccount, permission: "active" }], data: { from: this.myAccount, to: this.appInfos.mainContract, quantity: quantity, memo: memo } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        await this.doTx(TxData, TxOptions);

        await sleep(1000);

        this.getBalance();
        this.getNitros();

        $('#nitros-buy-n').val('0');
        $('#nitros-buy-price').html('0.0000');
    }

    async modStat(quantity, key, d, type) {
        let k = '';

        switch (key) {
            case "compression": k = 'c'; break;
            case "damping": k = 'd'; break;
            case "friction": k = 'f'; break;
            case "stiffness": k = 's'; break;
            case "force": k = 'p'; break;
        }

        const cmd = d ? 'u:' : 'd:';
        const memo = cmd + k + ':' + type + ':' + this.selectedCarId;

        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "transfer", authorization: [{ actor: this.myAccount, permission: "active" }], data: { from: this.myAccount, to: this.appInfos.mainContract, quantity: quantity.toFixed(4) + ' STEEL', memo: memo } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        await this.doTx(TxData, TxOptions);

        await sleep(1000);

        this.engine.removeCar(this.world.myCar);
        const carDef = await this.getCar(this.selectedCarId, this.selectedCarType);
        if (carDef !== null) {

            this.world.myCar = await this.world.createCar(carDef);
            this.engine.setCar(this.world.myCar);
            this.statMod[key] = 0;

            this.updateCar(carDef, null, null);
            this.getBalance();

        }
    }

    async initdmg(carid, type) {
        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "initdmg", authorization: [{ actor: this.myAccount, permission: "active" }], data: { owner: this.myAccount, id: carid, type: type } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        return await this.doTx(TxData, TxOptions);
    }

    async adddmg(carid, owner, dmg) {
        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "adddmg", authorization: [{ actor: this.myAccount, permission: "active" }], data: { amount: dmg, owner: owner, id: carid } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        return await this.doTx(TxData, TxOptions);
    }

    getAssetImage(item, type) {
        if (type == 'cars') {

            if (item.chassis == 'car1')
                return 'car1.png';

            if (item.chassis == 'car2')
                return 'car2.png';

            if (item.chassis == 'car3')
                return 'car3.gif';

            if (item.chassis == 'car4')
                return 'car4.gif';

            if (item.chassis == 'car5')
                return 'car4.gif';

            if (item.chassis == 'buggy')
                return 'buggy.gif';

            if (item.chassis == 'buggyB')
                return 'buggyB.gif';

            if (item.chassis == 'lambo')
                return 'lambo.gif';

            if (item.chassis == 'terradyne')
                return 'terradyne.gif';
            return null;
        }

        if (type == 'tires') {

            if (item === null)
                return null;

            if (item.tire == 'tire')
                return 'tire1.gif';

            if (item.tire == 'tire2')
                return 'tire2.gif';

            if (item.tire == 'tire3')
                return 'tire3.gif';

            if (item.tire == 'tire4')
                return 'tire4.gif';

            if (item.tire == 'tire2b')
                return 'tire2b.gif';

            return null;
        }

        if (type == 'motors') {

            if (item === null)
                return null;

            if (item.motor == 'motor1')
                return 'motor1.gif';

            if (item.motor == 'motor2')
                return 'motor2.gif';

            return null;
        }
    }

    getMotorItem(motor) {
        const self = this;

        var a = document.createElement('a');
        a.href = '#';
        a.className = 'motor-item';

        const img = document.createElement('img');
        img.className = "nft-image";
        img.src = '/assets/nfts/' + this.getAssetImage(motor, 'motors');

        if (motor.template_mint === "?") {
            const motorNum = document.createElement('h5');
            motorNum.innerHTML = '';
            motorNum.className = 'mint-num';
            a.appendChild(motorNum);
        } else if (motor.template_mint > 0) {
            const motorNum = document.createElement('h5');
            motorNum.innerHTML = '#' + motor.template_mint;
            motorNum.className = 'mint-num';
            a.appendChild(motorNum);
        }

        const motorName = document.createElement('h5');
        motorName.innerHTML = motor.name;

        a.append(motorName);
        a.append(img);

        if (!motor.claim) {

            a.setAttribute("motor-id", motor.id);
            a.setAttribute("maxEngineForce", motor.maxEngineForce);
            a.setAttribute("maxBreakingForce", motor.maxBreakingForce);
            a.setAttribute("motor", motor.motor);

            a.onclick = async function () {

                let mmotor = {};

                mmotor.id = parseInt($(this).attr("motor-id"));
                mmotor.maxEngineForce = parseFloat($(this).attr("maxEngineForce"));
                mmotor.maxBreakingForce = parseFloat($(this).attr("maxBreakingForce"));
                mmotor.motor = $(this).attr("motor");

                /*
                var mountMotor = document.createElement('button');
                mountMotor.innerHTML = "mount motor " + motor.name;

                mountMotor.onclick = async function () {
                    await self.mountAccess(self.selectedCarId, self.selectedCarType, mmotor.id);
                    await sleep(1000);

                    self.engine.removeCar(self.world.myCar);

                    const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                    if (carDef !== null) {
                        self.world.myCar = await self.world.createCar(carDef);
                        self.engine.setCar(self.world.myCar);

                        self.updateCar(carDef, null, null);
                        self.getMotors(carDef.type);
                    }

                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                    }

                    return false;
                }
                */

                
                
                self.engine.removeCar(self.world.myCar);

                const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                if (carDef !== null) {
                    self.world.myCar = await self.world.createCar(carDef);
                    self.engine.setCar(self.world.myCar);
                    self.updateCar(carDef, null, mmotor);
                }
            }
        } else {
            const claim = document.createElement('button');
            claim.className = "btn btn-primary";
            claim.innerHTML = 'claim';
            claim.setAttribute('mid', motor.id);
            claim.onclick = async function () {
                const aid = parseInt($(this).attr('mid'));
                await self.doClaim([aid]);
                await sleep(1000);
                self.getMotors(motor.type);
            }
            a.appendChild(claim);
        }
        return a;
    }



    getTireItem(tire) {
        const self = this;
        const a = document.createElement('a');

        a.href = '#';
        a.className = 'tire-item';

        const img = document.createElement('img');
        img.className = "nft-image";
        img.src = '/assets/nfts/' + this.getAssetImage(tire, 'tires');

        const tireName = document.createElement('h5');
        tireName.innerHTML = tire.name;

        if (tire.template_mint === '?') {
            var tireNum = document.createElement('h5');
            tireNum.className = 'mint-num';
            tireNum.innerHTML = '#' + tire.template_mint;
            a.appendChild(tireNum);
        } else if (tire.template_mint > 0) {
            var tireNum = document.createElement('h5');
            tireNum.className = 'mint-num';
            tireNum.innerHTML = '#' + tire.template_mint;
            a.appendChild(tireNum);
        }

        a.appendChild(tireName);
        a.appendChild(img);

        if (!tire.claim) {

            a.setAttribute("tire-id", tire.id);
            a.setAttribute("damping", tire.damping);
            a.setAttribute("compression", tire.compression);
            a.setAttribute("friction", tire.friction);
            a.setAttribute("stiffness", tire.stiffness);
            a.setAttribute("force", tire.force);
            a.setAttribute("tire", tire.tire);

            a.onclick = async function () {

                let mtire = {};
                mtire.id = parseInt($(this).attr("tire-id"));
                mtire.damping = parseFloat($(this).attr("damping"));
                mtire.compression = parseFloat($(this).attr("compression"));
                mtire.friction = parseFloat($(this).attr("friction"));
                mtire.stiffness = parseFloat($(this).attr("stiffness"));
                mtire.force = parseFloat($(this).attr("force"));
                mtire.tire = $(this).attr('tire');

                var mountTire = document.createElement('button');
                mountTire.className = "btn btn-primary";
                mountTire.innerHTML = "mount tire " + tire.name;
                mountTire.onclick = async function (e) {
                    await self.mountAccess(self.selectedCarId, self.selectedCarType, mtire.id);
                    await sleep(1000);

                    self.engine.removeCar(self.world.myCar);

                    const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                    if (carDef !== null) {
                        self.world.myCar = await self.world.createCar(carDef);
                        self.engine.setCar(self.world.myCar);
                        self.updateCar(carDef, null, null);
                        self.getTires(carDef.type);
                    }

                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                    }
                    return false;
                }

                const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);

                if (carDef !== null) {
                    self.engine.removeCar(self.world.myCar);
                    self.world.myCar = await self.world.createCar(carDef);
                    self.engine.setCar(self.world.myCar);
                    self.updateCar(carDef, mtire, null);
                }
            }
        } else {
            const claim = document.createElement('button');
            claim.innerHTML = 'claim';
            claim.className = 'btn btn-primary';
            claim.setAttribute('tid', tire.id);
            claim.onclick = async function () {
                const aid = parseInt($(this).attr('tid'));
                await self.doClaim([aid]);
                await sleep(1000);
                self.getTires(tire.type);
            }
            a.appendChild(claim);
        }
        return a;
    }

    getCarItem(car) {
        const self = this;

        const card = document.createElement('div');
        card.className = 'car-item';

        const carName = document.createElement('h5');
        carName.innerHTML = car.name;


        const cardh = document.createElement('div');
        cardh.className = 'car-item-header';


        if (car.template_mint > 0) {
            const carMint = document.createElement('h5');
            carMint.innerHTML = '#' + car.template_mint;
            cardh.appendChild(carMint);
        }

        if (car.type == 0) {
            const carType = document.createElement('img');
            carType.className = "store-icon";
            carType.src = "/assets/img/simplemarket.svg";
            cardh.appendChild(carType);

        } else if (car.type == 1) {
            const carType = document.createElement('img');
            carType.className = "store-icon";
            carType.src = "/assets/img/atomichub.png";
            cardh.appendChild(carType);
        }


        cardh.appendChild(carName);

        card.appendChild(cardh);

        const img = document.createElement('img');
        img.className = "nft-image";
        img.src = '/assets/nfts/' + this.getAssetImage(car, 'cars');

        const cardb = document.createElement('div');
        cardb.className = 'car-item-body';
        cardb.appendChild(img);

        if (!car.isfree) {
            var imgt = document.createElement('img');
            imgt.className = "nft-mounted";
            if (car.suspension)
                imgt.src = '/assets/nfts/' + this.getAssetImage(car.suspension, 'tires');
            else
                imgt.src = '/assets/img/notire.png';

            var imgm = document.createElement('img');
            imgm.className = "nft-mounted";

            if (car.motor)
                imgm.src = '/assets/nfts/' + this.getAssetImage(car.motor, 'motors');
            else
                imgm.src = '/assets/img/nomotor.png';

            cardb.append(imgt);
            cardb.append(imgm);

            if (car.DMG) {
                const dmg = this.getCarDamage(car.DMG, car.maxdmg);
                const maindiv = document.createElement('div');
                maindiv.className = "damage-bar";

                const innerdiv = document.createElement('div');
                innerdiv.className = "damage-bar-inner";
                innerdiv.id = 'damages-' + car.id;
                innerdiv.style.width = (dmg.curlife * 100 / car.maxdmg) + '%';

                setInterval(function () {
                    const dmg = self.getCarDamage(car.DMG, car.maxdmg);
                    $('#damages-' + car.id).css('width', (dmg.curlife * 100 / car.maxdmg) + '%');
                }, 1000);

                maindiv.appendChild(innerdiv);
                cardb.appendChild(maindiv);
            } else {
                const initbtn = this.getInitDmgBtn(car);
                cardb.appendChild(initbtn);
            }


        } else {
            var freeCar = document.createElement('p');
            freeCar.className = 'free-car';
            freeCar.innerHTML = 'free car';
            cardb.append(freeCar);
        }

        card.appendChild(cardb);

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.setAttribute('car-id', car.id);
        btn.setAttribute('car-type', car.type);
        btn.setAttribute("data-toggle", "modal");
        btn.setAttribute("data-target", "#car-modal");


        btn.innerHTML = "select";


        btn.onclick = async function (e) {

            const carid = parseInt($(this).attr('car-id'));
            const cartype = parseInt($(this).attr('car-type'));

            self.engine.removeCar(self.world.myCar);

            const carDef = await self.getCar(carid, cartype);
            if (carDef !== null) {
                self.world.myCar = await self.world.createCar(carDef);
                self.engine.setCar(self.world.myCar);
                self.updateCar(carDef, null, null);
            }

            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            return false;
        };

        const cardf = document.createElement('div');
        cardf.className = 'car-item-footer';
        cardf.appendChild(btn);
        card.appendChild(cardf);
        return card;
    }

    async updateCar(icar, addTire, addMotor) {
        const self = this;

        if (!icar.isfree) {
            if (this.dmgTimer) {
                clearTimeout(this.dmgTimer);
                this.dmgTimer = null;
            }
            await this.getDamage(icar, true);
        }
        else {
            $('#init-damage').html('');
        }

        console.log(icar);

        $("#car-weight").html(icar.massVehicle + ' kg');
        $("#suspension-length").html( meshsInfos[icar.chassis].suspensionRestLength+ ' cm');

        
        $("#car-stability").html(1.0 - meshsInfos[icar.chassis].rollInfluence);

        if (icar.type === 0)
            $('#car-market').html('<img class="market-icon" src="/assets/img/simplemarket.svg" />');
        else
            $('#car-market').html('<img class="market-icon" src="/assets/img/atomichub.png" />');

        $("#car-name").html(icar.name);
        $("#chassis").html(icar.chassis);

        $("#steeringIncrement").html(icar.steeringIncrement.toFixed(2));
        $("#steeringClamp").html(icar.steeringClamp.toFixed(2));

        this.selectedCarId = icar.id;
        this.selectedCarType = icar.type;

        $('#tire-mount').html('');
        $('#motor-mount').html('');

        $('#tire-unmount').html('');
        $('#motor-unmount').html('');
        $("#select-lnk").html('');
        $("#garage-lnk").html('');

        if (icar.isfree) {
            $("#damping-to").html('');
            $("#compression-to").html('');
            $("#friction-to").html('');
            $("#stiffness-to").html('');
            $("#force-to").html('');


            $("#maxEngineForce-to").html('');
            $("#maxBreakingForce-to").html('');

            var play = document.createElement('a');
            play.href = '/selectCar?carid=' + icar.id + '&type=-1&to=start';
            play.className = "btn btn-primary";
            play.innerHTML = 'play';
            $('#select-lnk').append(play);
        } else {

            var garage = document.createElement('a');
            garage.className = "btn btn-primary";
            garage.href = '/selectCar?carid=' + icar.id + '&type=' + icar.type + '&to=garage';
            garage.innerHTML = 'garage';
            $('#garage-lnk').append(garage);

            if (icar.suspension && icar.motor && icar.DMG) {
                var play = document.createElement('a');
                play.className = "btn btn-primary";
                play.href = '/selectCar?carid=' + icar.id + '&type=' + icar.type + '&to=start';
                play.innerHTML = 'play';
                $('#select-lnk').append(play);
            } else {

                var play = document.createElement('btn');
                play.className = "btn btn-secondary";
                play.href = '#';
                play.innerHTML = 'play';
                $(play).prop('disabled', true);
                $('#select-lnk').append(play);

                if (!icar.suspension) {
                    var noplay = document.createElement('p');
                    noplay.className = "play-error";
                    noplay.innerHTML = 'no tires';
                    $('#select-lnk').append(noplay);
                }
                if (!icar.motor) {
                    var noplay = document.createElement('p');
                    noplay.className = "play-error";
                    noplay.innerHTML = 'no motor';
                    $('#select-lnk').append(noplay);
                }
                if (!icar.DMG) {
                    var noplay = document.createElement('p');
                    noplay.className = "play-error";
                    noplay.innerHTML = 'initialize damages';



                    $('#select-lnk').append(noplay);
                }
            }
        }

        let statKeys = null;

        if ((icar.chassis == "car3") || (icar.chassis == "car4") || (icar.chassis == "buggy")) {
            statKeys = this.statKeysC;
        } else if ((icar.chassis == "lambo") || (icar.chassis == "buggyB") || (icar.chassis == "terradyne")) {
            statKeys = this.statKeysB;
        } else if (icar.chassis == "car5") {
            statKeys = this.statKeysA;
        }



        if (icar.suspension) {

            $('#tire-unmount-name').val(icar.suspension.name);
            $('#tire-name').html(icar.suspension.name);

            $("#damping").html(icar.suspension.damping.toFixed(2));
            $("#compression").html(icar.suspension.compression.toFixed(2));
            $("#friction").html(icar.suspension.friction.toFixed(2));
            $("#stiffness").html(icar.suspension.stiffness.toFixed(2));

            if (icar.suspension.force)
                $("#force").html(icar.suspension.force.toFixed(2));
            else
                $("#force").html(6000);

            const tireIMG = this.getAssetImage(icar.suspension, "tires");
            $('#current-tire-nft').html('<img class="mounted-asset-icon" src="/assets/nfts/' + tireIMG + '">');


            if(statKeys)
            {
                $("#damping-max").html(statKeys['damping'].max);
                $("#compression-max").html(statKeys['compression'].max);
                $("#friction-max").html(statKeys['friction'].max);
                $("#stiffness-max").html(statKeys['stiffness'].max);
                $("#force-max").html(statKeys['force'].max);
            }

            const ks = ['compression', 'damping', 'stiffness', 'friction', 'force'];
            const arr = this.cfg.steel_per_up.split(' ');

            for (let k of ks) {

                $("#" + k + "-mod").html('');
                $("#" + k + "-mod-v").html('');

                let ov = icar.suspension[k];
                let d;
                let q = 0.0;

                if (this.statMod[k] > 0) {

                    if (ov >= statKeys[k].max) {
                        this.statMod[k] = 0;
                        $("#" + k + "-mod-v").html('');
                        $("#" + k + "-mod").html('max');
                        continue;
                    }

                    let nn = 0.0;

                    for (let n = 0; n < this.statMod[k]; n++) {
                        const ni = statKeys[k].max * this.cfg.per / 100.0;

                        q += parseFloat(arr[0]);

                        if ((ov + ni) >= statKeys[k].max) {
                            this.statMod[k] = n + 1;
                            nn += statKeys[k].max - ov;
                            break;
                        }
                        ov += ni;
                        nn += ni;
                    }

                    const per = document.createElement('span');
                    per.innerHTML = '+' + nn.toFixed(2);
                    per.className = 'stat-mod-add';
                    $("#" + k + "-mod-v").html(per);

                    const qd = document.createElement('h4');
                    qd.innerHTML = q;
                    qd.className = 'stat-mod-sub';

                    $("#" + k + "-mod").append(qd);
                    $("#" + k + "-mod").append('<img class="steel-token-icon" src="/assets/img/steel-icon.png"/>');

                    d = 1;
                } else if (this.statMod[k] < 0) {

                    if (ov <= 0) {
                        this.statMod[k] = 0;
                        $("#" + k + "-mod-v").html('');
                        $("#" + k + "-mod").html('min');
                        continue;
                    }

                    let nn = 0.0;

                    for (let n = 0; n < Math.abs(this.statMod[k]); n++) {
                        const ni = statKeys[k].max * this.cfg.per / 100.0;

                        q += parseFloat(arr[0]);

                        if ((ov - ni) <= 0.0) {
                            this.statMod[k] = -(n + 1);
                            nn -= ov;
                            break;
                        }

                        ov -= ni;
                        nn -= ni;
                    }


                    const per = document.createElement('span');
                    per.innerHTML = nn.toFixed(2);
                    per.className = 'stat-mod-sub';
                    $("#" + k + "-mod-v").html(per);

                    const qd = document.createElement('h4');
                    qd.innerHTML = q;
                    qd.className = 'stat-mod-sub';

                    $("#" + k + "-mod").append(qd);
                    $("#" + k + "-mod").append('<img class="steel-token-icon" src="/assets/img/steel-icon.png"/>');
                    d = 0;
                }

                if (this.statMod[k] != 0)
                    $("#" + k + "-mod").append('<a href="#" onclick="wallet.modStat(' + q + ',\'' + k + '\',' + d + ', ' + icar.type + '); return false;"><img class="upgrade-icon" src="/assets/img/upgrade-icon.svg"/></a>');
            }


            if (!icar.isfree) {

                var unmountTireTxt = document.createElement('p');
                unmountTireTxt.className = "mnt-txt";
                unmountTireTxt.innerHTML = "unmount tire";

                var unmountTire = document.createElement('a');
                unmountTire.className = 'unmount-btn'
                unmountTire.href = '#';
                unmountTire.appendChild(unmountTireTxt);

                unmountTire.onclick = async function () {

                    const assetName = $('#tire-unmount-name').val();
                    await self.unmountAccess(self.selectedCarId, self.selectedCarType, 'tires', assetName);
                    await sleep(2000);

                    self.engine.removeCar(self.world.myCar);
                    const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                    if (carDef !== null) {
                        self.world.myCar = await self.world.createCar(carDef);
                        self.engine.setCar(self.world.myCar);

                        self.updateCar(carDef, null, null);
                        self.getTires(carDef.type);
                    }
                }

                $('#tire-unmount').append(unmountTire);

            } else {
                $('#tire-unmount').html('cannot modify free cars');
            }
        } else {

            let txt = '--';
            $("#damping").html(txt);
            $("#compression").html(txt);
            $("#friction").html(txt);
            $("#stiffness").html(txt);
            $("#force").html(txt);
            $('#current-tire-nft').html('<img class="mounted-asset-icon" src="/assets/img/notire.png">');
            $('#tire-unmount-name').val('');
            $('#tire-name').html('no tire');
        }

        if (icar.motor) {

            $('#motor-unmount-name').val(icar.motor.name);

            $('#motor-name').html(icar.motor.name);

            $("#maxEngineForce").html(icar.motor.maxEngineForce.toFixed(2));
            $("#maxBreakingForce").html(icar.motor.maxBreakingForce.toFixed(2));

            const motorIMG = this.getAssetImage(icar.motor, "motors");
            $('#current-motor-nft').html('<img class="mounted-asset-icon" src="/assets/nfts/' + motorIMG + '">');

            if (!icar.isfree) {


                var unmountMotorTxt = document.createElement('p');
                unmountMotorTxt.className = "mnt-txt";
                unmountMotorTxt.innerHTML = "unmount motor";

                var unmountMotor = document.createElement('a');
                unmountMotor.className = 'unmount-btn'
                unmountMotor.href = '#';
                unmountMotor.appendChild(unmountMotorTxt);

                unmountMotor.onclick = async function () {
                    const assetName = $('#motor-unmount-name').val();
                    await self.unmountAccess(self.selectedCarId, self.selectedCarType, 'motors', assetName);
                    await sleep(2000);

                    const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                    if (carDef !== null) {
                        self.world.myCar = await self.world.createCar(carDef);
                        self.engine.setCar(self.world.myCar);
                        self.updateCar(carDef, null, null);
                    }

                    self.getMotors(carDef.type);

                    return false;

                }
                $('#motor-unmount').append(unmountMotor);

            } else {
                $('#motor-unmount').html('cannot modify free cars');
            }

        } else {
            $('#current-motor-nft').html('<img class="mounted-asset-icon" src="/assets/img/nomotor.png">');
            $("#maxEngineForce").html('--');
            $("#maxBreakingForce").html('--');
            $('#motor-unmount').html('');
            $('#motor-unmount-name').val('');
            $('#motor-name').html('no motor');
        }

        if (icar.isfree) {
            $('#motor-mount').html('cannot modify free cars');
            $('#tire-mount').html('cannot modify free cars');
            return;
        }

        if (addTire === null) {
            $("#damping-to").html('');
            $("#compression-to").html('');
            $("#friction-to").html('');
            $("#stiffness-to").html('');
            $("#force-to").html('');
            $('#replace-tire-nft').html('');
            $('#tire-mount').html('');


        } else {
            $("#damping-to").html(addTire.damping.toFixed(2));
            $("#compression-to").html(addTire.compression.toFixed(2));
            $("#friction-to").html(addTire.friction.toFixed(2));
            $("#stiffness-to").html(addTire.stiffness.toFixed(2));
            $("#force-to").html(addTire.force.toFixed(2));

            const tireIMG = this.getAssetImage(addTire, "tires");
            $('#replace-tire-nft').html('<img class="mounted-asset-icon" src="/assets/nfts/' + tireIMG + '">');

            var mountTireTxt = document.createElement('p');
            mountTireTxt.className = "mnt-txt";
            mountTireTxt.innerHTML = "mount tire";

            var mountTire = document.createElement('a');
            mountTire.href = '#';
            mountTire.className = "mount-btn";
            mountTire.appendChild(mountTireTxt);
            mountTire.onclick = async function () {
                await self.mountAccess(self.selectedCarId, self.selectedCarType, addTire.id);
                await sleep(2000);

                self.engine.removeCar(self.world.myCar);
                const carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                if (carDef !== null) {
                    self.world.myCar = await self.world.createCar(carDef);
                    self.engine.setCar(self.world.myCar);

                    self.updateCar(carDef, null, null);
                    self.getTires(carDef.type);
                }
            }
            $('#tire-mount').append(mountTire);
        }

        if (addMotor === null) {
            $("#maxEngineForce-to").html('');
            $("#maxBreakingForce-to").html('');
            $('#replace-motor-nft').html('');
            $('#motor-mount').html('');

        } else {

            $("#maxEngineForce-to").html(addMotor.maxEngineForce.toFixed(2));
            $("#maxBreakingForce-to").html(addMotor.maxBreakingForce.toFixed(2));

            var mountMotorTxt = document.createElement('p');
            mountMotorTxt.className = "mnt-txt";
            mountMotorTxt.innerHTML = "mount motor";

            var mountMotor = document.createElement('a');
            mountMotor.className = 'mount-btn'
            mountMotor.href = '#';
            mountMotor.appendChild(mountMotorTxt);

            const motorIMG = this.getAssetImage(addMotor, "motors");
            $('#replace-motor-nft').html('<img class="mounted-asset-icon" src="/assets/nfts/' + motorIMG + '">');

            mountMotor.onclick = async function () {
                await self.mountAccess(self.selectedCarId, self.selectedCarType, addMotor.id);
                await sleep(2000);

                self.engine.removeCar(self.world.myCar);

                var carDef = await self.getCar(self.selectedCarId, self.selectedCarType);
                if (carDef !== null) {
                    self.world.myCar = await self.world.createCar(carDef);
                    self.engine.setCar(self.world.myCar);
                    self.updateCar(carDef, null, null);
                    self.getMotors(carDef.type);
                }
            }

            $('#motor-mount').append(mountMotor);

        }


    }

    getInitDmgBtn(icar) {
        const self = this;

        const initbtn = document.createElement("a");
        initbtn.setAttribute('carid', icar.id);
        initbtn.setAttribute('cartype', icar.type);
        initbtn.href = '#';
        initbtn.className = "init-dmg-lnk";
        initbtn.innerHTML = 'init damages';
        initbtn.onclick = async function (e) {
            const id = parseInt($(this).attr('carid'));
            const type = parseInt($(this).attr('cartype'));
            await self.initdmg(id, type);
            await sleep(1000);
            self.getDamage(icar, true);

            if (e.preventDefault)
                e.preventDefault();

            return false;
        }

        return initbtn;
    }

    async getNitros() {

        const uid = this.serName(this.myAccount);

        var req = {
            json: true,                             // Get the response as json
            code: this.appInfos.mainContract,       // Contract that we target
            scope: this.appInfos.mainContract,      // Account that owns the data
            table: 'nitros',                        // Table name
            lower_bound: this.myAccount,
            limit: 1,                              // Maximum number of rows that we want to get
        };

        const nitro = await this.wax.rpc.get_table_rows(req);

        if ((nitro.rows.length === 0) || (nitro.rows[0].owner !== this.myAccount)) {
            $('#nitros').html('no nitros');
            return 0;
        }
        $('#nitros').html('x' + nitro.rows[0].num);
    }

    async getDamage(icar, update) {
        const self = this;
        $('#init-damage').html('');

        if (!icar.DMG) {

            var dreq = {
                json: true,                             // Get the response as json
                code: this.appInfos.mainContract,       // Contract that we target
                scope: this.appInfos.mainContract,      // Account that owns the data
                table: 'cardammage',                    // Table name
                lower_bound: icar.id,
                limit: 1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            const damages = await this.wax.rpc.get_table_rows(dreq);
            if ((damages.rows.length === 0) || (parseInt(damages.rows[0].id) !== icar.id)) {

                const initbtn = this.getInitDmgBtn(icar);

                $('#init-damage').html('');
                $('#init-damage').append(initbtn);

                return 0;
            }
            icar.DMG = damages.rows[0];
        }

        const now = new Date().getTime() / 1000;
        const delta = now - icar.DMG.time;
        const repair_amount = delta * icar.maxdmg / this.cfg.repair_time;
        const curdmg = Math.max(parseInt(icar.DMG.damage - repair_amount), 0);

        const fullTime = curdmg * this.cfg.repair_time / icar.maxdmg;
        const fullTimeTxt = getTimeTxt(fullTime);

        const curlife = icar.maxdmg - curdmg;
        $('#init-damage').html(curlife + ' / ' + icar.maxdmg + ' ' + fullTimeTxt);

        if (update > 0) {
            this.dmgTimer = setTimeout(function () { self.getDamage(icar, update); }, 1000);
        }
    }

    async getAssetsSA(categories) {
        let next_key = null;
        let result, oresult, aresult;
        let ids = [];

        var oreq = {
            json: true,                             // Get the response as json
            code: this.appInfos.SA.contract,
            table: `offers`,
            scope: this.appInfos.SA.contract,
            key_type: `name`,
            index_position: 3,
            lower_bound: this.myAccount,
            higher_bound: this.myAccount,
            limit: -1,
            reverse: false,                         // Optional: Get reversed data
            show_payer: false                       // Optional: Show ram payer
        };

        try {
            oresult = await this.wax.rpc.get_table_rows(oreq);
        }
        catch (e) {
            this.newAlert('error getAssetsSA offers' + e.message);
            return null;
        }

        var oids = [];
        for (let n = 0; n < oresult.rows.length; n++) {
            if (oresult.rows[n].owner !== this.appInfos.SA.collectionName)
                continue;

            oids.push(oresult.rows[n].assetid);
        }

        // no upper_bound provided, need to check if owner is actually the account we queried
        if (oids.length > 0) {
            do {

                var areq = {
                    json: true,                              // Get the response as json
                    code: this.appInfos.SA.contract,         // Contract that we target
                    scope: this.appInfos.SA.collectionName,  // Account that owns the data
                    table: 'sassets',                        // Table name
                    limit: -1,                               // Maximum number of rows that we want to get
                    reverse: false,                          // Optional: Get reversed data
                    show_payer: false                        // Optional: Show ram payer
                };

                if (next_key !== null) {
                    areq.lower_bound = next_key;
                }

                try {
                    aresult = await this.wax.rpc.get_table_rows(areq);
                }
                catch (e) {
                    this.newAlert('error getAssetsSA ' + e.message);
                    return null;
                }

                for (let n = 0; n < aresult.rows.length; n++) {

                    if (oids.indexOf(aresult.rows[n].id) < 0)
                        continue;

                    if (aresult.rows[n].author !== this.appInfos.SA.collectionName)
                        continue;

                    if (categories.indexOf(aresult.rows[n].category) < 0)
                        continue;

                    let aid = parseInt(aresult.rows[n].id);
                    if (ids.indexOf(aid) >= 0)
                        continue;

                    const idata = JSON.parse(aresult.rows[n].idata);
                    const mdata = aresult.rows[n].mdata;

                    var asset;
                    var sus = null;
                    var motor = null;

                    if (aresult.rows[n].category == 'cars') {
                        var jmdata;
                        try {
                            jmdata = JSON.parse(mdata);

                            if (jmdata.suspension)
                                sus = { name: jmdata.suspension.name, tire: jmdata.suspension.tire, force: parseFloat(jmdata.suspension.force), compression: parseFloat(jmdata.suspension.compression), stiffness: parseFloat(jmdata.suspension.stiffness), damping: parseFloat(jmdata.suspension.damping), friction: parseFloat(jmdata.suspension.friction) };

                            if (jmdata.motor)
                                motor = { name: jmdata.motor.name, motor: jmdata.motor.motor, maxEngineForce: parseFloat(jmdata.motor.maxEngineForce), maxBreakingForce: parseFloat(jmdata.motor.maxBreakingForce) };

                        }
                        catch (e) {
                            jmdata = { suspension: null, motor: null };
                        }

                        asset = { id: aresult.rows[n].id, templateç_mint: -1, type: 0, claim: true, name: idata.name, chassis: idata.chassis, massVehicle: parseFloat(idata.massVehicle), steeringClamp: parseFloat(idata.steeringClamp), steeringIncrement: parseFloat(idata.steeringIncrement), maxdmg: parseInt(idata.maxdmg), suspension: sus, motor: motor, mdata: mdata };
                    }
                    else if (aresult.rows[n].category == 'tires')
                        asset = { id: aresult.rows[n].id, templateç_mint: -1, type: 0, claim: true, name: idata.name, tire: idata.tire, force: parseFloat(idata.force), compression: parseFloat(idata.compression), stiffness: parseFloat(idata.stiffness), damping: parseFloat(idata.damping), friction: parseFloat(idata.friction), mdata: mdata };
                    else if (aresult.rows[n].category == 'motors')
                        asset = { id: aresult.rows[n].id, templateç_mint: -1, type: 0, claim: true, name: idata.name, motor: idata.motor, maxEngineForce: parseFloat(idata.maxEngineForce), maxBreakingForce: parseFloat(idata.maxBreakingForce), mdata: mdata };

                    this.assetLists[aresult.rows[n].category].push(asset);

                    ids.push(aid);
                }

                if (aresult.more === true)
                    next_key = parseInt(aresult.next_key);
                else
                    next_key = null;

            } while (aresult.more)
        }

        do {

            var req = {
                json: true,                             // Get the response as json
                code: this.appInfos.SA.contract,       // Contract that we target
                scope: this.myAccount,                  // Account that owns the data
                table: 'sassets',                        // Table name
                limit: -1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            if (next_key !== null) {
                req.lower_bound = next_key;
            }

            try {
                result = await this.wax.rpc.get_table_rows(req);
            }
            catch (e) {
                this.newAlert('error getAssetsSA ' + e.message);
                return null;
            }

            for (let n = 0; n < result.rows.length; n++) {


                //console.log('SA ',result.rows[n].author,this.appInfos.SA.collectionName,result.rows[n].category,result.rows[n].id);

                if (result.rows[n].author !== this.appInfos.SA.collectionName)
                    continue;

                if (categories.indexOf(result.rows[n].category) < 0)
                    continue;

                let aid = parseInt(result.rows[n].id);
                if (ids.indexOf(aid) >= 0)
                    continue;

                const idata = JSON.parse(result.rows[n].idata);
                const mdata = result.rows[n].mdata;

                //console.log(idata);

                var asset;
                var sus = null;
                var motor = null;

                if (result.rows[n].category == 'cars') {

                    var jmdata;
                    try {
                        jmdata = JSON.parse(mdata);

                        if (jmdata.suspension)
                            sus = { name: jmdata.suspension.name, tire: jmdata.suspension.tire, force: parseFloat(jmdata.suspension.force), compression: parseFloat(jmdata.suspension.compression), stiffness: parseFloat(jmdata.suspension.stiffness), damping: parseFloat(jmdata.suspension.damping), friction: parseFloat(jmdata.suspension.friction) };

                        if (jmdata.motor)
                            motor = { name: jmdata.motor.name, motor: jmdata.motor.motor, maxEngineForce: parseFloat(jmdata.motor.maxEngineForce), maxBreakingForce: parseFloat(jmdata.motor.maxBreakingForce) };
                    }
                    catch (e) {
                        jmdata = { suspension: null, motor: null };
                    }
                    asset = { id: result.rows[n].id, type: 0, claim: false, name: idata.name, chassis: idata.chassis, massVehicle: parseFloat(idata.massVehicle), steeringClamp: parseFloat(idata.steeringClamp), steeringIncrement: parseFloat(idata.steeringIncrement), maxdmg: parseInt(idata.maxdmg), suspension: sus, motor: motor, mdata: mdata };
                }
                else if (result.rows[n].category == 'tires')
                    asset = { id: result.rows[n].id, type: 0, claim: false, name: idata.name, tire: idata.tire, force: parseFloat(idata.force), compression: parseFloat(idata.compression), stiffness: parseFloat(idata.stiffness), damping: parseFloat(idata.damping), friction: parseFloat(idata.friction), mdata: mdata };
                else if (result.rows[n].category == 'motors')
                    asset = { id: result.rows[n].id, type: 0, claim: false, name: idata.name, motor: idata.motor, maxEngineForce: parseFloat(idata.maxEngineForce), maxBreakingForce: parseFloat(idata.maxBreakingForce), mdata: mdata };

                this.assetLists[result.rows[n].category].push(asset);

                ids.push(aid);
            }

            if (result.more === true)
                next_key = parseInt(result.next_key);
            else
                next_key = null;

        } while (result.more)
    }

    async getTemplate(id) {

        if (typeof this.TemplateData[id] !== 'undefined') {
            return this.TemplateData[id];
        }

        var req = {
            json: true,                               // Get the response as json
            code: this.appInfos.AA.contract,     // Contract that we target
            scope: this.appInfos.AA.collectionName, // Account that owns the data
            table: 'templates',                       // Table name
            limit: 1,                                 // Maximum number of rows that we want to get
            lower_bound: id,
            reverse: false,                           // Optional: Get reversed data
            show_payer: false                         // Optional: Show ram payer
        };

        try {
            const result = await this.wax.rpc.get_table_rows(req);
            const templ = await this.explore.getTemplate(this.appInfos.AA.collectionName, id);

            const ss = await templ._schema;
            const form = await ss.format();

            if (typeof result.rows[0].immutable_serialized_data == 'string')
                this.TemplateData[id] = await deserialize(hexToBytes(result.rows[0].immutable_serialized_data), form);
            else
                this.TemplateData[id] = await deserialize(result.rows[0].immutable_serialized_data, form);

            return this.TemplateData[id];
        }
        catch (e) {
            console.log('getTemplate errror ' + e.message);
            return false;
        }

    }

    async getSchema(asset) {
        const Schema = await this.explore.getSchema(this.appInfos.AA.collectionName, asset.schema_name);
        const form = await Schema.format();

        var data;

        const tid = parseInt(asset.template_id);

        if (tid > 0) {
            data = this.getTemplate(tid);
        }
        else {
            if (typeof asset.immutable_serialized_data == 'string')
                data = await deserialize(hexToBytes(asset.immutable_serialized_data), form);
            else
                data = await deserialize(asset.immutable_serialized_data, form);

        }


        return data;
    }

    async getMSchema(asset) {
        const Schema = await this.explore.getSchema(this.appInfos.AA.collectionName, asset.schema_name);
        const form = await Schema.format();

        var data;
        var s, m;

        if (typeof asset.mutable_serialized_data == 'string')
            data = await deserialize(hexToBytes(asset.mutable_serialized_data), form);
        else
            data = await deserialize(asset.mutable_serialized_data, form);

        if (data.suspension) {

            const str = base58_to_binary(data.suspension);
            const SchemaT = await this.explore.getSchema(this.appInfos.AA.collectionName, "tires");
            const formT = await SchemaT.format();

            s = await deserialize(str, formT);
        }

        if (data.motor) {
            const str = base58_to_binary(data.motor);
            const SchemaM = await this.explore.getSchema(this.appInfos.AA.collectionName, "motors");
            const formM = await SchemaM.format();

            m = await deserialize(str, formM);
        }


        return { motor: m, suspension: s };
    }

    /*
    async getTemplate(id)
    {
      if(typeof this.TemplateData[id] !== 'undefined')
      {
          return this.TemplateData[id];
      }
      let data = await jQuery.getJSON({dataType: "json", url :'/getTemplate?template_id='+id});

      if(data.error)
      {
          newAlert('unable to get template data '+ id +' ' +data.error);
          console.log('unable to get template data '+ id +' ' +data.error);
          return;
      }

      this.TemplateData[id] = data.result;
      return this.TemplateData[id];
    }
    */

    async getAssetsAA(categories) {
        let next_key = null;
        let result;
        let ids = [];



        do {

            var req = {
                json: true,                             // Get the response as json
                code: this.appInfos.AA.contract,       // Contract that we target
                scope: this.myAccount,                  // Account that owns the data
                table: 'assets',                        // Table name
                limit: -1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            if (next_key !== null) {
                req.lower_bound = next_key;
            }

            try {
                result = await this.wax.rpc.get_table_rows(req);
            }
            catch (e) {
                this.newAlert('error getAssetsAA ' + e.message);
                return null;
            }

            for (let n = 0; n < result.rows.length; n++) {
                if (result.rows[n].collection_name !== this.appInfos.AA.collectionName)
                    continue;

                if (categories.indexOf(result.rows[n].schema_name) < 0)
                    continue;

                let aid = parseInt(result.rows[n].asset_id);
                if (ids.indexOf(aid) >= 0)
                    continue;

                const idata = await this.getSchema(result.rows[n]);//result.rows[n].immutable_serialized_data;

                var asset;

                if (result.rows[n].schema_name == 'cars') {
                    var jmdata;
                    try {

                        jmdata = await this.getMSchema(result.rows[n]);
                    }
                    catch (e) {
                        jmdata = { suspension: null, motor: null };
                        console.log('getAssetsAA getMSchema error ' + e.message);
                    }

                    asset = { id: result.rows[n].asset_id, template_mint: '?', type: 1, name: idata.name, chassis: idata.chassis, massVehicle: idata.massVehicle, steeringClamp: idata.steeringClamp, steeringIncrement: idata.steeringIncrement, maxdmg: idata.maxdmg, suspension: jmdata.suspension, motor: jmdata.motor, DMG: null };

                }
                else if (result.rows[n].schema_name == 'tires')
                    asset = { id: result.rows[n].asset_id, template_mint: '?', type: 1, name: idata.name, tire: idata.tire, force: idata.force, compression: idata.compression, stiffness: idata.stiffness, damping: idata.damping, friction: idata.friction, DMG: null };
                else if (result.rows[n].schema_name == 'motors')
                    asset = { id: result.rows[n].asset_id, template_mint: '?', type: 1, name: idata.name, motor: idata.motor, maxEngineForce: idata.maxEngineForce, maxBreakingForce: idata.maxBreakingForce, DMG: null };

                this.assetLists[result.rows[n].schema_name].push(asset);

                ids.push(aid);
            }

            if (result.more === true)
                next_key = parseInt(result.next_key);
            else
                next_key = null;

        } while (result.more)

        const jids = ids.join(',');

        //try{
        //const mr = await jQuery.getJSON({ dataType: "json", url: 'https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name=' + this.appInfos.AA.collectionName + '&ids=' + jids });


        const r = await fetch('https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name=' + this.appInfos.AA.collectionName + '&ids=' + jids );
        const mr = await r.json();

        for (let n = 0; n < mr.data.length; n++) {
            for (let k in this.assetLists) {
                for (let nn = 0; nn < this.assetLists[k].length; nn++) {
                    if (this.assetLists[k][nn].id == mr.data[n].asset_id) {
                        if (mr.data[n].template)
                            this.assetLists[k][nn].template_mint = mr.data[n].template_mint;

                        //this.assetLists[k][nn].issued_supply = mr.data[n].template.issued_supply;
                    }
                }
            }
        }/*
        }
        catch(e)
        {
          console.log('error explorer ' + e.message);
        }*/

    }

    getCarDamage(DMG, maxdmg) {
        const now = new Date().getTime() / 1000;
        const delta = now - DMG.time;
        const repair_amount = delta * maxdmg / this.cfg.repair_time;
        const curdmg = Math.max(parseInt(DMG.damage - repair_amount), 0);

        const fullTime = curdmg * this.cfg.repair_time / maxdmg;
        const fullTimeTxt = getTimeTxt(fullTime);
        const curlife = maxdmg - curdmg;

        return { timeTxt: fullTimeTxt, curlife: curlife }
    }


    async getAssets(categories, type = 3) {

        this.assetLists = [];

        if (!this.myAccount)
            return null;

        for (let n = 0; n < categories.length; n++) {
            this.assetLists[categories[n]] = new Array();
        }

        switch (type) {
            case 0: await this.getAssetsSA(categories); break;
            case 1: await this.getAssetsAA(categories); break;
            default:
                await this.getAssetsAA(categories);
                await this.getAssetsSA(categories);
                break;
        }


        if (this.assetLists['cars']) {
            var damages;
            var next_key;

            do {
                var dreq = {
                    json: true,                             // Get the response as json
                    code: this.appInfos.mainContract,       // Contract that we target
                    scope: this.appInfos.mainContract,      // Account that owns the data
                    table: 'cardammage',                    // Table name
                    reverse: false,                         // Optional: Get reversed data
                    show_payer: false                       // Optional: Show ram payer
                };

                if (next_key !== null) {
                    dreq.lower_bound = next_key;
                }

                damages = await this.wax.rpc.get_table_rows(dreq);

                for (let n = 0; n < this.assetLists['cars'].length; n++) {
                    for (let d = 0; d < damages.rows.length; d++) {
                        if (damages.rows[d].id == this.assetLists['cars'][n].id) {
                            this.assetLists['cars'][n].DMG = { time: damages.rows[d].time, damage: damages.rows[d].damage }
                        }
                    }
                }

                if (damages.more === true)
                    next_key = parseInt(damages.next_key);
                else
                    next_key = null;

            } while (damages.more)
        }




        return this.assetLists;

    }

    async freeRepairedCars() {

        var ids = [];
        for (let asset of this.repairedAssets) {
            ids.push(asset.id);
        }

        
        const TxData = { actions: [{ account: this.appInfos.mainContract, name: "freedmg", authorization: [{ actor: this.myAccount, permission: "active" }], data: { owner: this.myAccount, ids: ids } }] };
        const TxOptions = { blocksBehind: 3, expireSeconds: 30, sign: true };
        return await this.doTx(TxData, TxOptions);
    }

    async getRepairedCars() {

        var damages;
        var next_key = null;
        var dmgs = [];


        do {
            var dreq = {
                json: true,                             // Get the response as json
                code: this.appInfos.mainContract,       // Contract that we target
                scope: this.appInfos.mainContract,      // Account that owns the data
                table: 'cardammage',                    // Table name
                limit: -1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            if (next_key !== null) {
                dreq.lower_bound = next_key;
            }

            try {
                damages = await this.wax.rpc.get_table_rows(dreq);
            }
            catch (e) {
                this.newAlert('error getRepairedCars ' + e.message);
                console.log('error getRepairedCars ' + e.message);
                return null;
            }

            
            for (let n = 0; n < damages.rows.length; n++) {
                if (damages.rows[n].payer === this.myAccount) {
                    const iid = parseInt(damages.rows[n].id);
                    dmgs[iid] = { time: damages.rows[n].time, dmg: damages.rows[n].dmg };
                }
            }

            if (damages.more === true)
                next_key = parseInt(damages.next_key);
            else
                next_key = null;

        } while (damages.more)


        var result;

        next_key = null;

        this.repairedAssets = [];
        const now = new Date().getTime() / 1000;

        do {

            var req = {
                json: true,                             // Get the response as json
                code: this.appInfos.SA.contract,       // Contract that we target
                scope: this.myAccount,                  // Account that owns the data
                table: 'sassets',                        // Table name
                limit: -1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            if (next_key !== null) {
                req.lower_bound = next_key;
            }

            try {
                result = await this.wax.rpc.get_table_rows(req);
            }
            catch (e) {
                this.newAlert('error getAssetsSA ' + e.message);
                return null;
            }

            for (let n = 0; n < result.rows.length; n++) {
                if (result.rows[n].author !== this.appInfos.SA.collectionName)
                    continue;

                if (result.rows[n].category !== 'cars')
                    continue;

                let aid = parseInt(result.rows[n].id);
                if (!dmgs[aid])
                    continue;

                const delta = now - dmgs[aid].time;
                const repair_amount = delta * result.rows[n].maxdmg / this.cfg.repair_time;

                if (dmgs[aid].damage > repair_amount)
                    continue;

                const idata = JSON.parse(result.rows[0].idata);
                const asset = { id: aid, type: 0, maxdmg: idata.maxdmg, name: idata.name, chassis: idata.chassis, massVehicle: idata.massVehicle, steeringClamp: idata.steeringClamp, steeringIncrement: idata.steeringIncrement };

                this.repairedAssets.push(asset);
            }

            if (result.more === true)
                next_key = parseInt(result.next_key);
            else
                next_key = null;

        } while (result.more)

        next_key = null;

        do {

            var req = {
                json: true,                             // Get the response as json
                code: this.appInfos.AA.contract,       // Contract that we target
                scope: this.myAccount,                  // Account that owns the data
                table: 'assets',                        // Table name
                limit: -1,                              // Maximum number of rows that we want to get
                reverse: false,                         // Optional: Get reversed data
                show_payer: false                       // Optional: Show ram payer
            };

            if (next_key !== null) {
                req.lower_bound = next_key;
            }

            try {
                result = await this.wax.rpc.get_table_rows(req);
            }
            catch (e) {
                this.newAlert('error getAssetsAA ' + e.message);
                return null;
            }

            for (let n = 0; n < result.rows.length; n++) {
                if (result.rows[n].collection_name !== this.appInfos.AA.collectionName)
                    continue;

                if (result.rows[n].schema_name !== 'cars')
                    continue;

                let aid = parseInt(result.rows[n].asset_id);
                if (!dmgs[aid])
                    continue;

                const idata = await this.getSchema(result.rows[n]);//result.rows[n].immutable_serialized_data;

                const asset = { id: aid, type: 1, name: idata.name, chassis: idata.chassis, massVehicle: idata.massVehicle, steeringClamp: idata.steeringClamp, steeringIncrement: idata.steeringIncrement, maxdmg: idata.maxdmg };
                this.repairedAssets.push(asset);
            }

            if (result.more === true)
                next_key = parseInt(result.next_key);
            else
                next_key = null;

        } while (result.more)

        if (this.repairedAssets.length > 0)
            $('#repair-cars-btn').prop('disabled', false);
        else
            $('#repair-cars-btn').prop('disabled', true);

        $('#n-repaired-cars').html(this.repairedAssets.length);
    }





    getMotor(id) {
        for (let n = 0; n < motors.length; n++) {
            if (motors[n].id == id) {
                return motors[n];
            }
        }

        return null;

    }

    getTire(id) {
        for (let n = 0; n < tires.length; n++) {
            if (tires[n].id == id) {
                return tires[n];
            }
        }

        return null;
    }


    nextPage() {
        const type = $('#item-list').attr('asset-type');
        $('#item-list').html('');
        if (type == 'tires') {

            if ((this.curTire + this.nTiresPages) < this.assetLists[type].length) {
                this.curTire += this.nTiresPages;
            }

            this.nTires = this.curTire + this.nTiresPages < this.assetLists[type].length ? this.nTiresPages : this.assetLists[type].length - this.curTire;

            if ((this.curTire + this.nTiresPages) >= this.assetLists[type].length)
                $('#item-list-next').prop('disabled', true);
            else
                $('#item-list-next').prop('disabled', false);


            for (let n = 0; n < this.nTires; n++) {
                $('#item-list').append(this.getTireItem(this.assetLists[type][n + this.curTire]));
            }

            $('#item-pages').html(parseInt(Math.floor(this.curTire / this.nTiresPages) + 1) + " / " + parseInt(Math.ceil(this.assetLists[type].length / this.nTiresPages)));

        }
        else if (type == 'motors') {

            if ((this.curMotor + this.nMotorsPages) < this.assetLists[type].length) {
                this.curMotor += this.nMotorsPages;
            }

            this.nMotors = this.curMotor + this.nMotorsPages < this.assetLists[type].length ? this.nMotorsPages : this.assetLists[type].length - this.curMotor;

            if ((this.curMotor + this.nMotorsPages) >= this.assetLists[type].length)
                $('#item-list-next').prop('disabled', true);
            else
                $('#item-list-next').prop('disabled', false);

            for (let n = 0; n < this.nMotors; n++) {
                $('#item-list').append(this.getMotorItem(this.assetLists[type][n + this.curMotor]));
            }

            $('#item-pages').html(parseInt(Math.ceil((this.curMotor + this.nMotorsPages) / this.nMotorsPages)) + " / " + parseInt(Math.ceil(this.assetLists[type].length / this.nMotorsPages)));
        }
    }


    prevPage() {
        const type = $('#item-list').attr('asset-type');
        let first = 0;
        let cnt = 5;

        $('#item-list').html('');


        if (type == 'tires') {

            if (this.curTire >= this.nTiresPages) {
                this.curTire -= this.nTiresPages;
            }

            if (this.curTire <= this.nTiresPages)
                $('#item-list-prev').prop('disabled', true);
            else
                $('#item-list-prev').prop('disabled', false);

            $('#item-pages').html(parseInt(Math.floor(this.curTire / this.nTiresPages) + 1) + " / " + parseInt(Math.ceil(this.assetLists[type].length / this.nTiresPages)));

            this.nTires = this.curTire + this.nTiresPages < this.assetLists[type].length ? this.nTiresPages : this.assetLists[type].length - this.curTire;
            for (let n = 0; n < this.nTires; n++) {
                $('#item-list').append(this.getTireItem(this.assetLists[type][n + this.curTire]));
            }

        } else if (type == 'motors') {

            if (this.curMotor >= this.nMotorsPages) {
                this.curMotor -= this.nMotorsPages;
            }

            if (this.curMotor <= this.nMotorsPages)
                $('#item-list-next').prop('disabled', true);
            else
                $('#item-list-next').prop('disabled', false);

            $('#item-pages').html(parseInt(Math.floor(this.curMotor / this.nMotorsPages) + 1) + " / " + parseInt(Math.ceil(this.assetLists[type].length / this.nMotorsPages)));

            this.nMotors = this.curMotor + this.nMotorsPages < this.assetLists[type].length ? this.nMotorsPages : this.assetLists[type].length - this.curMotor;
            for (let n = 0; n < this.nMotors; n++) {
                $('#item-list').append(this.getMotorItem(this.assetLists[type][n + this.curMotor]));
            }
        }
    }


    selectTab(id) {
        $('.tab-lnk').each(function () { $(this).removeClass('tab-selected'); });
        $('#' + id).addClass('tab-selected');

    }

    async getMotors(type) {

        this.selectTab('motor-tab');

        $('#motor-tab').prop('disabled', true);


        $('#nft-panel').css('display', 'block');
        $('#shop-list').css('display', 'none');
        $('#item-list').html('<img src="/assets/img/loading2.gif"/>');

        let assets = null;

        try {
            assets = await this.getAssets(['motors'], type);
        }
        catch (e) {
            this.newAlert('getMotors error ' + e.message);
            $('#item-list').html('getMotors error ' + e.message);
            return;
        }

        $('#item-list').html('');
        $('#motor-tab').prop('disabled', false);

        if (!this.assetLists.hasOwnProperty('motors')) {
            $('#item-list').html('no motors');
            return;
        }

        if (this.assetLists['motors'].length === 0) {
            $('#item-list').html('no motors');
            return;
        }

        $('#item-pages').html(parseInt(Math.floor(this.curMotor / this.nMotorsPages + 1)) + " / " + parseInt(Math.ceil(this.assetLists['motors'].length / this.nMotorsPages)));
        $('#item-list').attr('asset-type', "motors");

        this.nMotors = this.curMotor + this.nMotorsPages < this.assetLists['motors'].length ? this.nMotorsPages : this.assetLists['motors'].length - this.curMotor;

        for (let n = 0; n < this.nMotors; n++) {
            $('#item-list').append(this.getMotorItem(this.assetLists['motors'][n + this.curMotor]));
        }
    }



    async getTires(type) {

        this.selectTab('tire-tab');

        $('#tire-tab').prop('disabled', true);

        $('#nft-panel').css('display', 'block');
        $('#shop-list').css('display', 'none');
        $('#item-list').html('<img src="/assets/img/loading2.gif"/>');

        let assets = null;

        try {
            assets = await this.getAssets(['tires'], type);
        }
        catch (e) {
            this.newAlert('getTires error ' + e.message);
            $('#item-list').html('getTires : error ' + e.message);
            return;
        }

        if (assets === null) {
            $('#item-list').html('cannot load assets');
            return;
        }

        if (!this.assetLists.hasOwnProperty('tires')) {
            $('#item-list').html('no tires');
            return;
        }

        if (this.assetLists['tires'].length === 0) {
            $('#item-list').html('no tires');
            return;
        }

        $('#item-list').html('');

        $('#item-pages').html(parseInt(Math.floor(this.curTire / this.nTiresPages) + 1) + " / " + parseInt(Math.ceil(this.assetLists['tires'].length / this.nTiresPages)));
        $('#item-list').attr('asset-type', "tires");

        this.nTires = this.curTire + this.nTiresPages < this.assetLists['tires'].length ? this.nTiresPages : this.assetLists['tires'].length - this.curTire;

        for (let n = 0; n < this.nTires; n++) {
            $('#item-list').append(this.getTireItem(this.assetLists['tires'][n + this.curTire]));
        }

    }


    async getCarSA(id, account = null) {
        let result;

        var req = {
            json: true,                             // Get the response as json
            code: this.appInfos.SA.contract,       // Contract that we target
            scope: account ? account : this.myAccount,                  // Account that owns the data
            table: 'sassets',                        // Table name
            limit: 1,                              // Maximum number of rows that we want to get
            reverse: false,                         // Optional: Get reversed data
            show_payer: false,                       // Optional: Show ram payer
            lower_bound: id
        };

        try {
            result = await this.wax.rpc.get_table_rows(req);
        }
        catch (e) {
            this.newAlert('error getCarSA ' + e.message);
            console.log('error getCarSA ' + e.message);
            return null;
        }

        if (result.rows.length <= 0) {
            this.newAlert('getCarSA not found ' + id);
            console.log(result);
            return null;
        }

        const iid = parseInt(result.rows[0].id);
        if (iid !== id) {
            this.newAlert('getCarSA wrong id ' + id);
            console.log(result);
            return null;
        }

        if ((result.rows[0].author !== this.appInfos.SA.collectionName) || (result.rows[0].category !== 'cars')) {
            this.newAlert('getCarSA wrong category ');
            console.log(result);
            return null;
        }

        const idata = JSON.parse(result.rows[0].idata);
        const mdata = result.rows[0].mdata;
        const asset = { id: iid, type: 0, maxdmg: parseInt(idata.maxdmg), name: idata.name, chassis: idata.chassis, massVehicle: parseFloat(idata.massVehicle), steeringClamp: parseFloat(idata.steeringClamp), steeringIncrement: parseFloat(idata.steeringIncrement), mdata: mdata, DMG: null };
        var jmdata;
        var sus = null;
        var motor = null;

        try {
            jmdata = JSON.parse(mdata);

            if (jmdata.suspension)
                sus = { name: jmdata.suspension.name, tire: jmdata.suspension.tire, force: parseFloat(jmdata.suspension.force), compression: parseFloat(jmdata.suspension.compression), stiffness: parseFloat(jmdata.suspension.stiffness), damping: parseFloat(jmdata.suspension.damping), friction: parseFloat(jmdata.suspension.friction) };

            if (jmdata.motor)
                motor = { name: jmdata.motor.name, motor: jmdata.motor.motor, maxEngineForce: parseFloat(jmdata.motor.maxEngineForce), maxBreakingForce: parseFloat(jmdata.motor.maxBreakingForce) };
        }
        catch (e) {
            console.log('error parsing mdata');
        }


        asset.suspension = sus;
        asset.motor = motor;

        return asset;

    }

    async getCarAA(id, account=null) {

        let result;

        var req = {
            json: true,                             // Get the response as json
            code: this.appInfos.AA.contract,       // Contract that we target
            scope: account ? account : this.myAccount,                  // Account that owns the data
            table: 'assets',                        // Table name
            limit: 1,                              // Maximum number of rows that we want to get
            reverse: false,                         // Optional: Get reversed data
            show_payer: false,                       // Optional: Show ram payer
            lower_bound: id
        };

        try {
            result = await this.wax.rpc.get_table_rows(req);
        }
        catch (e) {
            this.newAlert('error getCarAA ' + e.message);
            return null;
        }

        if (result.rows.length <= 0) {
            this.newAlert('getCarAA not found ' + id);
            console.log(result);
            return null;
        }

        const iid = parseInt(result.rows[0].asset_id);
        if (iid !== id) {
            this.newAlert('getCarAA wrong id ' + id);
            console.log(result);
            return null;
        }

        if ((result.rows[0].collection_name !== this.appInfos.AA.collectionName) || (result.rows[0].schema_name !== 'cars')) {
            this.newAlert('getCarAA wrong asset type ');
            console.log(result);
            return null;
        }

        const idata = await this.getSchema(result.rows[0]);

        const asset = { id: iid, type: 1, maxdmg: idata.maxdmg, name: idata.name, chassis: idata.chassis, massVehicle: idata.massVehicle, steeringClamp: idata.steeringClamp, steeringIncrement: idata.steeringIncrement, DMG: null };

        var jmdata;

        try {
            jmdata = await this.getMSchema(result.rows[0]);
        }
        catch (e) {
            jmdata = { suspension: null, motor: null };
            console.log("getCarAA jmdata error " + e.message)
        }


        if (jmdata.suspension)
            asset.suspension = jmdata.suspension;
        else
            asset.suspension = null;

        if (jmdata.motor)
            asset.motor = jmdata.motor;
        else
            asset.motor = null;


        return asset;

    }

    async getCar(id, type, account = null) {
        var asset;
        for (let n = 0; n < cars.length; n++) {
            if (cars[n].id == id) {
                var ret = cars[n];
                ret.motor = this.getMotor(ret.motorid);
                ret.suspension = this.getTire(ret.tireid);
                return ret;
            }
        }

        switch (type) {
            case 0:
                asset = await this.getCarSA(id, account);
                break;
            case 1:
                asset = await this.getCarAA(id, account);
                break;

        }
        return asset;
    }


    async changeCar(carid, type) {

        if(this.world.myCar != null)
            this.engine.removeCar(this.world.myCar);


        const carDef = await this.getCar(carid, type);
        if (carDef !== null) {
            this.world.myCar = await this.world.createCar(carDef);
            this.engine.setCar(this.world.myCar);
        }

    }


}

async function initWallet(site = '') {
    let appInfos = null;
    const ac=document.getElementById('navbar-account');

    /* jquery */
    if(ac)ac.innerHTML='connecting';
    

    try {
        const res = await fetch(site+'/config', { method: 'GET', credentials: 'include' });
        const d = await res.json();
        appInfos = d.result;
    }
    catch (e) {
        alert('initWallet : unable to fetch server config ' + e.message);
        return false;
    }
    if(ac)ac.innerHTML='init wallet';
    
    const wallet = new Wallet(appInfos);
    wallet.site = site;
    await wallet.getSession();

    if(ac)ac.innerHTML='app config';

    await wallet.get_config();

    wallet.updatePage();

    return wallet;
}

async function getChassisExtents() {

    const carLoader = new OBJLoader(this.engine.manager);

    let extents = {};

    for (let chassisName in meshsInfos) {

        const object = await carLoader.loadAsync("/assets/mesh/" + chassisName + ".obj");
        object.traverse((child) => {

            if (child.type == 'Mesh') {

                child.geometry.computeBoundingBox();

                meshsInfos[chassisName].size = new THREE.Vector3();
                meshsInfos[chassisName].center = new THREE.Vector3();

                child.geometry.boundingBox.getSize(meshsInfos[chassisName].size);
                child.geometry.boundingBox.getCenter(meshsInfos[chassisName].center);

                extents[chassisName] = { extents: { size: meshsInfos[chassisName].size, center: meshsInfos[chassisName].center } };
            }
        });
    }

    console.log(JSON.stringify(extents));

}


export { EngineMain, CircuitRace, Track, Car, Wallet, initWallet, getChassisExtents, cars };