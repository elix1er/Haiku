<p align="center">
    <img src="https://raw.githubusercontent.com/jay19240/WebStationX/main/public/textures/banner.png" alt="logo" width="300"/>
</p>

![Drag Racing](https://img.shields.io/badge/lang-typescript-f39f37) ![Drag Racing](https://img.shields.io/badge/version-2.0.0-blue)

**WebStationX** is 2D/3D game engine think to be easy and fast.
Allow build for pragmatics web-developper to build games easyly !

## General features
- 🧊 2D - Sprites, tilemaps
- 🧊 3D - Debug shapes, point lights, directional light, meshes, materials, sprites, billboard, skybox, walkmeshs, multiple-camera, ray, nav-mesh, bsp
- 💥 VFX - Phong, normal-map, env-map
- 🎮 Input - Action mapper for keyboard and gamepad
- 📺 Screen - Handle different screens of your game
- 📜 Scripts - Write game behaviors
- 🔊 Sound - Sound manager built on the Web Audio API
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

## First todo-list
- Texture Scroll UV (for me)
- Texture Frames (JSM/JAM) (for me)
- Vertex Light (for me)
- Loader OBJ (for antoine)
- Textures Equirectangulaires (for antoine)
- Particules system (for antoine)

## Fun todo-list
- Transform a-star in a generic way (2D & 3D)
- Translate triple-triad demo (Work In Progress)
- Translate new demo from nft game (Work In Progress)