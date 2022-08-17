window.addEventListener('load', async () => {
  let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
  let { screenManager } = require('./lib/screen/screen_manager');
  let { MainScreen } = require('./main_screen');

  await gfx3Manager.initialize();

  let then = Date.now();
  screenManager.requestSetScreen(new MainScreen());
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;

    screenManager.update(ts);

    gfx3Manager.beginDrawing(0);
    screenManager.draw();
    gfx3Manager.endDrawing();

    requestAnimationFrame(timeStamp => run(timeStamp));
  }  
});