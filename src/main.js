window.addEventListener('load', async () => {
  let { gfx3Manager } = require('./lib/gfx3/gfx3_manager');
  let { screenManager } = require('./lib/screen/screen_manager');
  let { MainScreen } = require('./main_screen');

  let then = 0;
  await gfx3Manager.initialize();
  screenManager.requestSetScreen(new MainScreen());

  (function run(timeStamp) {
    let ts = timeStamp - then;
    then = timeStamp;

    screenManager.update(ts);

    gfx3Manager.beginDrawing(0);
    screenManager.draw();
    gfx3Manager.endDrawing();

    requestAnimationFrame(timeStamp => run(timeStamp));
  }(0));
});