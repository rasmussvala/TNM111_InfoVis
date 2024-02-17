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

const strokeColor = "#E0E0E0";

const createDiagram = (svgId, data) => {
  // Define SVG and its dimensions
  const svg = d3.select(`#${svgId}`);

  const viewBox = svg.attr("viewBox").split(" ").map(parseFloat);
  const width = viewBox[2];
  const height = viewBox[3];

  // Adjust the svg's dimensions to fill the SVG
  svg.attr("width", "100%").attr("height", "100%");

  const links = svg.append("g");
  const nodes = svg.append("g");

  let zoom = d3
    .zoom()
    .scaleExtent([0.1, 15]) // Set the scale extent
    .on("zoom", handleZoom);

  function handleZoom(e) {
    nodes.attr("transform", e.transform);
    links.attr("transform", e.transform);
  }

  svg.call(zoom);

  const minDomain = d3.min(data.nodes, function (d) {
    return d.value;
  });

  const maxDomain = d3.max(data.nodes, function (d) {
    return d.value;
  });

  const minRadius = 25;
  const maxRadius = 50;

  const sizeScale = d3
    .scaleLinear()
    .domain([minDomain, maxDomain])
    .range([minRadius, maxRadius]);

  // Create and configure the simulation
  let simulation = d3
    .forceSimulation(data.nodes)
    .force(
      "charge",
      d3.forceManyBody().strength((d) => -1000)
    )
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().links(data.links))
    .on("tick", ticked);

  function updateLinks() {
    links
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
      .attr("stroke", strokeColor)
      .attr("stroke", "#E0E0E0")
      .attr("stroke-width", 4)
      .on("click", handleLinkClick);
  }

  function updateNodes() {
    nodes
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
    d3.selectAll("line").attr("fill", strokeColor).classed("selected", false);
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
    const link = d3.select(this);
    const linkData = link.data()[0];
    const source = linkData.source,
      target = linkData.target;

    const otherSvgId = svgId === "diagram1" ? "diagram2" : "diagram1";
    const otherSvg = d3.select(`#${otherSvgId}`);

    if (link.classed("selected")) {
      resetAllNodes();
      console.log("Was selected");
      nodeTooltip(null, svgId);
      nodeTooltip(null, otherSvgId);
    } else {
      resetAllNodes();
      const node1Element = svg.select(`circle[data-name="${source.name}"]`);
      const node2Element = svg.select(`circle[data-name="${target.name}"]`);

      const matchingNode1 = otherSvg.select(
        `circle[data-name="${source.name}"]`
      );
      const matchingNode2 = otherSvg.select(
        `circle[data-name="${target.name}"]`
      );

      [node1Element, node2Element, matchingNode1, matchingNode2].forEach(
        (node) => {
          node.attr("fill", "#ff0000");
        }
      );
      // Find matching link in the other SVG
      const matchingLink = otherSvg
        .selectAll("line")
        .filter(
          (d) => d.source.name === target.name && d.target.name === source.name
        );
      link.classed("selected", true);
      matchingLink.classed("selected", true);

      linkTooltip(node1Element, node2Element, linkData.value, svgId);
      linkTooltip(
        matchingNode1,
        matchingNode2,
        matchingLink.data()[0] ? matchingLink.data()[0].value : -1,
        otherSvgId
      );
    }
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
  const containerWidth =
    document.querySelector(".visualization-svg").offsetWidth;
  const newWidth = containerWidth;
  const newHeight = newWidth / 3; // Maintain aspect ratio

  d3.select("#diagram1").attr("width", newWidth).attr("height", newHeight);

  d3.select("#diagram2").attr("width", newWidth).attr("height", newHeight);
}

// Listen for resize events
window.addEventListener("resize", resizeVisualization);

createDiagram("diagram1", episodes[0]);
createDiagram("diagram2", episodes[1]);
