<p align="center">
    <img src="https://raw.githubusercontent.com/jay19240/WebStationX/main/public/textures/banner.png" alt="logo" width="100%"/>
</p>

![Drag Racing](https://img.shields.io/badge/lang-typescript-f39f37) ![Drag Racing](https://img.shields.io/badge/version-1.0.0-blue)

**Haiku** is video game engine based on WebGPU written in Typescript.   
We provide a simple, pragmatic and lightweight development kit to build web games with high performance.  
Our priority is to eliminate black boxes and giving a maximum control to the user.  
Important note: This engine comes with a dozen of diverse and varied examples.

## General features
- 👾 2D - Sprite, tilemap with animations
- 🧊 3D - Debug shapes, mesh, sprite, billboard, skybox, walkmesh, multiple-camera, ray, nav-mesh, mover, particules
- 💥 VFX - Phong, displacement-map, normal-map, env-map, specularity-map, texture scrolling
- 🌞 Light - Directional light, multiple point lights, vertex lighting
- 🎮 Input - Action mapper for keyboard and gamepad
- 🚔 Pathfinder - A* for 2D & 3D
- 📺 Screen - Handle different screens of your game
- 📜 Scripts - Write game behaviors
- 🔊 Sound - Sound manager built on the Web Audio API
- 🌳 Tree - Binary Space Partition for 2D & 3D
- 🎨 UI - Component architecture to keep project clean and scalable
- 🌆 DNA - Development normalized architecture

## Getting started
You need to install [nodejs](https://nodejs.org/en/download/). 
Once installation is done, let's build our first project.     

```
// create your haiku project
# npx create-haiku your_project_name

// now, you can start with
# npm run dev
```

## How to integrate your 3D models ?
The [Haiku Blender Exporter](https://github.com/jay19240/Haiku-Blender-Exporter) allows you to export your models in compatible formats!
Important note: The Blender coordinate system and the engine don't match, this is the rule to translate:  
```
blender = engine
----------------
x = -x
y = +z
z = +y
```

## Contributions
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!    

1. Fork the Project
2. Create your Feature Branch (git checkout -b new_feature)
3. Commit your Changes (git commit -m 'Add new feature')
4. Push to the Branch (git push origin new_feature)
5. Open a Pull Request

## Some parts taken from this work
- Use DOM for UI elements
- Use human readable custom format for all graphics stuff
- No physics engine, we assume if you need one there is many pretty lib for that like ammo.js or canon.js

## Platform
**Chrome Canary: 113+**  
**Edge Canary: 113+**

> *As WebGPU is not released, please enable `chrome://flags/#enable-unsafe-webgpu` or `edge://flags/#enable-unsafe-webgpu`*

## First todo-list
- Vertex Light (Owner: me, Delay: N/A)
- Add converter bsp -> grid for pathfinding (Owner: thetinyspark, Delay: 1 Mounth)
- Add jumps in fps sample

## Second todo-list
- Transform a-star in a generic way (2D & 3D)
- Add triple-triad demo (Work: In Progress, Delay: 1 month)

## License 
Haiku engine is released under the [MIT](https://opensource.org/licenses/MIT) license. 