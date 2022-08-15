window.addEventListener('load', async () => {
  let { screenManager } = require('./lib/screen/screen_manager');
  let { gfx2Manager } = require('./lib/gfx2/gfx2_manager');
  let { MainScreen } = require('./main_screen');

  let then = Date.now();
  screenManager.requestSetScreen(new MainScreen());
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;
  
    screenManager.update(ts);
    gfx2Manager.update(ts);

    gfx2Manager.beginDrawing();
    screenManager.draw();
    gfx2Manager.endDrawing();
  
    requestAnimationFrame(timeStamp => run(timeStamp));
  }
});