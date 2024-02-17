var width = 400,
  height = 300;

const data_files = [
  "./starwars-interactions/starwars-episode-1-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-2-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-3-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-4-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-5-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-6-interactions-allCharacters.json",
  "./starwars-interactions/starwars-episode-7-interactions-allCharacters.json",
];

let episodes = [];

for (const url of data_files) {
  try {
    const data = await d3.json(url);
    episodes.push(data);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

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

  const minRadius = 4;
  const maxRadius = 10;

  const sizeScale = d3
    .scaleLinear()
    .domain([minDomain, maxDomain])
    .range([minRadius, maxRadius]);

  // Create and configure the simulation
  let simulation = d3
    .forceSimulation(data.nodes)
    .force("charge", d3.forceManyBody().strength(-15))
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
      })
      .attr("stroke", "#E0E0E0");
  }

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
      .on("click", onNoceClick);
  }

  function ticked() {
    updateLinks();
    updateNodes();
  }

  function onNoceClick() {
    const node = d3.select(this);
    const name = node.attr("data-name");
    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);
    const matchingCircle = otherSvg.select(`circle[data-name="${name}"]`);

    const resetAllNodes = () => {
      d3.selectAll("circle")
        .attr("fill", (d) => d.colour)
        .classed("selected", false);
    };

    if (node.classed("selected")) {
      resetAllNodes();
    } else {
      resetAllNodes();
      nodeTooltip(node, svgId);
      nodeTooltip(matchingCircle, otherSvgId);
      node.attr("fill", "#ff0000").classed("selected", true);
      matchingCircle.attr("fill", "#ff0000").classed("selected", true);
    }
  }
};

function nodeTooltip(node, svgId) {
  let data = node.data()[0];
  console.log(data);
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip) {
    tooltip.select(".name").text("Name:" + data.name);
    tooltip.select(".value").text("Value:" + data.value);
  }
}

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

createDiagram("diagram1", episodes[0]);
createDiagram("diagram2", episodes[1]);
