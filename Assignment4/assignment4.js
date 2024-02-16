var width = 400,
  height = 300;

var data = await d3
  .json("./starwars-interactions/starwars-full-interactions-allCharacters.json")
  .catch(function (error) {
    console.error("Error loading data:", error);
  });

var data2 = await d3
  .json(
    "./starwars-interactions/starwars-episode-2-interactions-allCharacters.json"
  )
  .catch(function (error) {
    console.error("Error loading data:", error);
  });

console.log(data);
const createDiagram = (svgId, data) => {
  const svg = d3.select(`#${svgId}`);

  const minDomain = d3.min(data.nodes, function (d) {
    return d.value;
  });

  const maxDomain = d3.max(data.nodes, function (d) {
    return d.value;
  });

  const minRadius = 10;
  const maxRadius = 20;

  const sizeScale = d3
    .scaleLinear()
    .domain([minDomain, maxDomain])
    .range([minRadius, maxRadius]);

  // Create and configure the simulation
  let simulation = d3
    .forceSimulation(data.nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().links(data.links))
    .on("tick", ticked);

  function updateLinks() {
    svg
      .select(".links")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
  }

  let previouslyClickedCircle;
  function updateNodes() {
    svg
      .select(".nodes")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => sizeScale(d.value))
      .attr("fill", (d) => d.colour)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("data-name", (d) => d.name)
      .on("click", onClick);
  }

  function ticked() {
    updateLinks();
    updateNodes();
  }

  function onClick() {
    console.log("Click!");
    // Find and update matching circle
    function MatchingCircle(node) {
      const name = d3.select(node).attr("data-name");
      const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
      const otherSvg = d3.select(`#${otherSvgId}`);
      const matchingCircle = otherSvg.select(`circle[data-name="${name}"]`);

      return matchingCircle;
    }

    if (previouslyClickedCircle) {
      d3.select(previouslyClickedCircle).attr("fill", (prevD) => prevD.colour);
      MatchingCircle(previouslyClickedCircle).attr("fill", (d) => d.colour);
    }

    if (previouslyClickedCircle === this) {
      previouslyClickedCircle = null;
    } else {
      d3.select(this).attr("fill", "#ff0000");
      MatchingCircle(this).attr("fill", "#ff0000");
      previouslyClickedCircle = this;
    }
  }
  //updateMatchingCircle(this, d, previouslyClickedCircle);
};

// Function to be called on resize:
function resizeVisualization() {
  const containerWidth = document.querySelector(
    ".visualization-container"
  ).offsetWidth;
  const newWidth = containerWidth;
  const newHeight = newWidth / 3; // Maintain aspect ratio

  d3.select("#diagram1").attr("width", newWidth).attr("height", newHeight);

  d3.select("#diagram2").attr("width", newWidth).attr("height", newHeight);
}

// Listen for resize events
window.addEventListener("resize", resizeVisualization);

createDiagram("diagram1", data);
createDiagram("diagram2", data2);
