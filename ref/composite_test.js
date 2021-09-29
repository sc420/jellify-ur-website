// Reference: https://codepen.io/Shokeen/pen/EmOLJO

const {
  Bodies,
  Body,
  Composite,
  Composites,
  Constraint,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  World,
} = Matter;

// create engine
const engine = Engine.create();
const { world } = engine;

// create renderer
const render = Render.create({
  element: document.body,
  engine,
  options: {
    width: 800,
    height: 400,
    wireframes: true,
  },
});

Engine.run(engine);

Render.run(render);

const particleOptions = {
  friction: 0.05,
  frictionStatic: 0.1,
  render: { visible: true },
};

const constraintOptions = {
  stiffness: 0.1,
  render: { visible: true },
};

const addObjects = () => {
  const constraintStiffness = 0.01;
  const rectOptions = {
    mass: 1,
    collisionFilter: { group: -1 },
  };

  const compositeWalls = Body.create({
    // 810x420, center=(400, 200)
    parts: [
      Bodies.rectangle(400, 0, 810, 30),
      Bodies.rectangle(400, 400, 810, 30),
      Bodies.rectangle(0, 200, 30, 420),
      Bodies.rectangle(800, 200, 30, 420),
    ],
    isStatic: true,
    // Reference: https://stackoverflow.com/a/61314389
    collisionFilter: {
      group: -1,
    },
  });

  const rectOuter = Bodies.rectangle(400, 150, 400, 100, rectOptions);
  const rectInner1 = Bodies.rectangle(300, 150, 100, 50, rectOptions);
  const rectInner2 = Bodies.rectangle(500, 150, 100, 50, rectOptions);

  // Constraints connecting walls to the outer rectangle

  const constraintWallToOuterTopLeft = Constraint.create({
    bodyA: compositeWalls,
    pointA: { x: -405, y: -210 },
    bodyB: rectOuter,
    pointB: { x: -200, y: -50 },
    stiffness: constraintStiffness,
  });

  const constraintWallToOuterTopRight = Constraint.create({
    bodyA: compositeWalls,
    pointA: { x: 405, y: -210 },
    bodyB: rectOuter,
    pointB: { x: 200, y: -50 },
    stiffness: constraintStiffness,
  });

  const constraintWallToOuterBottomLeft = Constraint.create({
    bodyA: compositeWalls,
    pointA: { x: -405, y: 210 },
    bodyB: rectOuter,
    pointB: { x: -200, y: 50 },
    stiffness: constraintStiffness,
  });

  const constraintWallToOuterBottomRight = Constraint.create({
    bodyA: compositeWalls,
    pointA: { x: 405, y: 210 },
    bodyB: rectOuter,
    pointB: { x: 200, y: 50 },
    stiffness: constraintStiffness,
  });

  // Constraints between the outer rectangle and inner ones

  const constraintTopLeft = Constraint.create({
    bodyA: rectOuter,
    pointA: { x: -200, y: -50 },
    bodyB: rectInner1,
    pointB: { x: -50, y: -25 },
    stiffness: constraintStiffness,
  });

  const constraintTopRight = Constraint.create({
    bodyA: rectOuter,
    pointA: { x: 200, y: -50 },
    bodyB: rectInner2,
    pointB: { x: 50, y: -25 },
    stiffness: constraintStiffness,
  });

  const constraintBottomLeft = Constraint.create({
    bodyA: rectOuter,
    pointA: { x: -200, y: 50 },
    bodyB: rectInner1,
    pointB: { x: -50, y: 25 },
    stiffness: constraintStiffness,
  });

  const constraintBottomRight = Constraint.create({
    bodyA: rectOuter,
    pointA: { x: 200, y: 50 },
    bodyB: rectInner2,
    pointB: { x: 50, y: 25 },
    stiffness: constraintStiffness,
  });

  const constraintTopBridge = Constraint.create({
    bodyA: rectInner1,
    pointA: { x: 50, y: -25 },
    bodyB: rectInner2,
    pointB: { x: -50, y: -25 },
    stiffness: constraintStiffness,
  });

  const constraintBottomBridge = Constraint.create({
    bodyA: rectInner1,
    pointA: { x: 50, y: 25 },
    bodyB: rectInner2,
    pointB: { x: -50, y: 25 },
    stiffness: constraintStiffness,
  });

  return [
    compositeWalls,

    rectOuter,
    rectInner1,
    rectInner2,

    constraintWallToOuterTopLeft,
    constraintWallToOuterTopRight,
    constraintWallToOuterBottomLeft,
    constraintWallToOuterBottomRight,

    constraintTopLeft,
    constraintTopRight,
    constraintBottomLeft,
    constraintBottomRight,
    constraintTopBridge,
    constraintBottomBridge,
  ];
};

const objects = addObjects();
Composite.add(world, objects);

const rectOuter = objects[1];
const rectInner1 = objects[2];
const origX = rectInner1.position.x;
const origY = rectInner1.position.y;

setInterval(() => {
  const { angle, position } = rectInner1;
  //   console.debug(
  //     `rectInner1.position = (${position.x}, ${position.y}),
  // rectInner1.angle = ${angle}`,
  //   );

  const offsetX = position.x - origX;
  const offsetY = position.y - origY;

  $('.add-circle').css(
    'transform',
    `translate(${offsetX}px, ${offsetY}px) rotate(${angle}rad)`,
  );
}, 10);

// add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.9,
    render: {
      visible: false,
    },
  },
});

Composite.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;

// Disable the gravity
engine.world.gravity.y = 0;

const addCircle = function () {
  return Composites.softBody(
    Math.random() * 700 + 30,
    100,
    Math.floor(Math.random() * 6) + 1,
    5,
    0,
    0,
    true,
    10,
    particleOptions,
    constraintOptions,
  );
};

$(document).ready(() => {
  $('.add-circle').on('click', () => {
    World.add(engine.world, addCircle());
  });
  
  $(document).on('keypress', (e) => {
    if (e.which === 119) { // w key
      Body.applyForce(rectOuter, { x: 0, y: 0 }, { x: 0, y: -0.1 });
    } else if (e.which === 115) { // s key
      Body.applyForce(rectOuter, { x: 0, y: 0 }, { x: 0, y: 0.1 });
    }
  });
});
