// Reference: https://codepen.io/Shokeen/pen/EmOLJO

const {
  Bodies,
  Composite,
  Composites,
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

const softBody = Composites.stack(100, 100, 5, 3, 10, 10, (x, y) => {
  if (y <= 100) {
    return Bodies.circle(x + 10, y, 30, particleOptions);
  }
  return Bodies.circle(x, y, 30, particleOptions);
});

Composites.mesh(softBody, 5, 3, true, constraintOptions);

World.add(world, [
  softBody,
  // walls
  Bodies.rectangle(400, 0, 810, 30, { isStatic: true }),
  Bodies.rectangle(400, 400, 810, 30, { isStatic: true }),
  Bodies.rectangle(800, 200, 30, 420, { isStatic: true }),
  Bodies.rectangle(0, 200, 30, 420, { isStatic: true }),
]);

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

$('.add-circle').on('click', () => {
  World.add(engine.world, addCircle());
});
