<img src="https://sprightly-beijinho.netlify.app/assets/images/logo-9849da864a27064e12d65e3ceffb5488.jpg" alt="logo" width="300"/>

![Drag Racing](https://img.shields.io/badge/lang-javascript-f39f37) ![Drag Racing](https://img.shields.io/badge/release-v1.1.3-blue)

Copyright © 2020-2022 [Raijin].

**Aliyah** is a simple and modular web library to build videogames.    
**Aliyah** support both **2D** (canvas) and **3D** (webgpu).    
No need to learn a new language, if you master **HTML/JS/CSS** then you can create a professional and very optimized videogames with **Aliyah**.

## Installation
First, check that Node.js is installed on your environment.    
Then go to https://sprightly-beijinho.netlify.app/download to download Aliyah.    
You have two choices here: download the complete solution or only the modules that interest you.    
Once this is done you can use each package as a library of your project, quite simply :)

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

## Examples
- [Rotating cube](https://sprightly-beijinho.netlify.app/samples/rotating-cube/)
- [3D pre-rendered](https://sprightly-beijinho.netlify.app/samples/prerendered/)
- [3D pre-rendered isometric](https://sprightly-beijinho.netlify.app/samples/prerendered-isometric/)
- [2D tilemap](https://sprightly-beijinho.netlify.app/samples/tilemap/)
- [2D tilemap with pathfinding](https://sprightly-beijinho.netlify.app/samples/tilemap-pathfinding/)

## Some parts taken from this work
- Use DOM for UI elements
- Use a 3D format dedicated to the engine (see Blender exporter)
- Use a 3D format with frame by frame animations

## How to integrate your 3D models ?
The Blender extension allows you to export your models in Aliyah compatible formats!

## Roadmap
- Build a community and have fun together !
- Pass to ES6 import/export
- Implement Skybox
- Implement Mipmap
- Implement BSP (Binary Space Partitionning)
