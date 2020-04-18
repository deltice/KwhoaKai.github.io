  /* DEFINE DIMENSIONS AND GENERATE SVG */
  var width = window.innerWidth;
  var height = window.innerHeight;
  var margin = {
    top: 75,
    left: 150,
    right: 400,
    bottom: 255
  };

  window.googleDocCallback = function() {
    return true;
  };

  var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "graph");

  svg.append("text")
    .attr("class", "name")
    .attr("id", "loading")
    .attr("x", 50)
    .attr("y", 50)
    .text("loading data!");

  let colorScale = d3.scaleSequential(d3.interpolatePlasma)
    .domain([0, 1]);

  let colorIndex = 1;
  let fmtUser = function(d) {
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

  let getRanks = function(d) {
    for (let i = 0; i < 7; i++) {
      let sortedRank = [];
      d.forEach((user) => {
        sortedRank.push({
          name: user.name,
          pts: user.times[i].rank
        });
      });

      sortedRank.sort(function(a, b) {
        return a.pts - b.pts;
      });

      sortedRank.forEach((user, i) => {
        sortedRank[i] = user.name;
      });

      d.forEach((user) => {
        user.times[i].rank = +sortedRank.indexOf(user.name) + 1;
      });
    }
    return d;
  }
  let csvs = {
    week1: "https://yikaikuo.com/crossword/Week1.csv?raw=true",
    week2: "https://yikaikuo.com/crossword/Week2.csv?raw=true",
    week3: "https://yikaikuo.com/crossword/Week3.csv?raw=true",
    week4: "https://yikaikuo.com/crossword/Week4.csv?raw=true",
    week5: "https://yikaikuo.com/crossword/Week5.csv?raw=true"
  };

  // Data wrangling
  d3.csv(csvs.week2, function(d) {
    // console.log(d);
    return fmtUser(d);
  }).then(function(week2) {
    d3.csv(csvs.week3, function(d) {
      return fmtUser(d)
    }).then(function(week3) {
      d3.csv(csvs.week4, function(d) {
        return fmtUser(d);
      }).then(function(week4) {
        d3.csv(csvs.week5, function(d) {
          return fmtUser(d);
        }).then(function(week5) {
          d3.csv(csvs.week1, function(d) {
            return fmtUser(d);
          }).then(function(week1) {
            d3.select("#colorPalette").on("change", function() {
              colorScale = d3.scaleSequential(d3[this.value]).domain([0, 1]);
              update()
            });
            let cur = 2;
            let weekData = [week1, week2, week3, week4, week5];
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
              .x(function(d) {
                return xScale(d.day) + xScale.bandwidth() / 2
              })

              .y(function(d) {
                return yScale(d.rank)
              });

            let spawnLine = d3.line()
              .x(function(d) {
                return xScale("Friday") + xScale.bandwidth() / 2
              })
              .y(function(d) {
                return yScale(d.rank)
              });
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
              if (newD == null) {
                // console.log("fuck");
              }
              let colInt = 1 / newD.lenght;

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
                  .attr("y", function() {
                    return yScale(newD[i].rank) - 5
                  })
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
                .attr("cx", function(d) {
                  return xScale("Friday") + xScale.bandwidth() * .5
                })
                .attr("cy", function(d) {
                  return yScale(d.rank)
                })
                .attr("r", 4)
                .style("fill", function(d) {
                  return d.fill;
                })
                .attr("opacity", 0)
                .on("mouseover", function(d) {
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
                    .text(function() {
                      // console.log(d);
                      return `${+d.rank}: ${d.name}`;
                    })
                    .attr("x", xScale(d.day) + 55)
                    .attr("text-anchor", "left")
                    .attr("y", yScale(d.rank) - 20);
                })
                .on("mouseout", function() {
                  d3.select(this)
                    .attr("r", 5);
                  svg.selectAll("#popup").remove();
                })
                .transition()
                .duration(function(d, i) {
                  return 800 + (d.rank * 50);
                })
                .attr("cx", function(d) {
                  return xScale(d.day) + xScale.bandwidth() * .5
                })
                .attr("opacity", 1);

              d3.select("#header").text(`Rankings for Week ${cur} of the NYT Mini Competition`);
              // console.log(colorIndex, " end of update");
            }
            d3.select("#loading").remove();
            update();
          });
        });
      });
    });
  });