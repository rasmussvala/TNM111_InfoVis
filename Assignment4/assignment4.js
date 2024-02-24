const strokeColor = "#E0E0E0";

async function main() {
  var { data1, data2 } = await loadData();

  createDiagram("diagram1", data1);
  createDiagram("diagram2", data2);

  handleRangeInputs();
}

main();

function createDiagram(svgId, data) {
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
    .force("charge", d3.forceManyBody().strength(-1500))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().links(data.links).distance(100))
    .force(
      "collide",
      d3.forceCollide().radius((d) => d.radius + 5)
    )
    .alphaDecay(0.02)
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
      .on("click", handleLinkClick)
      .attr("stroke-width", 4);
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
    d3.selectAll("line").attr("stroke", strokeColor).classed("selected", false);
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
          (d) =>
            (d.source.name === source.name && d.target.name === target.name) ||
            (d.source.name === target.name && d.target.name === source.name)
        );
      link.classed("selected", true).attr("stroke", "#ff0000");
      matchingLink.classed("selected", true).attr("stroke", "#ff0000");

      linkTooltip(node1Element, node2Element, linkData.value, svgId);
      linkTooltip(
        matchingNode1,
        matchingNode2,
        matchingLink.data()[0] ? matchingLink.data()[0].value : -1,
        otherSvgId
      );
    }
  }
}

function handleRangeInputs() {
  var lowerSlider = document.querySelector("#lower");
  var upperSlider = document.querySelector("#upper");

  var lowerVal = parseInt(lowerSlider.value);
  var upperVal = parseInt(upperSlider.value);

  upperSlider.oninput = function () {
    lowerVal = parseInt(lowerSlider.value);
    upperVal = parseInt(upperSlider.value);

    if (upperVal < lowerVal + 4) {
      lowerSlider.value = upperVal - 4;

      if (lowerVal == lowerSlider.min) {
        upperSlider.value = 4;
      }
    }
  };

  lowerSlider.oninput = function () {
    lowerVal = parseInt(lowerSlider.value);
    upperVal = parseInt(upperSlider.value);

    if (lowerVal > upperVal - 4) {
      upperSlider.value = lowerVal + 4;

      if (upperVal == upperSlider.max) {
        lowerSlider.value = parseInt(upperSlider.max) - 4;
      }
    }
  };
}

async function loadData() {
  try {
    const fileNames = [
      "./starwars-interactions/starwars-full-interactions-allCharacters.json",
      "./starwars-interactions/starwars-episode-2-interactions-allCharacters.json",
    ];
    const data1 = await d3.json(fileNames[0]);
    const data2 = await d3.json(fileNames[1]);

    var titleNames = document.querySelectorAll(".grid-item h2");

    for (let i = 0; i < titleNames.length; i++) {
      const filename = fileNames[i];
      const episodeMatch = filename.match(/episode-(\d+)/);

      titleNames[i].textContent = episodeMatch
        ? "Episode " + episodeMatch[1]
        : "All Episodes";
    }

    return { data1, data2 };
  } catch (error) {
    throw new Error("Error loading data:", error);
  }
}

function nodeTooltip(node, svgId) {
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip) {
    if (node && node.data()[0]) {
      let data = node.data()[0];
      tooltip.select(".name").text("Name: " + data.name);
      tooltip.select(".value").text("Number of conversations: " + data.value);
    } else {
      tooltip.select(".name").text("Name: ");
      tooltip.select(".value").text("Number of conversations: ");
    }
  }
}

function linkTooltip(node1, node2, value, svgId) {
  var tooltip = d3.select(`#tooltip-${svgId}`);
  if (tooltip.node()) {
    if (node1.data()[0] && node2.data()[0]) {
      tooltip
        .select(".name")
        .text("Names: " + node1.data()[0].name + " & " + node2.data()[0].name);
      tooltip.select(".value").text("Number of conversations: " + value);
    } else if (node1.data()[0] || node2.data()[0]) {
      const nodeName = node1.data()[0]
        ? node1.data()[0].name
        : node2.data()[0].name;
      const nodeValue = node1.data()[0]
        ? node1.data()[0].value
        : node2.data()[0].value;
      tooltip.select(".name").text("Name: " + nodeName);
      tooltip.select(".value").text("Number of conversations: " + nodeValue);
    } else {
      tooltip.select(".name").text("Name: ");
      tooltip.select(".value").text("Number of conversations: ");
    }
  }
}
