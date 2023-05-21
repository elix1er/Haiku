import { Gfx3Material } from '../../lib/gfx3_mesh/gfx3_mesh_material';
import { Gfx3Mesh } from '../../lib/gfx3_mesh/gfx3_mesh';
import { UT } from '../../lib/core/utils';

interface meshInstance{
    id:number;
    mesh : Gfx3Mesh;
    used:boolean;
    
}

class Gfx3MeshPool{

    meshes:Array<meshInstance>;
    constructor(obj:Gfx3Mesh, num:number)
    {
      this.meshes = [];
      const m = UT.MAT4_IDENTITY();
      for(let n=0;n<num;n++)
      {
        const mesh = obj.clone(m);
        mesh.setMaterial(new Gfx3Material({}));
        mesh.material.texture = obj.material.texture;
        mesh.material.lightning = obj.material.lightning;
        this.meshes.push({ mesh: mesh, used : false, id : n + 1});
      }
    }
  
    delete()
    {
      let m;
      while(m = this.meshes.pop())
      {
          m.mesh.delete();
      }
    }
  
    newObject(size:number, color:vec3, opacity:number)
    {
      for(let m of this.meshes)
      {
        if(!m.used)
        {
          m.mesh.scale[0] = size;
          m.mesh.scale[1] = size;
          m.mesh.scale[2] = size;
  
          m.mesh.material.diffuse[0] = color[0];
          m.mesh.material.diffuse[1] = color[1];
          m.mesh.material.diffuse[2] = color[2];
          m.mesh.material.opacity = opacity;
  
          UT.VEC3_SET(m.mesh.position, 0, 0, 0);
  
          m.mesh.material.changed = true;
  
          m.used = true; 
          return m;
        }
      }
  
      return null;
    }
  
    disposeObject(obj:meshInstance)
    {
      for(let m of this.meshes)
      {
        if(m.id == obj.id)
        {
          m.used = false;
          return;
        }
      }
    }
    
  }

  export { Gfx3MeshPool };