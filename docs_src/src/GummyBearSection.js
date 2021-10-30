const defaultColors = ["yellow", "green", "blue", "orange", "red", "purple"];

function rotateColors(colors, rotation) {
  const rotatedColors = [...colors];
  for (let i = 0; i < rotation; i += 1) {
    const firstColor = rotatedColors[0];
    rotatedColors.shift();
    rotatedColors.push(firstColor);
  }
  return rotatedColors;
}

function limitNumberOfColors(colors, maxColors) {
  return colors.slice(0, maxColors);
}

function GummyBearSection(props) {
  const rotatedColors = rotateColors(defaultColors, props.rotation);
  const colors = limitNumberOfColors(rotatedColors, props.max);

  let calcOffset = (index) => {
    if (index === 0) return props.offset;
    return 0;
  };

  const columns = colors.map((color, index) => (
    <div className={`col-2 offset-${calcOffset(index)}`} key={index}>
      <img
        className="m-3"
        src={`${process.env.PUBLIC_URL}/img/gummy-bear-${color}.png`}
        alt="gummy-bear"
        height="200px"
      />
    </div>
  ));

  return (
    <section>
      <div className="row p-3">{columns}</div>
    </section>
  );
}

export default GummyBearSection;
