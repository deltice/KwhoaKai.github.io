// SVG dimensions
let width = window.innerWidth;
let height = window.innerHeight;
let margin = {
  top: 75,
  left: 150,
  right: 400,
  bottom: 255
};

let svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "graph");

// Display loading text as CSVs are loaded
svg.append("text")
  .attr("class", "name")
  .attr("id", "loading")
  .attr("x", 50)
  .attr("y", 50)
  .text("loading data!");

let colorScale = d3.scaleSequential(d3.interpolatePlasma)
  .domain([0, 1]);
let colorIndex = 1;

// Formatting user data for usability
let fmtUser = (d) => {
  let f, sa, su, mo, tu, we, th;
  f = +d.fripts;
  sa = +d.satpts + f;
  su = +d.sunpts + sa;
  mo = +d.monpts + su;
  tu = +d.tuepts + mo;
  we = +d.wedpts + tu;
  th = +d.thurpts + we;
  return {
    name: d.Name,
    rank: d.Rank,
    total: d.totalpts,
    times: [{
        rank: f,
        day: "Friday",
        min: d.fritime
      },
      {
        rank: sa,
        day: "Saturday",
        min: d.sattime
      },
      {
        rank: su,
        day: "Sunday",
        min: d.suntime
      },
      {
        rank: mo,
        day: "Monday",
        min: d.montime
      },
      {
        rank: tu,
        day: "Tuesday",
        min: d.tuetime
      },
      {
        rank: we,
        day: "Wednesday",
        min: d.wedtime
      },
      {
        rank: th,
        day: "Thursday",
        min: d.thurtime
      }
    ]
  }
}

// Calculates player rankings given a week of data
let getRanks = (d) => {
  for (let i = 0; i < 7; i++) {
    let sortedRank = [];
    d.forEach((user) => {
      sortedRank.push({
        name: user.name,
        pts: user.times[i].rank
      });
    });

    // sort by rank
    sortedRank.sort((a, b) => a.pts - b.pts);
    sortedRank.forEach((user, i) => {
      sortedRank[i] = user.name;
    });

    d.forEach((user) => {
      user.times[i].rank = +sortedRank.indexOf(user.name) + 1;
    });
  }
  return d;
}

const csvUrls = [
  "https://yikaikuo.com/crossword/Week1.csv?raw=true",
  "https://yikaikuo.com/crossword/Week2.csv?raw=true",
  "https://yikaikuo.com/crossword/Week3.csv?raw=true",
  "https://yikaikuo.com/crossword/Week4.csv?raw=true",
  "https://yikaikuo.com/crossword/Week5.csv?raw=true"
];

let allData = [];
csvUrls.forEach((week) => {
  let promise = d3.csv(week, (d) => fmtUser(d)).then((data) => data);
  allData.push(promise);
});

Promise.all(allData).then((values) => drawGraph(values));

// Display data as a line chart
function drawGraph(weekData) {
  // Set the initial week to week two
  let cur = 2;

  // Get the player rankings for each week
  weekData.forEach((week) => {
    return getRanks(week);
  });

  let numPlayer = weekData[cur].length;
  d3.select("#week").on("change", function() {
    cur = this.value;
    numPlayer = weekData[cur - 1].length;
    transitionAxis();
    update();
  });

  let days = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  let xScale = d3.scaleBand()
    .domain(days)
    .rangeRound([margin.left, width - margin.right])
    .padding(0.5);

  let xAxis = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height-margin.bottom})`)
    .call(d3.axisBottom().scale(xScale));

  let yScale = d3.scaleLinear()
    .domain([numPlayer, 1])
    .range([height - margin.bottom, margin.top]);

  let yAxis = svg.append("g")
    .attr("class", "axis")
    .attr("id", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft().scale(yScale));

  let drawLine = d3.line()
    .x((d) => xScale(d.day) + xScale.bandwidth() / 2)
    .y((d) => yScale(d.rank));

  let spawnLine = d3.line()
    .x((d) => xScale("Friday") + xScale.bandwidth() / 2)
    .y((d) => yScale(d.rank));

  let yAxisLabel = svg.append("text")
    .attr("class", "axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("x", -height * .4)
    .attr("y", margin.left * .7)
    .attr("text-anchor", "middle")
    .text("Rank");

  function transitionAxis() {
    yScale.domain([numPlayer, 1]);

    let yaxis = svg.select("#y-axis");
    yaxis
      .transition()
      .duration(500)
      .call(d3.axisLeft().scale(yScale));
  }

  // Draw the graph 
  function update() {
    d3.selectAll("path.nameLine").remove();
    d3.select("svg").selectAll(".name").remove();
    d3.select("svg").selectAll("circle").remove();
    colorIndex = 0;
    let newD = weekData[cur - 1];
    let allCircles = [];

    newD.forEach((player, i) => {
      let times = newD[i].times;
      // Draw line 
      let line = svg.append("path")
        .datum(times)
        .attr("fill", "none")
        .attr("class", "nameLine")
        .attr("stroke", colorScale(colorIndex))
        .attr("stroke-width", 3)
        .attr("d", spawnLine)
        .attr("opacity", 0)
        .transition()
        .duration(800 + (i * 50))
        .attr("opacity", 1)
        .attr("d", drawLine);

      // Add word 
      let name = svg.append("text")
        .attr("class", "name")
        .style("fill", colorScale(colorIndex))
        .text(`${i+1}: ${player.name}`)
        .attr("x", xScale("Friday") + xScale.bandwidth() * .5)
        .attr("y", () => yScale(newD[i].rank) - 5)
        .attr("opacity", 0)
        .transition()
        .duration(800 + (i * 50))
        .attr("x", xScale("Thursday") + xScale.bandwidth() * .7)
        .attr("text-anchor", "left")
        .attr("opacity", 1);

      // Add data points to be drawn to total array
      player.times.forEach((d) => allCircles.push({
        name: player.name,
        day: d.day,
        rank: d.rank,
        fill: colorScale(colorIndex)
      }));
      colorIndex += 0.06;
    });

    // Add Circles for each day 
    svg.selectAll("circle")
      .data(allCircles)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale("Friday") + xScale.bandwidth() * .5)
      .attr("cy", (d) => yScale(d.rank))
      .attr("r", 4)
      .style("fill", (d) => d.fill)
      .attr("opacity", 0)
      .on("mouseover", function (d) {
        let hovered = d3.select(this);
        hovered
          .attr("r", 8);

        svg.append("rect")
          .attr("id", "popup")
          .attr("x", xScale(d.day) + 50)
          .attr("y", yScale(d.rank) - 46)
          .attr("width", 200)
          .attr("height", 40)
          .attr("fill", "white")
          .attr("stroke", "black");

        svg.append("text")
          .attr("class", "name")
          .attr("id", "popup")
          .style("fill", d.fill)
          .text(`${+d.rank}: ${d.name}`)
          .attr("x", xScale(d.day) + 55)
          .attr("text-anchor", "left")
          .attr("y", yScale(d.rank) - 20);
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("r", 5);
        svg.selectAll("#popup").remove();
      })
      .transition()
      .duration((d, i) => 800 + (d.rank * 50))
      .attr("cx", (d) => xScale(d.day) + xScale.bandwidth() * .5)
      .attr("opacity", 1);

    d3.select("#header").text(`Rankings for Week ${cur} of the NYT Mini Competition`);
  }
  d3.select("#loading").remove();
  update();
};