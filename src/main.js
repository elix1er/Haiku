import { gameManager } from './game_manager';
import { screenManager } from './lib/screen/screen_manager';
import { MainScreen } from './samples/viewer/main_screen';

gameManager.startup();
screenManager.requestSetScreen(new MainScreen());