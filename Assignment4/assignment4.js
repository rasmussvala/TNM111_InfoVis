var width = 400,
  height = 300;

var data = await d3
  .json(
    "./starwars-interactions/starwars-episode-1-interactions-allCharacters.json"
  )
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
      .attr("stroke", "#E0E0E0")
      .on("click", onLinkClick);
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

  const resetAllNodes = () => {
    d3.selectAll("circle")
      .attr("fill", (d) => d.colour)
      .classed("selected", false);
  };

  function onNoceClick() {
    const svgId = svg.attr("id");
    const node = d3.select(this);
    const name = node.attr("data-name");
    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);
    const matchingCircle = otherSvg.select(`circle[data-name="${name}"]`);

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

  function onLinkClick() {
    const link = d3.select(this);
    const linkData = link.data()[0];
    const node1 = linkData.source;
    const node2 = linkData.target;

    resetAllNodes();

    const svgId = svg.attr("id");
    const node1Element = svg.select(`circle[data-name="${node1.name}"]`);
    const node2Element = svg.select(`circle[data-name="${node2.name}"]`);
    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);
    const matchingNode1 = otherSvg.select(`circle[data-name="${node1.name}"]`);
    const matchingNode2 = otherSvg.select(`circle[data-name="${node2.name}"]`);

    node1Element.attr("fill", "#ff0000").classed("selected", true);
    node2Element.attr("fill", "#ff0000").classed("selected", true);
    matchingNode1.attr("fill", "#ff0000").classed("selected", true);
    matchingNode2.attr("fill", "#ff0000").classed("selected", true);

    linkTooltip(node1Element, node2Element, linkData.value, svgId);
    linkTooltip(matchingNode1, matchingNode2, linkData.value, otherSvgId);
  }
};

function nodeTooltip(node, svgId) {
  if (node.node()) {
    let data = node.data()[0];
    var tooltip = d3.select(`#tooltip-${svgId}`);
    if (tooltip) {
      tooltip.select(".name").text("Name:" + data.name);
      tooltip.select(".value").text("Value:" + data.value);
    }
  }
}

function linkTooltip(node1, node2, value, svgId) {
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip) {
    tooltip
      .select(".name")
      .text(
        "Name:" +
          (node1.data()[0] ? node1.data()[0].name : "") +
          (node1.data()[0] && node2.data()[0] ? " & " : "") +
          (node2.data()[0] ? node2.data()[0].name : "")
      );
    tooltip.select(".value").text("Value:" + value);
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

createDiagram("diagram1", data);
createDiagram("diagram2", data2);
