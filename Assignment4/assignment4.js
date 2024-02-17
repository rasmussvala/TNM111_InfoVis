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
      .on("click", handleLinkClick);
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
      .on("click", handleNodeClick);
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

  function handleNodeClick() {
    const svgId = svg.attr("id");
    const node = d3.select(this);
    const name = node.attr("data-name");
    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);
    const matchingCircle = otherSvg.select(`circle[data-name="${name}"]`);

    if (node.classed("selected")) {
      resetAllNodes();
      nodeTooltip(null, svgId);
      nodeTooltip(null, otherSvgId);
    } else {
      resetAllNodes();
      nodeTooltip(node, svgId);
      nodeTooltip(matchingCircle, otherSvgId);
      node.attr("fill", "#ff0000").classed("selected", true);
      matchingCircle.attr("fill", "#ff0000").classed("selected", true);
    }
  }

  function handleLinkClick() {
    const linkData = d3.select(this).data()[0];
    const source = linkData.source,
      target = linkData.target;

    resetAllNodes();

    const node1Element = svg.select(`circle[data-name="${source.name}"]`);
    const node2Element = svg.select(`circle[data-name="${target.name}"]`);

    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);

    const matchingNode1 = otherSvg.select(`circle[data-name="${source.name}"]`);
    const matchingNode2 = otherSvg.select(`circle[data-name="${target.name}"]`);

    [node1Element, node2Element, matchingNode1, matchingNode2].forEach(
      (node) => {
        node.attr("fill", "#ff0000").classed("selected", true);
      }
    );
    // Find matching link in the other SVG
    const matchingLink = otherSvg
      .selectAll("line")
      .filter(
        (d) => d.source.name === target.name && d.target.name === source.name
      );

    linkTooltip(node1Element, node2Element, linkData.value, svgId);
    linkTooltip(
      matchingNode1,
      matchingNode2,
      matchingLink.data()[0] ? matchingLink.data()[0].value : -1,
      otherSvgId
    );
  }
};

function nodeTooltip(node, svgId) {
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip) {
    if (node && node.data()[0]) {
      let data = node.data()[0];
      tooltip.select(".name").text("Name:" + data.name);
      tooltip.select(".value").text("Value:" + data.value);
    } else {
      tooltip.select(".name").text("");
      tooltip.select(".value").text("");
    }
  }
}

function linkTooltip(node1, node2, value, svgId) {
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip.node()) {
    if (node1.data()[0] && node2.data()[0]) {
      tooltip
        .select(".name")
        .text("Names:" + node1.data()[0].name + " & " + node2.data()[0].name);
      tooltip.select(".value").text("Value:" + value);
    } else if (node1.data()[0] || node2.data()[0]) {
      const nodeName = node1.data()[0]
        ? node1.data()[0].name
        : node2.data()[0].name;
      const nodeValue = node1.data()[0]
        ? node1.data()[0].value
        : node2.data()[0].value;
      tooltip.select(".name").text("Name: " + nodeName);
      tooltip.select(".value").text("Value: " + nodeValue);
    } else {
      tooltip.select(".name").text("");
      tooltip.select(".value").text("");
    }
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
