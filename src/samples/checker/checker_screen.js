import { uiManager } from '../../lib/ui/ui_manager';
import { eventManager } from '../../lib/core/event_manager';
import { Screen } from '../../lib/screen/screen';
import { COLOR } from './core/enums';
import { Game } from './core/game';
import { CommandFactory } from './core/game_commands';
import { UIBoard } from './ui/ui_board';

class CheckerScreen extends Screen {
  constructor() {
    super();
    this.game = null;
    this.board = null;
    this.uiTitle = null;
    this.uiBoard = null;
  }

  update() {
    this.uiTitle.textContent = `AU TOUR DES ${this.game.getCurrentPlayer() == COLOR.BLACK ? 'NOIRS' : 'BLANCS'} DE JOUER`;
  }

  async onEnter() {
    this.game = new Game();
    this.board = this.game.getBoard();

    this.uiTitle = document.createElement('div');
    uiManager.addNode(this.uiTitle, 'position:absolute; top: 10%; left: 50%; transform: translateX(-50%)');

    this.uiBoard = new UIBoard();
    this.uiBoard.setBoard(this.board);
    uiManager.addWidget(this.uiBoard, 'position: absolute;inset: 0px;top: 50%;left: 50%;width: 400px;height: 400px;transform: translate(-50%, -50%)');
    uiManager.focus(this.uiBoard);

    eventManager.subscribe(this.game, 'E_REQUEST_TILE_ACTION', this, this.handleGameRequestTileAction);
    eventManager.subscribe(this.game, 'E_REQUEST_TILE_LOCATION', this, this.handleGameRequestTileLocation);

    this.game.startup();
  }

  handleGameRequestTileAction(data) {
    return new Promise(resolve => {
      eventManager.subscribe(this.uiBoard, 'E_TILE_CLICKED', this, (data) => {
        this.uiBoard.clearActions();
        let uiTile = this.uiBoard.getUITile(data.coord);
        let moveCmd = CommandFactory.create('MOVE', this.game, data.coord);
        if (moveCmd.isConditionCheck()) uiTile.addAction('MOVE');
        let powerupCmd = CommandFactory.create('POWERUP', this.game, data.coord);
        if (powerupCmd.isConditionCheck()) uiTile.addAction('POWERUP');
      });

      eventManager.subscribe(this.uiBoard, 'E_TILE_ACTION', this, async (data) => {
        eventManager.unsubscribe(this.uiBoard, 'E_TILE_CLICKED', this);
        eventManager.unsubscribe(this.uiBoard, 'E_TILE_ACTION', this);
        let uiTile = this.uiBoard.getUITile(data.coord);
        uiTile.clearActions();
        let cmd = CommandFactory.create(data.action, this.game, data.coord);
        cmd.exec().then(() => resolve());
      });
    });
  }

  handleGameRequestTileLocation({ required, predicateTile, response }) {
    return new Promise(resolve => {
      for (let y = 0; y < this.board.getRows(); y++) {
        for (let x = 0; x < this.board.getCols(); x++) {
          if (predicateTile(x, y)) {
            let uiTile = this.uiBoard.getUITile([x, y]);
            uiTile.setSelectable(true);
          }
        }
      }

      if (!required) {
        eventManager.subscribe(this.uiBoard, 'E_ECHAP_PRESSED', this, () => {
          eventManager.unsubscribe(this.uiBoard, 'E_ECHAP_PRESSED', this);
          eventManager.unsubscribe(this.uiBoard, 'E_TILE_CLICKED', this);
          this.uiBoard.clearSelectable();
          response.canceled = true;
          resolve();
        });
      }

      eventManager.subscribe(this.uiBoard, 'E_TILE_CLICKED', this, (data) => {
        let uiTile = this.uiBoard.getUITile(data.coord);
        if (uiTile.isSelectable()) {
          eventManager.unsubscribe(this.uiBoard, 'E_ECHAP_PRESSED', this);
          eventManager.unsubscribe(this.uiBoard, 'E_TILE_CLICKED', this);
          this.uiBoard.clearSelectable();
          response.canceled = false;
          response.x = data.coord[0];
          response.y = data.coord[1];
          resolve();
        }
      });
    });
  }
}

export { CheckerScreen };