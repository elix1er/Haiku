<p align="center">
    <img src="https://raw.githubusercontent.com/jay19240/WebStationX/main/public/textures/banner.png" alt="logo" width="100%"/>
</p>

![Drag Racing](https://img.shields.io/badge/lang-typescript-f39f37) ![Drag Racing](https://img.shields.io/badge/version-1.0.0-blue)

**WebStationX** is a typescript 2D/3D video game engine based on WebGPU.   
The idea behind WebStationX is simple: provide a simple and pragmatic development kit from ui to rendering.  
Our priority is to eliminate black boxes and giving a maximum control to the user.  
Important note: This engine comes with a dozen diverse and varied examples.

## General features
- 👾 2D - Sprite, animated tilemap
- 🧊 3D - Debug shapes, light, static mesh, animated mesh, material, sprite, billboard, skybox, walkmesh, multiple-camera, ray, nav-mesh, mover
- 💥 VFX - Phong, normal-map, env-map
- 🎮 Input - Action mapper for keyboard and gamepad
- 🚔 Pathfinder - A* for 2D & 3D
- 📺 Screen - Handle different screens of your game
- 📜 Scripts - Write game behaviors
- 🔊 Sound - Sound manager built on the Web Audio API
- 🌳 Tree - Binary Space Partion for 2D & 3D
- 🎨 UI - Component architecture very efficient to keep project clean and scalable

## Getting started
You need to install [nodejs](https://nodejs.org/en/download/). 
Once installation is done, let's build our first project.     

Clone this repo, go to the root of project and launch the build with the following command:
```
// you need to install dependencies
# npm install

// now, you can start with
# npm run dev
```

## How to integrate your 3D models ?
The [WebStation Blender Exporter](https://github.com/jay19240/WebStationX-Blender-Exporter) allows you to export your models in compatible formats!

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
- Texture Scroll UV (Owner: Me, Delay: 1/2 weeks)
- Texture Frames (JSM/JAM) (Owner: me, Delay: 3 weeks)
- Vertex Light (Owner: me, Delay: N/A)
- Loader OBJ (Owner: Antoine, Delay: 1 month)
- Textures Equirectangulaires (Owner: Antoine, Delay: 1 month)
- Particules system (Owner: Antoine, Delay: 1 month)

## Fun todo-list
- Transform a-star in a generic way (2D & 3D)
- Add triple-triad demo (Work: In Progress, Delay: 1 month)
- Multiplayer game cars with physics server authoritative (Work: In Progress, Delay: 1 month)

## License 
WebStationX engine is released under the [MIT](https://opensource.org/licenses/MIT) license. 