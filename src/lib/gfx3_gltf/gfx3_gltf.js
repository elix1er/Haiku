import { gfx3Manager } from '../gfx3/gfx3_manager.js';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager.js';
import { Gfx3GLTFPrimitive } from './gfx3_gltf_prim.js';
import { Utils } from '../core/utils.js';

import { Gfx3Node } from '../gfx3/gfx3_node.js';
import { BoundingBox } from '../bounding_box/bounding_box.js';

function normalize_vec(v) {
    var mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (mag !== 0.0) {
        v[0] = v[0] / mag;
        v[1] = v[1] / mag;
        v[2] = v[2] / mag;
    }
}

function dirname(path)
{
    let arr= path.split('/');
    arr.pop();

    return arr.join('/');

}
class Gfx3GLTF {

    constructor()
    {
        this.rootNode = new Gfx3Node(gfx3Manager.nodesIds++);
        this.scene = null;
        this.globalURL = null;
    }

    async loadFromFile(url)
    {
        this.globalURL = url;
        
        let response = await fetch(this.globalURL);
        this.scene = await response.json();

        this.rootNode.name = "GLTF "+this.globalURL;

        var self=this;

        for(let n=0;n<this.scene.meshes.length;n++)
        {
            for(let p=0;p<this.scene.meshes[n].primitives.length;p++)
            {   
                this.scene.meshes[n].primitives[p].nodeid = -1;
            }
        }

        this.loadBufferData(this.scene.buffers[0], function(){ self.buildMeshes(self.scene.scenes[0].nodes, self.rootNode);  console.log('GLTF Graph'); console.log(self.rootNode); });

        console.log('GLTF scene');
        console.log(this.scene);
    }

    loadBufferData(buffer, doneFunc) {

        var req = new XMLHttpRequest();

        req.onreadystatechange = function () {
            if (this.readyState == 4) {

                if(this.status == 200){
                    var resp = this.responseText;
                    var floatLength = resp.length & (~0x3);
                    var byteArray = new Uint8Array(floatLength);
    
                    for (var i = 0; i < floatLength; i++) {
                        byteArray[i] = resp.charCodeAt(i) & 0xff;
                    }
                    buffer.farray = new Float32Array(byteArray.buffer);
          
                    if (doneFunc != null)
                        doneFunc();
                }
                else{
                    console.log('error loading buffer');
                }
    
            }
        };

        let mypath = dirname(this.globalURL);

        req.open('GET', mypath +'/'+ buffer.uri, true);
        req.overrideMimeType('text\/plain; charset=x-user-defined');
        req.send(null);
    }
    
    async buildObjMaterial(node){

        let obj = this.scene.meshes[node.mesh];
        for (let n = 0; n < obj.primitives.length; n++) {

            let mynode = this.rootNode.find(obj.primitives[n].nodeid);
            if( mynode === null)
            {
                console.log('cannot find node '+obj.primitives[n].nodeid);
                continue;
            }

            var myDrawable = mynode.getDrawable();
            if( myDrawable === null)
                continue;

            if(myDrawable.materialID > 0)
                continue;
            
            let gltfMaterial = this.scene.materials[obj.primitives[n].material];
            let tex = null;
            let ntex = null;

            let mypath = dirname(this.globalURL);
    
            if ((gltfMaterial.pbrMetallicRoughness.baseColorTexture)&&(gltfMaterial.pbrMetallicRoughness.baseColorTexture.index < this.scene.textures.length))
            {
                let imageID = this.scene.textures[gltfMaterial.pbrMetallicRoughness.baseColorTexture.index].source;
                let image = this.scene.images[imageID];
    
                tex = await gfx3TextureManager.loadTexture(mypath + '/' +image.uri);
            }
    
            if ((gltfMaterial.normalTexture)&&(gltfMaterial.normalTexture.index < this.scene.textures.length))
            {
                let imageID = this.scene.textures[gltfMaterial.normalTexture.index].source;
                let image = this.scene.images[imageID];
    
                ntex = await gfx3TextureManager.loadNormalMap(mypath + '/' +image.uri);
            }

            let matColor;

            if(gltfMaterial.pbrMetallicRoughness.baseColor)
                matColor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
            else
                matColor = [1.0, 1.0, 1.0, 1.0];

            myDrawable.materialID = gfx3Manager.newMaterial(matColor, tex , ntex);
            mynode.name ="material "+gltfMaterial.name+" mesh "+this.scene.meshes[node.mesh].name;

            if(typeof this.scene.accessors[obj.primitives[n].attributes.NORMAL] !== 'undefined')
                gfx3Manager.enableLightning(myDrawable.materialID, true);
            else
                gfx3Manager.enableLightning(myDrawable.materialID, false);
        }

        return true;
    }
    
    buildobjarray(node) {

        let newObj = new Gfx3Node(gfx3Manager.nodesIds++);
        newObj.name = "mesh "+node.mesh;

        if(node.rotation)
        {
            let Angles = Utils.QUAT_TO_EULER([node.rotation.x,node.rotation.y,node.rotation.z,node.rotation.w], "YXZ");
            newObj.setRotation(Angles[0], Angles[1], Angles[2]);    
        }
        else
            newObj.setRotation(0, 0, 0);

        if(node.newNode)
            newObj.setPosition(node.position[0],node.position[1],node.position[2]);
        else
            newObj.setPosition(0.0, 0.0, 0.0);

        if(node.scale)
            newObj.setScale(node.scale.x, node.scale.y, node.scale.z);
        else
            newObj.setScale(1.0, 1.0, 1.0);

        let obj = this.scene.meshes[node.mesh];
        for (let n = 0; n < obj.primitives.length; n++) {

            if(obj.primitives[n].nodeid < 0)
            {
                let myDrawable = new Gfx3GLTFPrimitive();

                myDrawable.clearVertices();

                for(let i=0;i<this.scene.accessors[obj.primitives[n].attributes.POSITION].count;i++)
                {
                    let vx,vy,vz,tx,ty,nx,ny,nz, vtx, vty, vtz, vtw, binorm;

                    if(typeof this.scene.accessors[obj.primitives[n].attributes.POSITION] !== 'undefined')
                    {
                        var accessor = this.scene.accessors[obj.primitives[n].attributes.POSITION];
                        var bufferView = this.scene.bufferViews[accessor.bufferView];
                        var bufferidx = bufferView.buffer;
    
                        let startOffset = (bufferView.byteOffset + accessor.byteOffset) / 4;
                        let floatStride;
                        
                        if(bufferView.byteStride)
                            floatStride = bufferView.byteStride / 4;
                        else
                            floatStride = 3;
                        
                        
                        vx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
                        vy = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];
                        vz = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 2];
                    }
    
                    if(typeof this.scene.accessors[obj.primitives[n].attributes.TEXCOORD_0] !== 'undefined')
                    {
                        var accessor = this.scene.accessors[obj.primitives[n].attributes.TEXCOORD_0];
                        var bufferView = this.scene.bufferViews[accessor.bufferView];
                        var bufferidx = bufferView.buffer;
    
                        let startOffset = (bufferView.byteOffset + accessor.byteOffset) / 4;
                        let floatStride;
                        
                        if(bufferView.byteStride)
                            floatStride = bufferView.byteStride / 4;
                        else
                            floatStride = 2;
                        
                        tx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
                        ty = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];

                    }
                    else{
                        tx = 0.0;
                        ty = 0.0;
                    }
    
                    if(typeof this.scene.accessors[obj.primitives[n].attributes.NORMAL] !== 'undefined')
                    {
                        var accessor = this.scene.accessors[obj.primitives[n].attributes.NORMAL];
                        var bufferView = this.scene.bufferViews[accessor.bufferView];
                        var bufferidx = bufferView.buffer;
    
                        let startOffset = (bufferView.byteOffset + accessor.byteOffset) / 4;

                        let floatStride;
                        
                        if(bufferView.byteStride)
                            floatStride = bufferView.byteStride / 4;
                        else
                            floatStride = 3;
                        
                        nx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
                        ny = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];
                        nz = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 2];
                    }
                    else{
                        nx = 0.0;
                        ny = 0.0;
                        nz = 0.0;
                    }
                    if(typeof this.scene.accessors[obj.primitives[n].attributes.TANGENT] !== 'undefined')
                    {
                        var accessor = this.scene.accessors[obj.primitives[n].attributes.TANGENT];
                        var bufferView = this.scene.bufferViews[accessor.bufferView];
                        var bufferidx = bufferView.buffer;
    
                        let startOffset = (bufferView.byteOffset + accessor.byteOffset) / 4;

                        let floatStride;
                        
                        if(bufferView.byteStride)
                            floatStride = bufferView.byteStride / 4;
                        else
                            floatStride = 4;
                        
                        vtx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
                        vty = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];
                        vtz = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 2];
                        vtw = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 3];

                        binorm = Utils.VEC3_SCALE(Utils.VEC3_CROSS( [nx,ny,nz], [vtx,vty,vtz]), vtw);

                        //console.log('vt '+ vtx+' '+ vty+ ' '+vtz+ ' '+vtw);
                        
                        

                    }else{
                        vtx = 0.0;
                        vty = 0.0;
                        vtz = 0.0;
                        binorm = [0.0,0.0,0.0];
                    }
     
                    /*
                    if (keys[a] === "JOINTS_0") {
                      
                        gl.enableVertexAttribArray(4);
                        gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, false, bufferView.byteStride, bufferView.byteOffset + accessor.byteOffset);
                    }
    
                    if (keys[a] === "WEIGHTS_0") {
                        gl.enableVertexAttribArray(5);
                        gl.vertexAttribPointer(5, 4, gl.UNSIGNED_BYTE, false, bufferView.byteStride, bufferView.byteOffset + accessor.byteOffset);
                    }
                    */
                    myDrawable.defineVertexTangeant(vx, vy, vz, tx, ty, nx, ny, nz, vtx, vty, vtz, binorm[0], binorm[1], binorm[2]);
                }

                myDrawable.commitVertices();   

                let newNode = gfx3Manager.newDrawable(myDrawable);
                newNode.bufferOffsetId = gfx3Manager.getBufferRangeId( myDrawable.vertexCount * myDrawable.vertSize);
                gfx3Manager.commitBuffer(newNode.bufferOffsetId, myDrawable.vertices);
                newObj.addChild(newNode);

                obj.primitives[n].nodeid = newNode.id;
            }else{

                let drawable = this.rootNode.find(obj.primitives[n].nodeid).getDrawable();
                let newNode = gfx3Manager.newDrawable(drawable);
                newObj.addChild(newNode);
            }
        }
        return newObj;
    }

    async buildMeshes(nodeIds, parent)
    {
        for(let nodeId in nodeIds)
        {
            let newNode = this.buildobjarray(this.scene.nodes[nodeId]);
            if (newNode !== null)
            {
                parent.addChild(newNode);
                if (!await this.buildObjMaterial(this.scene.nodes[nodeId]))
                {
                    console.log('cannot load obj material for node '+nodeId);
                    return false;
                }

            } else {
                console.log('cannot build obj array for node '+nodeId);
                return false;
            }
         
            await this.buildMeshes(this.scene.nodes[nodeId].children, newNode);
        }
        return true;
    }

    update(ts){
    }

    getBoundingBox(){

        var bounds={min : null, max: null};
        this.rootNode.getTotalBoundingBox(bounds, null);
        return new BoundingBox(bounds.min, bounds.max);
    }

    draw() {
        gfx3Manager.drawNode(this.rootNode);
    }
 }

export {Gfx3GLTF};