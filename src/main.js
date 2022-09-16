import { gameManager } from './game_manager.js';
import { screenManager } from './lib/screen/screen_manager.js';
import { MainScreen } from './main_screen.js';

await gameManager.startup();
screenManager.requestSetScreen(new MainScreen());