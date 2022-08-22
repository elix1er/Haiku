<img src="https://sprightly-beijinho.netlify.app/assets/images/logo-9849da864a27064e12d65e3ceffb5488.jpg" alt="logo" width="300"/>

![Drag Racing](https://img.shields.io/badge/lang-javascript-f39f37) ![Drag Racing](https://img.shields.io/badge/release-v1.0.0-blue)

Copyright © 2020-2022 [Raijin].

**Aliyah** is a bunch of light and simple packages to build web videogames.    
**Aliyah** support both **2D** (canvas) and **3D** (webgpu).    
No need to learn a new language, if you master **HTML/JS/CSS** then you can already create a professional and very optimized videogames.

## General features
- Screen manager
- Sound manager
- Event Manager
- Real-time keyboard input manager
- UI Manager
    - Description list (ui_description_list)
    - Dialog author + text (ui_dialog)
    - Dialog author + text + avatar (ui_message)
    - Dialog author + text + avatar + menu choices (ui_bubble)
    - Dialog narrative (ui_print)
    - Virtual keyboard (ui_keyboard)
    - Menu basic with keyboard/mouse navigation and X, Y and XY layouts (ui_menu)
    - Menu text (ui_menu_text)
    - Menu list-view (ui_menu_list_view)
    - Prompt window (ui_prompt)
    - Sprite (ui_sprite)
    - Support focus/unfocus
    - Support fadeIn/fadeOut
    - And as well you can add our own !
- Script manager
- 3D graphics manager
    - Batching
    - Texture manager
    - Multiple viewports
    - Orthographic and projection views
    - Walkmesh (gfx3_jwm)
    - Static sprite (gfx3_jss)
    - Animated sprite (gfx3_jas)
    - Static textured mesh (gfx3_jsm)
    - Animated textured mesh (gfx3_jam)
    - Different debug geometric shapes (gfx3_debug)
    - Railroad (gfx3_mover)
- 2D graphics manager
    - Texture manager
    - Animated sprite (gfx2_sprite)
    - Animated tilemap (gfx2_map)
- Architectures (your choice)
    - None (default)
    - Pure ECS (data-driven)
    - Scene
- Algorithm
    - AStar
    - Djikstra

## Getting started
You need to install [nodejs](https://nodejs.org/en/download/) and [browserify](https://browserify.org/).    
Once installation is done, let's build our first project.     

Download either the [complete solution](https://aliyah-engine.com/pub/1.0.0/starters/aliyah-starter.zip) with all packages included or the [minimal solution](https://aliyah-engine.com/pub/1.0.0/starters/aliyah-minimal-starter.zip) with only core package.     
Go to the root of project and launch the build with the following command:
```
// you need to build from the project root
# browserify src/main.js -o build/dist.js
```

Now, run your prefered web server (nginx, live-server, apache, nodejs, etc...), visit your localhost and you will see the project running. Let's go to write some code and add some [packages](https://aliyah-engine.com/download) to build your own web videogames.

## How to integrate your 3D models ?
The [Blender extension](https://aliyah-engine.com/pub/1.0.0/aliyah-blender-exporter.zip) allows you to export your models in Aliyah compatible formats!

## Examples
- [Rotating cube](https://aliyah-engine.com/samples/rotating-cube/)
- [3D pre-rendered](https://aliyah-engine.com/samples/prerendered/)
- [3D pre-rendered isometric](https://aliyah-engine.com/samples/prerendered-isometric/)
- [2D tilemap](https://aliyah-engine.com/samples/tilemap/)
- [2D tilemap with pathfinding](https://aliyah-engine.com/samples/tilemap-pathfinding/)

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
- Use a 3D format dedicated to the engine (see Blender exporter)
- Use a 3D format with frame by frame animations

## Roadmap
- Build a community and have fun together !
- Pass to ES6 import/export
- Implement Skybox
- Implement Mipmap
- Implement BSP (Binary Space Partitionning)
