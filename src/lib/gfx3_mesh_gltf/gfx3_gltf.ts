import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { Gfx3GLTFPrimitive } from './gfx3_gltf_prim';
import { Utils } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Material, createMaterial } from '../gfx3/gfx3_material';

import { Gfx3Node } from './gfx3_node';
import { Gfx3DrawableNode } from './gfx3_drawable_node';



class GLTFBuffer {
    uri: String;
    farray: Float32Array;
    constructor()
    {
        this.uri = "";
        this.farray = new Float32Array();
    }

}
class GLTFBufferView {
    buffer : number;
    byteOffset : number;
    byteStride : number | undefined; 
    constructor()
    {
        this.buffer = 0;
        this.byteOffset = 0;
    }

}
class GLTFAccessor {
    bufferView : number;
    byteOffset : number;
    count : number;
    componentType : number;
    constructor()
    {
        this.bufferView = 0;
        this.byteOffset = 0;
        this.count = 0;
        this.componentType = 0;
        
    }

}

class GLTFImage{
    uri : string;

    constructor()
    {
        this.uri = "";
    }

}

class GLTFTexture{
    index : number;
    source : number;

    constructor()
    {
        this.index = -1;
        this.source = -1;
    }

}

class GLTFpbrMetallicRoughness{
    baseColorFactor : vec4| undefined;
    baseColorTexture : GLTFTexture | undefined;

}



class GLTFMaterial {
    pbrMetallicRoughness:GLTFpbrMetallicRoughness;
    normalTexture:GLTFTexture | undefined;
    material : Gfx3Material | null;
    name: string;

    constructor()
    {
        this.pbrMetallicRoughness = new GLTFpbrMetallicRoughness();
        this.material = null;
        this.name ="default material";
    }

}

class GLTFattributes {
    POSITION : number ;
    NORMAL : number;
    TEXCOORD_0 : number;
    TANGENT : number;
    constructor()
    {
        this.POSITION = -1;
        this.NORMAL = -1;
        this.TEXCOORD_0 = -1;
        this.TANGENT = -1;
    }


}

class GLTFPrimitive {
    material : number;
    drawable: Gfx3Drawable | null;
    attributes : GLTFattributes;
    indices : number | undefined;

    constructor()
    {
        this.material = -1;
        this.drawable = null;
        this.attributes = new GLTFattributes();
    }

}

class GLTFMesh {
    primitives : Array<GLTFPrimitive>;
    name : string;

    constructor()
    {
        this.primitives = [];
        this.name = "default";
    }
}

class GLFTNode{
    mesh : number;
    name : String;
    position : vec3;
    scale : vec3;
    rotation : vec4;
    children : Array<number>;

    constructor()
    {
        this.mesh = -1;
        this.name="";
        this.position = [0,0,0];
        this.scale = [1,1,1];
        this.rotation = [0,0,0, 0];
        this.children = [];
    }
}

class GLTFScene {

    nodes : Array<number>;
   
    constructor()
    {
        this.nodes =[];
    }
}

class GLTFRoot {

    scenes : Array<GLTFScene>;
    meshes : Array<GLTFMesh>;
    buffers : Array<GLTFBuffer>;
    materials : Array<GLTFMaterial>;
    textures : Array<GLTFTexture>;
    images : Array<GLTFImage>;
    accessors : Array<GLTFAccessor>;
    bufferViews : Array<GLTFBufferView>;
    nodes : Array<GLFTNode>;

    constructor()
    {
        this.scenes = [];
        this.meshes = [];
        this.buffers = [];
        this.materials =[];
        this.textures =[];
        this.images = [];
        this.accessors = [];
        this.bufferViews = [];
        this.nodes = [];
    }

}
function dirname(path:string):string
{
    let arr= path.split('/');
    arr.pop();

    return arr.join('/');

}
class Gfx3GLTF {

    nodesCounter: number;
    rootNode : Gfx3Node;
    scene : GLTFRoot;
    globalURL : string;

    constructor()
    {
        this.nodesCounter = 1;
        this.rootNode = new Gfx3Node(this.nodesCounter++);
        this.scene =  new GLTFRoot();
        this.globalURL = "";
    }

    async loadFromFile(url:string)
    {
        this.globalURL = url;

        console.log("loading GLTF from '"+ this.globalURL.toString()+"'");
        
        let response = await fetch(this.globalURL);
        this.scene = await response.json();

        this.rootNode.name = "GLTF "+this.globalURL.toString();

        var self=this;

        for(let n=0;n<this.scene.meshes.length;n++)
        {
            for(let p=0;p<this.scene.meshes[n].primitives.length;p++)
            {   
                this.scene.meshes[n].primitives[p].drawable = null;
            }
        }
      
        await this.loadBuffer(this.scene.buffers[0]);
        this.buildMeshes(self.scene.scenes[0].nodes, self.rootNode);  
        console.log('GLTF Graph'); 
        console.log(self.rootNode); 

        console.log('GLTF scene');
        console.log(this.scene);
    }

    async loadBuffer(buffer: GLTFBuffer)
    {
        let mypath = dirname(this.globalURL)+'/'+ buffer.uri;

        console.log("loading buffer from '"+mypath+"'");

        let bufferResponse = await fetch(mypath);

        let resp= await bufferResponse.arrayBuffer();


        buffer.farray = new Float32Array(resp);

    }
    
    async buildObjMaterial(node : GLFTNode){

        if(node.mesh == undefined)
            return true;

        let obj = this.scene.meshes[node.mesh];
        for (let n = 0; n < obj.primitives.length; n++) {

            let myDrawable =obj.primitives[n].drawable;
            if( myDrawable === null)
                continue;

            let gltfMaterial = this.scene.materials[obj.primitives[n].material];

            if(gltfMaterial.material == null)
            {
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
        
                    ntex = await gfx3TextureManager.loadTexture(mypath + '/' +image.uri, 2);
                }
    
                let matColor : vec4;
    
                if(gltfMaterial.pbrMetallicRoughness.baseColorFactor)
                    matColor = gltfMaterial.pbrMetallicRoughness.baseColorFactor;
                else
                    matColor = [1.0, 1.0, 1.0, 1.0];
    
                gltfMaterial.material = createMaterial({color : matColor, texture : tex, normalMap: ntex });
            }

            myDrawable.material = gltfMaterial.material;
            
            if(typeof obj.primitives[n].attributes.NORMAL !== 'undefined')
                myDrawable.material.lightning =  true;
            else
                myDrawable.material.lightning =  false;
        }

        return true;
    }

    getVertex(primitive: GLTFPrimitive, i: number)
    {
        let vx,vy,vz,tx,ty,nx,ny,nz, vtx, vty, vtz, vtw, binorm;

        var accessor = this.scene.accessors[primitive.attributes.POSITION];
        var bufferView = this.scene.bufferViews[accessor.bufferView];
        var bufferidx = bufferView.buffer;
        
        let startOffset = this.getBufferOffset( accessor, bufferView) / 4;
        let floatStride;
                            
        if(bufferView.byteStride)
            floatStride = bufferView.byteStride / 4;
        else
            floatStride = 3;
                          
        vx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
        vy = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];
        vz = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 2];

        
        if(primitive.attributes.TEXCOORD_0 !== undefined)
        {
            var accessor = this.scene.accessors[primitive.attributes.TEXCOORD_0];
            var bufferView = this.scene.bufferViews[accessor.bufferView];
            var bufferidx = bufferView.buffer;

            let startOffset = this.getBufferOffset( accessor, bufferView) / 4;
        
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
        
        if(primitive.attributes.NORMAL !== undefined)
        {
            var accessor = this.scene.accessors[primitive.attributes.NORMAL];
            var bufferView = this.scene.bufferViews[accessor.bufferView];
            var bufferidx = bufferView.buffer;
        
            let startOffset = this.getBufferOffset( accessor, bufferView) / 4;

            

            let floatStride;
                           
            if(bufferView.byteStride)
                floatStride = bufferView.byteStride / 4;
            else
                floatStride = 3;
                            
            nx = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 0];
            ny = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 1];
            nz = this.scene.buffers[bufferidx].farray[startOffset + i * floatStride + 2];
        }else{
            nx = 0.0;
            ny = 0.0;
            nz = 0.0;
        }
        
        if(primitive.attributes.TANGENT !== undefined)
        {
            var accessor = this.scene.accessors[primitive.attributes.TANGENT];
            var bufferView = this.scene.bufferViews[accessor.bufferView];
            var bufferidx = bufferView.buffer;
        
            let startOffset = this.getBufferOffset( accessor, bufferView) / 4;

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

        primitive.drawable!.defineVertexTangeant(vx, vy, vz, tx, ty, nx, ny, nz, vtx, vty, vtz, binorm[0], binorm[1], binorm[2]);
    }

    getBufferOffset(accessor: GLTFAccessor, bufferView : GLTFBufferView)
    {
        let offset = bufferView.byteOffset ?? 0;
        offset += accessor.byteOffset ?? 0;
        return offset;
    }
    
    buildobjarray(node: GLFTNode) {

        let newObj = new Gfx3Node(this.nodesCounter++);

        if(node.mesh !== undefined)
            newObj.name = "mesh "+this.scene.meshes[node.mesh].name;
        else
            newObj.name = node.name;

        if(node.rotation)
        {
            let Angles = Utils.QUAT_TO_EULER([node.rotation[0],node.rotation[1],node.rotation[2],node.rotation[3]], "YXZ");
            newObj.setRotation(Angles[0], Angles[1], Angles[2]);    
        }
        else
            newObj.setRotation(0, 0, 0);

        if(node.position)
            newObj.setPosition(node.position[0],node.position[1],node.position[2]);
        else
            newObj.setPosition(0.0, 0.0, 0.0);

        if(node.scale)
            newObj.setScale(node.scale[0], node.scale[0], node.scale[0]);
        else
            newObj.setScale(1.0, 1.0, 1.0);


        if(node.mesh == undefined)
            return newObj;

        let obj = this.scene.meshes[node.mesh];
        for (let n = 0; n < obj.primitives.length; n++) {

            if(obj.primitives[n].drawable == null)
            {
                let myDrawable = new Gfx3GLTFPrimitive();

                obj.primitives[n].drawable = myDrawable;

                myDrawable.clearVertices();

                if(obj.primitives[n].indices !== undefined){

                    var accessor = this.scene.accessors[obj.primitives[n].indices!];
                    var bufferView = this.scene.bufferViews[accessor.bufferView];
                    var bufferidx = bufferView.buffer;
                    var IncidesBuffer;

                    let startOffset;
                    let IndicesStride;

                    if(accessor.componentType === 5123)
                    {
                        IncidesBuffer = new Uint16Array(this.scene.buffers[bufferidx].farray.buffer);
                        startOffset = this.getBufferOffset( accessor, bufferView) / 2;


                        if(bufferView.byteStride)
                            IndicesStride = bufferView.byteStride / 2;
                        else
                            IndicesStride = 1;
                    }else{
                        console.log("unknown indice component type");
                        continue;
                    }
                    for(let i=0;i<accessor.count;i++)
                    {
                        let indice = IncidesBuffer[startOffset + i * IndicesStride];
                        this.getVertex(obj.primitives[n], indice);
                    }

                }else{
                    for(let i=0;i<this.scene.accessors[obj.primitives[n].attributes.POSITION].count;i++)
                    {
                        this.getVertex(obj.primitives[n], i);
                    }
    
                }
                myDrawable.commitVertices();   
            }

            let newNode = new Gfx3DrawableNode(obj.primitives[n].drawable! , this.nodesCounter++);
            newNode.name ="material "+ this.scene.materials[obj.primitives[n].material].name;
            newObj.addChild(newNode);

        }
        return newObj;
    }

    async buildMeshes(nodeIds: Array<number>, parent: Gfx3Node)
    {

        for(let nodeId of nodeIds)
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
            }
         
            if(this.scene.nodes[nodeId].children != undefined)
                await this.buildMeshes(this.scene.nodes[nodeId].children, newNode);
        }
        return true;
    }

    update(_ts : number){
    }

    getBoundingBox(){
        return this.rootNode.getTotalBoundingBox(null);
    }

    draw() {
        this.rootNode.draw(null);
    }

    delete()
    {
        let mypath = dirname(this.globalURL);

        this.rootNode.delete();

        for (let texture of this.scene.textures) {

            if(gfx3TextureManager.hasTexture(mypath + '/'+ this.scene.images[texture.source].uri))
                gfx3TextureManager.deleteTexture(mypath + '/'+ this.scene.images[texture.source].uri);
        }
    }

 }

export {Gfx3GLTF};