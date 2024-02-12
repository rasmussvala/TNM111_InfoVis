import d3 from "d3";

const data = d3
  .json("./starwars-interactions/starwars-full-interactions-allCharacters.json")
  .catch(function (error) {
    console.error("Error loading data:", error);
  });

console.log(data);
