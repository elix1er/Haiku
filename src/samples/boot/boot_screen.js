import { eventManager } from '../../lib/core/event_manager';
import { uiManager } from '../../lib/ui/ui_manager';
import { screenManager } from '../../lib/screen/screen_manager';
import { Screen } from '../../lib/screen/screen';
import { UIMenuText } from '../../lib/ui_menu_text/ui_menu_text';
// ---------------------------------------------------------------------------------------
import { ViewerScreen } from '../viewer/viewer_screen';
import { UserInterfaceScreen } from '../user-interface/user_interface_screen';
import { PrerenderedScreen } from '../prerendered/prerendered_screen';
import { PrerenderedIsoScreen } from '../prerendered-iso/prerendered_iso_screen';
import { TilemapScreen } from '../tilemap/tilemap_screen';
import { TilemapPathfindingScreen } from '../tilemap-pathfinding/tilemap_pathfinding_screen';
import { VisualNovelScreen } from '../visual-novel/visual_novel_screen';
import { CheckerScreen } from '../checker/checker_screen';
import { CCGScreen } from '../ccg/ccg_screen';
import { FPSScreen } from '../fps/fps_screen';
import { RPGScreen } from '../rpg/rpg_screen';
import { PerfScreen } from '../perf/perf_screen';
import { ParticlesScreen } from '../particles/particles_screen';
// ---------------------------------------------------------------------------------------

class BootScreen extends Screen {
  constructor() {
    super();
    this.uiMenu = new UIMenuText();
  }

  async onEnter() {
    this.uiMenu.add('0', '3D Viewer');
    this.uiMenu.add('1', 'User Interface');
    this.uiMenu.add('2', '3D Pre-rendered Demo');
    this.uiMenu.add('3', '3D Iso Pre-rendered Demo');
    this.uiMenu.add('4', 'Visual Novel Demo');
    this.uiMenu.add('5', '2D Scrolling Demo');
    this.uiMenu.add('6', '2D Tilemap Demo');
    this.uiMenu.add('7', '2D Tilemap Pathfinding Demo');
    this.uiMenu.add('8', 'Checker Demo');
    this.uiMenu.add('9', 'CCG Demo');
    this.uiMenu.add('10', 'FPS Demo');
    this.uiMenu.add('11', 'RPG Demo');
    this.uiMenu.add('12', 'Perf Demo');
    this.uiMenu.add('13', 'Particles Demo');
    uiManager.addWidget(this.uiMenu, 'position:absolute; top:50%; left:50%; width:60%; transform:translate(-50%,-50%);');

    eventManager.subscribe(this.uiMenu, 'E_ITEM_SELECTED', this, this.handleMenuItemSelected);
    uiManager.focus(this.uiMenu);
  }

  onExit() {
    uiManager.removeWidget(this.uiMenu);
  }

  handleMenuItemSelected(data) {
    if (data.id == 0) {
      screenManager.requestSetScreen(new ViewerScreen());
    }
    else if (data.id == 1) {
      screenManager.requestSetScreen(new UserInterfaceScreen());
    }
    else if (data.id == 2) {
      screenManager.requestSetScreen(new PrerenderedScreen());
    }
    else if (data.id == 3) {
      screenManager.requestSetScreen(new PrerenderedIsoScreen());
    }
    else if (data.id == 4) {
      screenManager.requestSetScreen(new VisualNovelScreen());
    }
    else if (data.id == 5) {
      // screenManager.requestSetScreen(new ScrollingScreen());
    }
    else if (data.id == 6) {
      screenManager.requestSetScreen(new TilemapScreen());
    }
    else if (data.id == 7) {
      screenManager.requestSetScreen(new TilemapPathfindingScreen());
    }
    else if (data.id == 8) {
      screenManager.requestSetScreen(new CheckerScreen());
    }
    else if (data.id == 9) {
      screenManager.requestSetScreen(new CCGScreen(), { duelId: '0000' });
    }
    else if (data.id == 10) {
      screenManager.requestSetScreen(new FPSScreen());
    }
    else if (data.id == 11) {
      screenManager.requestSetScreen(new RPGScreen());
    }
    else if (data.id == 12) {
      screenManager.requestSetScreen(new PerfScreen());
    }
    else if (data.id == 13) {
      screenManager.requestSetScreen(new ParticlesScreen());
    }
  }
}

export { BootScreen };