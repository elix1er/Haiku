```javascript
class SampleScreen extends Screen {
  constructor() {
    super();
    this.ecs = new ECSManager();
  }

  onEnter() {
    this.ecs.addSystem(new MoveSystem());
    this.ecs.addSystem(new DisplaySystem());
    this.ecs.addEntity(this.createBall('red', 10, 10, 0.5, 0.5));
    this.ecs.addEntity(this.createBall('blue', 0, 0, 0.0, 0.0));
  }

  onUpdate() {
    this.ecs.update();
  }

  createBall(color, x, y, vx, vy) {
    let entity = new ECSEntity();
    entity.addComponent(new PositionComponent(x, y));
    entity.addComponent(new MoveComponent(vx, vy));
    entity.addComponent(new CircleComponent(10, color));
    return entity;
  }
}

class PositionComponent extends ECSComponent {
  constructor(x = 0, y = 0) {
    super('PositionComponent');
    this.x = x;
    this.y = y;
  }
}

class MoveComponent extends ECSComponent {
  constructor(vx = 0, vy = 0) {
    super('MoveComponent');
    this.vx = vx;
    this.vy = vy;
  }
}

class CircleComponent extends ECSComponent {
  constructor(radius, color) {
    super('CircleComponent');
    this.radius = radius;
    this.color = color;
  }
}

class MoveSystem extends ECSSystem {
  constructor(app) {
    super(app);
    this.addRequiredComponentTypename('PositionComponent');
    this.addRequiredComponentTypename('MoveComponent');
  }

  onUpdate(entity) {
    let positionComponent = entity.getComponent('PositionComponent');
    let moveComponent = entity.getComponent('MoveComponent');
    positionComponent.x += moveComponent.vx;
    positionComponent.y += moveComponent.vy;
    moveComponent.vx *= 0.98;
    moveComponent.vy *= 0.98;
  }
}

class DisplaySystem extends ECSSystem {
  constructor(app) {
    super(app);
    this.addRequiredComponentTypename('PositionComponent');
    this.addRequiredComponentTypename('CircleComponent');
  }

  onUpdate(entity) {
    let positionComponent = entity.getComponent('PositionComponent');
    let circleComponent = entity.getComponent('CircleComponent');
    console.log('draw circle [' + positionComponent.x + ',' + positionComponent.y + '] colored in ' + circleComponent.color);
  }
}
```
