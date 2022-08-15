window.addEventListener('load', async () => {
  let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
  let { uiManager } = require('./lib/ui/ui_manager');
  let { Room } = require('./room');

  let then = Date.now();
  await gfx3Manager.initialize();

  let room = new Room();
  await room.loadFromFile('./assets/rooms/sample00/data.room', 'Spawn0000');
  document.addEventListener('keydown', (e) => handleKeyDown(e));
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;

    uiManager.update(ts);
    room.update(ts);

    gfx3Manager.beginDrawing(0);
    room.draw();
    gfx3Manager.endDrawing();

    requestAnimationFrame(timeStamp => run(timeStamp));
  }

  function handleKeyDown(e) {
    if (e.repeat) {
      return;
    }

    room.handleKeyDownOnce(e);
  }  
});