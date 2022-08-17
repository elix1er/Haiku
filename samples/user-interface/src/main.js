window.addEventListener('load', async () => {
  let { screenManager } = require('./lib/screen/screen_manager');
  let { MainScreen } = require('./main_screen');

  let then = Date.now();
  screenManager.requestSetScreen(new MainScreen());
  run();

  function run(timeStamp = Date.now()) {
    let ts = timeStamp - then;
    then = timeStamp;
    screenManager.update(ts);
    requestAnimationFrame(timeStamp => run(timeStamp));
  }  
});