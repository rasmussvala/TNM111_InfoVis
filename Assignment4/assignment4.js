const strokeColor = "#E0E0E0";
const imgPath = "./public/images/";

async function main() {
  const { data1, data2 } = await loadData();
  const imageDict = await loadImages();

  createDiagrams("diagram1", data1, imageDict);
  createDiagrams("diagram2", data2, imageDict);
}

main();

async function loadImages() {
  try {
    const response = await fetch(`${imgPath}imageList.json`);
    const imageList = await response.json();
    const imageDict = {};
    imageList.forEach((filename) => {
      const imageUrl = `${imgPath}${filename}`;
      imageDict[filename.split(".")[0]] = imageUrl;
    });
    return imageDict;
  } catch (error) {
    console.error("Error fetching image list:", error);
    return {};
  }
}

function createDiagrams(svgId, data, imageDict) {
  const svg = d3.select(`#${svgId}`);
  const viewBox = svg.attr("viewBox").split(" ").map(parseFloat);
  const width = viewBox[2];
  const height = viewBox[3];
  svg.attr("width", "100%").attr("height", "100%");

  const links = svg.append("g");
  const nodes = svg.append("g");
  const zoom = d3.zoom().scaleExtent([0.1, 15]).on("zoom", handleZoom);
  svg.call(zoom);

  const sizeScale = d3
    .scaleLinear()
    .domain([
      d3.min(data.nodes, (d) => d.value),
      d3.max(data.nodes, (d) => d.value),
    ])
    .range([25, 50]);

  createNodes(data);
  createLinks(data);

  const simulation = d3
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

  function handleZoom(e) {
    nodes.attr("transform", e.transform);
    links.attr("transform", e.transform);
  }

  function createLinks(data) {
    const linkUpdate = links.selectAll("line").data(data.links);
    linkUpdate
      .enter()
      .append("line")
      .attr("stroke", strokeColor)
      .attr("stroke-width", 4)
      .on("click", handleLinkClick);
    linkUpdate.exit().remove();
  }

  function updateLinks() {
    links
      .selectAll("line")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  }

  function createNodes(data) {
    const nodeUpdate = nodes.selectAll("circle").data(data.nodes);
    nodeUpdate
      .enter()
      .append("circle")
      .attr("r", (d) => sizeScale(d.value))
      .attr("fill", (d) => selectNodeFill(d, imageDict))
      .attr("data-name", (d) => d.name)
      .on("click", handleNodeClick);
    nodeUpdate.exit().remove();
  }

  function updateNodes() {
    nodes
      .selectAll("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  }

  function ticked() {
    updateLinks();
    updateNodes();
  }

  function selectNodeFill(data, imageDictionary) {
    if (!data) return "#00ff00";
    const name = data.name.toLowerCase().replace(/[\s-]/g, "");
    const imageUrl = imageDictionary[name];
    if (imageUrl) {
      const clipId = `clip-${name}`;
      const clipPath = svg
        .append("clipPath")
        .attr("id", clipId)
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", sizeScale(data.value));
      const pattern = svg
        .append("pattern")
        .attr("id", `pattern-${name}`)
        .attr("patternContentUnits", "objectBoundingBox")
        .attr("width", 1)
        .attr("height", 1);
      pattern
        .append("image")
        .attr("xlink:href", imageUrl)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid slice");
      return `url(#pattern-${name})`;
    } else {
      return data.colour;
    }
  }

  function ticked() {
    updateLinks();
    updateNodes();
  }

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
      node
        .style("stroke", "#ff0000")
        .style("stroke-width", 5)
        .classed("selected", true);
      matchingCircle
        .style("stroke", "#ff0000")
        .style("stroke-width", 5)
        .classed("selected", true);
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
          node
            .style("stroke", "#ff0000")
            .style("stroke-width", 5)
            .classed("selected", true);
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
      link.classed("selected", true).style("stroke", "#ff0000");

      matchingLink.classed("selected", true).style("stroke", "#ff0000");

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

const resetAllNodes = () => {
  d3.selectAll("circle")
    .style("stroke", "none") // Change border color to black
    .classed("selected", false);
  d3.selectAll("line").style("stroke", strokeColor).classed("selected", false);
};

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

/* ------------------ Multi-Slider functionality  ------------------ */

const fillColor = "#0075ff";

function controlFromInput(fromSlider, fromInput, toInput, controlSlider) {
  const [from, to] = getParsed(fromInput, toInput);
  updateDiagram(from, to);

  fillSlider(fromInput, toInput, "#C6C6C6", fillColor, controlSlider);
  if (from > to) {
    fromSlider.value = to;
    fromInput.value = to;
  } else {
    fromSlider.value = from;
  }
}

function controlToInput(toSlider, fromInput, toInput, controlSlider) {
  const [from, to] = getParsed(fromInput, toInput);
  updateDiagram(from, to);

  fillSlider(fromInput, toInput, "#C6C6C6", fillColor, controlSlider);
  setToggleAccessible(toInput);
  if (from <= to) {
    toSlider.value = to;
    toInput.value = to;
  } else {
    toInput.value = from;
  }
}

function controlFromSlider(fromSlider, toSlider, fromInput) {
  const [from, to] = getParsed(fromSlider, toSlider);
  updateDiagram(from, to);

  fillSlider(fromSlider, toSlider, "#C6C6C6", fillColor, toSlider);
  if (from > to) {
    fromSlider.value = to;
    fromInput.value = to;
  } else {
    fromInput.value = from;
  }
}

function controlToSlider(fromSlider, toSlider, toInput) {
  const [from, to] = getParsed(fromSlider, toSlider);
  updateDiagram(from, to);

  fillSlider(fromSlider, toSlider, "#C6C6C6", fillColor, toSlider);
  setToggleAccessible(toSlider);
  if (from <= to) {
    toSlider.value = to;
    toInput.value = to;
  } else {
    toInput.value = from;
    toSlider.value = from;
  }
}

function getParsed(currentFrom, currentTo) {
  const from = parseInt(currentFrom.value, 10);
  const to = parseInt(currentTo.value, 10);
  return [from, to];
}

function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
  const rangeDistance = to.max - to.min;
  const fromPosition = from.value - to.min;
  const toPosition = to.value - to.min;
  controlSlider.style.background = `linear-gradient(
    to right,
    ${sliderColor} 0%,
    ${sliderColor} ${(fromPosition / rangeDistance) * 100}%,
    ${rangeColor} ${(fromPosition / rangeDistance) * 100}%,
    ${rangeColor} ${(toPosition / rangeDistance) * 100}%, 
    ${sliderColor} ${(toPosition / rangeDistance) * 100}%, 
    ${sliderColor} 100%)`;
}

function setToggleAccessible(currentTarget) {
  const toSlider = document.querySelector("#toSlider");
  if (Number(currentTarget.value) <= 0) {
    toSlider.style.zIndex = 2;
  } else {
    toSlider.style.zIndex = 0;
  }
}

function updateDiagram(minSlider, maxSlider) {
  console.log(d3.selectAll("circle"));
  d3.selectAll("circle").style("display", (d) => {
    try {
      if (d.value < minSlider || d.value > maxSlider) {
        return "none";
      }
    } catch (error) {}
  });

  d3.selectAll("line").style("display", (d) => {
    if (
      d.source.value < minSlider ||
      d.source.value > maxSlider ||
      d.target.value < minSlider ||
      d.target.value > maxSlider
    ) {
      return "none";
    }
  });
}

const fromSlider = document.querySelector("#fromSlider");
const toSlider = document.querySelector("#toSlider");
const fromInput = document.querySelector("#fromInput");
const toInput = document.querySelector("#toInput");
fillSlider(fromSlider, toSlider, "#C6C6C6", fillColor, toSlider);
setToggleAccessible(toSlider);

fromSlider.oninput = () => controlFromSlider(fromSlider, toSlider, fromInput);
toSlider.oninput = () => controlToSlider(fromSlider, toSlider, toInput);
fromInput.oninput = () =>
  controlFromInput(fromSlider, fromInput, toInput, toSlider);
toInput.oninput = () => controlToInput(toSlider, fromInput, toInput, toSlider);
