<img src="https://sprightly-beijinho.netlify.app/assets/images/logo-9849da864a27064e12d65e3ceffb5488.jpg" alt="logo" width="300"/>

![Drag Racing](https://img.shields.io/badge/lang-javascript-f39f37) ![Drag Racing](https://img.shields.io/badge/release-v1.0.0-blue)

Copyright © 2020-2022 [Raijin].

**Aliyah** is a bunch of light and simple packages to build web videogames.    
**Aliyah** support both **2D** (canvas) and **3D** (webgpu).    
No need to learn a new language, if you master **HTML/JS/CSS** then you can already create a professional and very optimized videogames.

## General features
- Screen Manager
- Sound Manager
- Event Manager
- RT Input Manager (keyboard & gamepad)
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
- Script Manager
- 3D Graphics Manager
    - Batching
    - Texture manager
    - Multiple viewports
    - Orthographic and projection views
    - Walkmesh (gfx3_jwm)
    - Static & Animated sprite (gfx3_sprite)
    - Static & Animated mesh with material support (gfx3_mesh)
    - Gltf (gfx3_mesh_gltf)
    - Skybox (gfx3_skybox)
    - Debug geometries (gfx3_debug_renderer)
    - Railroad (gfx3_mover)
- 2D Graphics Manager
    - Texture manager
    - Animated sprite (gfx2_sprite)
    - Animated tilemap (gfx2_map)

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
The [aliyah-blender-exporter](https://github.com/Anuban-corp/aliyah-blender-exporter) allows you to export your models in Aliyah compatible formats!

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
- Implement Texture Scrolling
- Implement BSP (Binary Space Partitionning)
