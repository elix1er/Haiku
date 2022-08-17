(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let { EventSubscriber } = require('./event_subscriber');

class EventManager {
  constructor() {
    this.subscribers = [];
  }

  wait(emitter, type) {
    return new Promise(resolve => {
      this.subscribeOnce(emitter, type, this, (data) => {
        resolve(data);
      });
    });
  }

  subscribe(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, false, cb));
  }

  subscribeOnce(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, true, cb));
  }

  unsubscribe(emitter, type, listener) {
    for (let subscriber of this.subscribers) {
      if (subscriber.emitter == emitter && subscriber.type == type && subscriber.listener == listener) {
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        return;
      }
    }
  }

  unsubscribeAll() {
    this.subscribers = [];
  }

  async emit(emitter, type, data) {
    let promises = [];

    for (let subscriber of this.subscribers.slice()) {
      if (subscriber.emitter == emitter && subscriber.type == type) {
        let res = subscriber.cb.call(subscriber.listener, data);
        if (res instanceof Promise) {
          promises.push(res);
        }
  
        if (subscriber.once) {
          this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        }
      }
    }

    return Promise.all(promises);
  }
}

module.exports.eventManager = new EventManager();
},{"./event_subscriber":2}],2:[function(require,module,exports){
class EventSubscriber {
  constructor(emitter, type, listener, once, cb) {
    this.emitter = emitter;
    this.type = type;
    this.listener = listener;
    this.once = once;
    this.cb = cb;
  }
}

module.exports.EventSubscriber = EventSubscriber;
},{}],3:[function(require,module,exports){
class Screen {
  constructor(app) {
    this.app = app;
    this.blocking = true;
  }

  setBlocking(blocking) {
    this.blocking = blocking;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw() {
    // virtual method called during draw phase !
  }

  async onEnter(args) {
    // virtual method called during enter phase !
  }

  async onExit() {
    // virtual method called during exit phase !
  }

  onBringToFront() {
    // virtual method called when get the top state level !
  }

  onBringToBack() {
    // virtual method called when lost the top state level !
  }
}

module.exports.Screen = Screen;
},{}],4:[function(require,module,exports){
class ScreenManager {
  constructor() {
    this.requests = [];
    this.screens = [];
  }

  update(ts) {
    while (this.requests.length > 0) {
      let request = this.requests.pop();
      request();
    }

    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].update(ts);
      if (this.screens[i].blocking) {
        return;
      }
    }
  }

  draw() {
    for (let i = this.screens.length - 1; i >= 0; i--) {
      this.screens[i].draw();
      if (this.screens[i].blocking) {
        return;
      }
    }
  }

  requestPushScreen(newTopScreen, args = {}) {
    this.requests.push(() => {
      if (this.screens.indexOf(newTopScreen) != -1) {
        throw new Error('ScreenManager::requestPushScreen(): You try to push an existing screen to the stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onBringToBack(newTopScreen);

      let promise = newTopScreen.onEnter(args);
      promise.then(() => this.screens.push(newTopScreen));
    });
  }

  requestSetScreen(newScreen, args = {}) {
    this.requests.push(() => {
      this.screens.forEach(screen => screen.onExit());
      this.screens = [];
      let promise = newScreen.onEnter(args);
      promise.then(() => this.screens.push(newScreen));
    });
  }

  requestPopScreen() {
    this.requests.push(() => {
      if (this.screens.length == 0) {
        throw new Error('ScreenManager::requestPopScreen: You try to pop an empty state stack !');
      }

      let topScreen = this.screens[this.screens.length - 1];
      topScreen.onExit();
      this.screens.pop();

      if (this.screens.length > 0) {
        let newTopScreen = this.screens[this.screens.length - 1];
        newTopScreen.onBringToFront(topScreen);
      }
    });
  }
}

module.exports.screenManager = new ScreenManager();
},{}],5:[function(require,module,exports){
let { eventManager} = require('../core/event_manager');
const { UIWidget } = require('./ui_widget');

/**
 * Singleton représentant un gestionnaire d'interface utilisateur.
 */
class UIManager {
  /**
   * Créer un gestionnaire d'interface utilisateur.
   */
  constructor() {
    this.root = null;
    this.fadeLayer = null;
    this.overLayer = null;
    this.focusedWidget = null;
    this.widgets = [];

    this.root = document.getElementById('UI_ROOT');
    if (!this.root) {
      throw new Error('UIManager::UIManager: UI_ROOT element not found !');
    }

    this.fadeLayer = document.getElementById('UI_FADELAYER');
    if (!this.fadeLayer) {
      throw new Error('UIManager::UIManager: UI_FADELAYER element not found !');
    }

    this.overLayer = document.getElementById('UI_OVERLAYER');
    if (!this.overLayer) {
      throw new Error('UIManager::UIManager: UI_OVERLAYER element not found !');
    }
  }

  /**
   * Fonction de mise à jour.
   * @param {number} ts - Temps passé depuis la dernière mise à jour.
   */
  update(ts) {
    for (let widget of this.widgets) {
      widget.update(ts);
    }
  }

  /**
   * Récupère les widgets.
   * @return {array} Le tableau des widgets.
   */
  getWidgets() {
    return this.widgets;
  }

  /**
   * Donne le focus à {widget}.
   * @param {UIWidget} widget - L'élément d'interface utilisateur.
   */
  focus(widget) {
    if (this.focusedWidget) {
      this.focusedWidget.unfocus();
    }

    widget.focus();
    this.focusedWidget = widget;
    eventManager.emit(this, 'E_FOCUSED', { widget: widget });
  }

  /**
   * Enlève le focus.
   */
  unfocus() {
    if (!this.focusedWidget) {
      return;
    }

    this.focusedWidget.unfocus();
    this.focusedWidget = null;
    eventManager.emit(this, 'E_UNFOCUSED');
  }

  /**
   * Ajoute un élément HTML au noeud racine.
   * Nota bene: Idéal pour des éléments d'affichage simple et sans logique interne.
   * @param {Node} node - Element HTML.
   * @param {string} styles - Styles CSS.
   */
  addNode(node, styles = '') {
    node.style.cssText += styles;
    this.root.appendChild(node);
  }

  /**
   * Supprime un élément HTML au noeud racine.
   * Nota bene: Idéal pour des éléments d'affichage simple et sans logique interne.
   * @param {Node} node - Element HTML.
   */
  removeNode(node) {
    this.root.removeChild(node);
  }

  /**
   * Ajoute un widget au noeud racine.
   * @param {UIWidget} widget - Element d'interface utilisateur.
   * @param {string} styles - Styles CSS.
   * @return {UIWidget} L'élément d'interface utilisateur.
   */
  addWidget(widget, styles = '') {
    widget.appendStyles(styles);
    this.root.appendChild(widget.getNode());
    this.widgets.push(widget);
    return widget;
  }

  /**
   * Supprime un widget au noeud racine.
   * @param {UIWidget} widget - Element d'interface utilisateur.
   */
  removeWidget(widget) {
    let index = this.widgets.indexOf(widget);
    if (index == -1) {
      throw new Error('UIManager::removeWidget: fail to remove widget !');
    }

    if (this.widgets[index] == this.focusedWidget) {
      this.unfocus();
    }

    this.widgets[index].delete();
    this.widgets.splice(index, 1);
    return true;
  }

  /**
   * Supprime tous les widgets.
   */
  clear() {
    this.root.innerHTML = '';
    this.focusedWidget = null;

    while (this.widgets.length > 0) {
      let widget = this.widgets.pop();
      widget.delete();
    }
  }

  /**
   * Lance une animation de fondu (invisible -> fond noir).
   * @param {number} delay - La durée à attendre avant de débuter l'animation.
   * @param {number} ms - La durée de l'animation.
   * @param {string} transitionTimingFunction - Fonction d'interpolation.
   * @param {function} cb - Fonction appelée à la fin de l'animation.
   */
  fadeIn(delay, ms, transitionTimingFunction = 'linear', cb = () => {}) {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = 1;
    setTimeout(() => { cb(); }, delay + ms);
  }

  /**
   * Lance une animation de fondu (fond noir -> invisible).
   * @param {number} delay - La durée à attendre avant de débuter l'animation.
   * @param {number} ms - La durée de l'animation.
   * @param {string} transitionTimingFunction - Fonction d'interpolation.
   * @param {function} cb - Fonction appelée à la fin de l'animation.
   */
  fadeOut(delay, ms, transitionTimingFunction = 'linear', cb = () => {}) {
    this.fadeLayer.style.transitionDuration = ms + 'ms';
    this.fadeLayer.style.transitionDelay = delay + 'ms';
    this.fadeLayer.style.transitionTimingFunction = transitionTimingFunction;
    this.fadeLayer.style.opacity = 0;
    setTimeout(() => { cb(); }, delay + ms);
  }

  /**
   * Active la sur-couche opaque.
   * @param {boolean} enable - Si vrai, la sur-couche est activée.
   */
   enableOverlayer(enable) {
    this.overLayer.style.opacity = (enable) ? '1' : '0';
  }
}

module.exports.uiManager = new UIManager();
},{"../core/event_manager":1,"./ui_widget":6}],6:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');

/**
 * Classe représentant un élément d'interface utilisateur.
 */
class UIWidget {
  /**
   * Créer un élément d'interface utilisateur.
   */
  constructor(options = {}) {
    this.id = options.id ?? '';
    this.className = options.className ?? '';
    this.template = options.template ?? '';
    this.node = document.createElement('div');
    this.node.className = this.className;
    this.node.innerHTML = this.template;
    this.handleKeyDownCb = (e) => this.onKeyDown(e);

    this.node.addEventListener('animationend', () => eventManager.emit(this, 'E_ANIMATION_FINISHED'));
  }

  /**
   * Fonction de mise à jour.
   * @param {number} ts - Temps passé depuis la dernière mise à jour.
   */
  update(ts) {
    // virtual method called during update phase !
  }

  /**
   * Destructeur.
   * Nota bene: Entraine la désinscription des évènements utilisateur et détache le noeud HTML de son parent.
   */
  delete() {
    document.removeEventListener('keydown', this.handleKeyDownCb);
    this.node.remove();
    this.node = null;
  }

  /**
   * Retourne l'identifiant.
   * @return {string} L'Identifiant.
   */
  getId() {
    return this.id;
  }

  /**
   * Définit l'identifiant.
   * @param {string} id - L'Identifiant.
   */
  setId(id) {
    this.id = id;
  }

  /**
   * Retourne le noeud HTML parent.
   * @param {HTMLElement} node - Le noeud HTML.
   */
  getNode() {
    return this.node;
  }

  /**
   * Ajoute du css dans le style-inline du noeud parent.
   * @param {string} styles - Le css.
   */
  appendStyles(styles) {
    this.node.style.cssText += styles;
  }

  /**
   * Donne le focus.
   * Nota bene: Souscription aux évènements utilisateur et ajout de la classe 'u-focused'.
   */
  focus() {
    this.node.classList.add('u-focused');
    eventManager.emit(this, 'E_FOCUSED');
    document.addEventListener('keydown', this.handleKeyDownCb);
  }

  /**
   * Enlève le focus.
   * Nota bene: Désinscription aux évènements utilisateur et suppréssion de la classe 'u-focused'.
   */
  unfocus() {
    this.node.classList.remove('u-focused');
    eventManager.emit(this, 'E_UNFOCUSED');
    document.removeEventListener('keydown', this.handleKeyDownCb);
  }

  /**
   * Vérifie si le widget est focus.
   * @return {boolean} Vrai si le widget est focus.
   */
  isFocused() {
    return this.node.classList.contains('u-focused') == true;
  }

  /**
   * Rends le widget visible.
   */
  setVisible(visible) {
    if (visible) {
      this.node.classList.remove('u-hidden');
      
    }
    else {
      this.node.classList.add('u-hidden');
    }
  }

  /**
   * Vérifie si le widget est visible.
   * @return {boolean} Vrai si le widget est visible.
   */
  isVisible() {
    return this.node.classList.contains('u-hidden') == false;
  }

  setEnabled(enabled) {
    if (enabled) {
      this.node.classList.remove('u-disabled');
    }
    else {
      this.node.classList.add('u-disabled');
    }
  }

  isEnabled() {
    return this.node.classList.contains('u-disabled') === false;
  }

  setSelected(selected) {
    if (selected) {
      this.node.classList.add('u-selected');
    }
    else {
      this.node.classList.remove('u-selected');
    }
  }

  isSelected() {
    return this.node.classList.contains('u-selected');
  }

  animate(animation) {
    this.node.style.animation = animation;
  }

  onKeyDown(e) {
    // virtual method !
  }
}

module.exports.UIWidget = UIWidget;
},{"../core/event_manager":1}],7:[function(require,module,exports){
let { eventManager } = require('../core/event_manager');
let { UIWidget } = require('../ui/ui_widget');

let MenuFocusEnum = {
  AUTO: 0,
  NONE: 1
};

let MenuAxisEnum = {
  X: 0,
  Y: 1,
  XY: 2
};

class UIMenu extends UIWidget {
  constructor(options = {}) {
    super({
      className: options.className ?? 'UIMenu'
    });

    this.axis = options.axis ?? MenuAxisEnum.Y;
    this.rows = options.rows ?? 0;
    this.columns = options.columns ?? 0;
    this.multiple = options.multiple ?? false;
    this.selectable = options.selectable ?? true;
    this.widgets = [];
    this.focusedWidget = null;
    this.selectedWidgets = [];

    if (this.axis == MenuAxisEnum.X) {
      this.rows = 1;
      this.columns = Infinity;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'row';
    }
    else if (this.axis == MenuAxisEnum.Y) {
      this.rows = Infinity;
      this.columns = 1;
      this.node.style.display = 'flex';
      this.node.style.flexDirection = 'column';
    }
    else {
      this.node.style.display = 'grid';
      this.node.style.grid = 'repeat(' + this.rows + ', auto) / repeat(' + this.columns + ', auto)';
    }
  }

  update(ts) {
    for (let widget of this.widgets) {
      widget.update(ts);
    }
  }

  focus(focusIndex = MenuFocusEnum.AUTO) {
    if (focusIndex == MenuFocusEnum.AUTO) {
      let focusedIndex = this.widgets.indexOf(this.focusedWidget);
      this.focusWidget(focusedIndex > 0 ? focusedIndex : 0, true);
    }
    else if (focusIndex >= 0) {
      this.focusWidget(focusIndex, true);
    }

    super.focus();
  }

  getFocusedWidgetId() {
    return this.focusedWidget ? this.focusedWidget.getId() : null;
  }

  getFocusedWidgetIndex() {
    return this.widgets.indexOf(this.focusedWidget);
  }

  getSelectedWidgetId() {
    return this.selectedWidgets[0] ? this.selectedWidgets[0].getId() : null;
  }

  getSelectedWidgetIndex() {
    return this.widgets.indexOf(this.selectedWidgets[0]);
  }

  getWidgets() {
    return this.widgets;
  }

  addWidget(widget, index = -1) {
    let widgetNode = widget.getNode();

    if (index == -1) {
      this.widgets.push(widget);
      this.node.appendChild(widgetNode);
    }
    else {
      this.widgets.splice(index + 1, 0, widget);
      this.node.insertBefore(widgetNode, this.node.children[index]);
    }

    widgetNode.addEventListener('click', () => this.handleWidgetClicked(widget));
    widgetNode.addEventListener('mousemove', () => this.handleWidgetHover(widget));
  }

  removeWidget(index) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::removeWidget(): widget not found !');
    }

    if (this.selectedWidgets.indexOf(widget) != -1) {
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
    }

    if (this.focusedWidget == widget) {
      this.focusedWidget = null;
    }

    this.widgets.splice(this.widgets.indexOf(widget), 1);
    widget.delete();
  }

  focusWidget(index, preventScroll = false, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::focusWidget(): widget not found !');
    }

    if (!preventScroll) {
      let rect = this.getViewRectWidget(index);
      if (rect.top < 0) {
        this.node.scrollTop += rect.top;
      }
      if (rect.bottom > this.node.clientHeight) {
        this.node.scrollTop += rect.bottom - this.node.clientHeight;
      }
    }

    this.widgets.forEach(w => w.unfocus());
    widget.focus();
    this.focusedWidget = widget;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_FOCUSED', { id: widget.getId(), index: index });
    }
  }

  unfocusWidget(emit = true) {
    this.widgets.forEach(w => w.unfocus());
    this.focusedWidget = null;

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNFOCUSED');
    }
  }

  selectWidget(index, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::selectWidget(): widget not found !');
    }
    if (!widget.isEnabled()) {
      return;
    }

    if (this.multiple && widget.isSelected()) {
      widget.setSelected(false);
      this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);
      return;
    }

    if (!this.multiple) {
      this.widgets.forEach(w => w.setSelected(false));
      this.selectedWidgets = [];
    }

    widget.setSelected(true);
    this.selectedWidgets.push(widget);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_SELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidget(index, emit = true) {
    let widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::unselectWidget(): widget not found !');
    }
    if (!widget.isSelected()) {
      return;
    }

    widget.setSelected(false);
    this.selectedWidgets.splice(this.selectedWidgets.indexOf(widget), 1);

    if (emit) {
      eventManager.emit(this, 'E_ITEM_UNSELECTED', { id: widget.getId(), index: index });
    }
  }

  unselectWidgets(emit = true) {
    this.widgets.forEach(w => w.setSelected(false));
    this.selectedWidgets = [];
    
    if (emit) {
      eventManager.emit(this, 'E_UNSELECTED');
    }
  }

  setEnabledWidget(index, enabled) {
    const widget = this.widgets[index];
    if (!widget) {
      throw new Error('UIMenu::setEnabledWidget(): widget not found !');
    }

    widget.setEnabled(enabled);
  }

  setEnabledWidgets(enabled) {
    this.widgets.forEach(w => w.setEnabled(enabled));
  }

  clear() {
    this.widgets.forEach(w => w.delete());
    this.widgets = [];
    this.focusedWidget = null;
    this.selectedWidgets = [];
    this.node.innerHTML = '';
  }

  close() {
    this.unselectWidgets();
    this.unfocusWidget();
    this.hide();
  }

  getViewRectWidget(index) {
    let top = this.node.children[index].offsetTop - this.node.scrollTop;
    let bottom = top + this.node.children[index].offsetHeight;
    return { top, bottom };
  }

  onKeyDown(e) {
    let focusedIndex = this.getFocusedWidgetIndex();
    if (e.key == 'Escape') {
      eventManager.emit(this, 'E_CLOSED');
    }
    else if (e.key == 'Enter' && this.selectable && focusedIndex != -1) {
      this.selectWidget(focusedIndex);
    }
    else if (e.key == 'ArrowLeft') {
      let prevIndex = (focusedIndex - 1 < 0) ? this.widgets.length - 1 : focusedIndex - 1;
      this.focusWidget(prevIndex);
    }
    else if (e.key == 'ArrowRight') {
      let nextIndex = (focusedIndex + 1 > this.widgets.length - 1) ? 0 : focusedIndex + 1;
      this.focusWidget(nextIndex);
    }
    else if (e.key == 'ArrowUp') {
      let prevIndex = (focusedIndex - this.columns < 0) ? this.widgets.length - 1 : focusedIndex - this.columns;
      this.focusWidget(prevIndex);
    }
    else if (e.key == 'ArrowDown') {
      let nextIndex = (focusedIndex + this.columns > this.widgets.length - 1) ? 0 : focusedIndex + this.columns;
      this.focusWidget(nextIndex);
    }
  }

  handleWidgetClicked(widget) {
    if (!this.isFocused()) {
      return;
    }

    this.selectWidget(this.widgets.indexOf(widget), true);
  }

  handleWidgetHover(widget) {
    if (!this.isFocused()) {
      return;
    }

    this.focusWidget(this.widgets.indexOf(widget), true);
  }
}

module.exports.MenuFocusEnum = MenuFocusEnum;
module.exports.MenuAxisEnum = MenuAxisEnum;
module.exports.UIMenu = UIMenu;
},{"../core/event_manager":1,"../ui/ui_widget":6}],8:[function(require,module,exports){
let { UIMenu } = require('../ui_menu/ui_menu');
let { UIMenuTextItem } = require('./ui_menu_text_item');

class UIMenuText extends UIMenu {
  constructor(options = {}) {
    super(Object.assign(options, {
      className: 'UIMenuText'
    }));
  }

  add(id, text) {
    let item = new UIMenuTextItem();
    item.setId(id);
    item.setText(text);
    this.addWidget(item);
  }

  set(id, text) {
    let item = this.widgets.find(w => w.getId() == id);
    if (item == -1) {
      throw new Error('UIMenuText::set(): item not found !');
    }

    item.setText(text);
  }

  remove(id) {
    let widgetIndex = this.widgets.findIndex(w => w.getId() == id);
    if (widgetIndex == -1) {
      throw new Error('UIMenuText::remove(): item not found !');
    }

    this.removeWidget(widgetIndex);
  }

  getSelectedId() {
    return this.getSelectedWidgetId();
  }
}

module.exports.UIMenuText = UIMenuText;
},{"../ui_menu/ui_menu":7,"./ui_menu_text_item":9}],9:[function(require,module,exports){
let { UIWidget } = require('../ui/ui_widget');

class UIMenuTextItem extends UIWidget {
  constructor(options = {}) {
    super({
      className: 'UIMenuTextItem'
    });

    this.node.textContent = options.text ?? '';
  }

  setText(text) {
    this.node.textContent = text;
  }
}

module.exports.UIMenuTextItem = UIMenuTextItem;
},{"../ui/ui_widget":6}],10:[function(require,module,exports){
let { UIWidget } = require('../ui/ui_widget');

class UIText extends UIWidget {
  constructor() {
    super({
      className: 'UIText',
      template: '<span class="UIText-text js-text"></span>'
    });
  }

  setText(text) {
    this.node.querySelector('.js-text').textContent = text;
  }
}

module.exports.UIText = UIText;
},{"../ui/ui_widget":6}],11:[function(require,module,exports){
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
},{"./lib/screen/screen_manager":4,"./main_screen":12}],12:[function(require,module,exports){
let { eventManager } = require('./lib/core/event_manager');
let { uiManager } = require('./lib/ui/ui_manager');
let { Screen } = require('./lib/screen/screen');
let { UIMenuText } = require('./lib/ui_menu_text/ui_menu_text');
let { UIText } = require('./lib/ui_text/ui_text');
// ---------------------------------------------------------------------------------------

class MainScreen extends Screen {
  constructor() {
    super();
    this.uiTitle = new UIText();
    this.uiMenu1 = new UIMenuText();
    this.uiMenu2 = new UIMenuText();
  }

  async onEnter() {
    this.uiTitle.setText('Menu');
    uiManager.addWidget(this.uiTitle, 'position:absolute; top:0; left:0; right:0; height:50px');
    
    this.uiMenu1.add('1', 'Menu 1 Text 1');
    this.uiMenu1.add('2', 'Menu 1 Text 2');
    this.uiMenu1.add('3', 'Menu 1 Text 3');
    uiManager.addWidget(this.uiMenu1, 'position:absolute; top:50px; left:0; bottom:0; width:40%');

    this.uiMenu2.add('1', 'Menu 2 Text 1');
    this.uiMenu2.add('2', 'Menu 2 Text 2');
    this.uiMenu2.add('3', 'Menu 2 Test 3');
    uiManager.addWidget(this.uiMenu2, 'position:absolute; top:50px; left:40%; bottom:0; width:60%');

    eventManager.subscribe(this.uiMenu1, 'E_ITEM_SELECTED', this, this.handleMenu1ItemSelected);
    eventManager.subscribe(this.uiMenu2, 'E_CLOSED', this, this.handleMenu2Closed);
    eventManager.subscribe(this.uiMenu2, 'E_ITEM_SELECTED', this, this.handleMenu2ItemSelected);

    uiManager.focus(this.uiMenu1);
  }

  async onExit() {
    uiManager.removeWidget(this.uiTitle);
    uiManager.removeWidget(this.uiMenu1);
    uiManager.removeWidget(this.uiMenu2);
  }

  handleMenu1ItemSelected(data) {
    uiManager.focus(this.uiMenu2);
  }

  handleMenu2Closed() {
    this.uiMenu1.unselectWidgets();
    uiManager.focus(this.uiMenu1);
  }

  handleMenu2ItemSelected(data) {
    this.uiTitle.setText('You have selected menu item number ' + data.index);
    this.uiMenu1.unselectWidgets();
    this.uiMenu2.unselectWidgets();
    uiManager.focus(this.uiMenu1);
  }
}

module.exports.MainScreen = MainScreen;
},{"./lib/core/event_manager":1,"./lib/screen/screen":3,"./lib/ui/ui_manager":5,"./lib/ui_menu_text/ui_menu_text":8,"./lib/ui_text/ui_text":10}]},{},[11]);
