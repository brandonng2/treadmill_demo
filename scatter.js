import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define dimensions and margins for the chart
const width = 900,
  height = 600,
  margin = { top: 70, right: 120, bottom: 70, left: 80 };

// Add event listener to the Calculate button
document.addEventListener("DOMContentLoaded", function () {
  const calculateBtn = document.querySelector(".predict-btn");
  const resetBtn = document.querySelector(".reset-btn");

  // Set up the calculate button
  calculateBtn.addEventListener("click", function () {
    // For gender, convert dropdown value to numeric format where 1=female, 0=male
    const genderElem = document.getElementById("gender");
    const gender = genderElem.value === "female" ? 1 : 0;

    const age = parseFloat(document.getElementById("age").value);
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseFloat(document.getElementById("height").value);

    // Validate inputs
    if (isNaN(age) || isNaN(weight) || isNaN(height)) {
      alert("Please enter valid numeric values for age, weight, and height.");
      return;
    }

    console.log(
      `Processing: Gender=${gender} (${
        gender === 1 ? "Female" : "Male"
      }), Age=${age}, Weight=${weight}, Height=${height}`
    );

    // Create the scatter plot with the provided inputs
    createScatterPlot(gender, age, weight, height);
  });

  // Set up the reset button
  resetBtn.addEventListener("click", function () {
    // Clear input fields
    document.getElementById("age").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("height").value = "";

    // Reset the visualization to show placeholder
    svg.selectAll(".point").remove();
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    svg.selectAll(".grid-lines").remove();
    svg.selectAll(".legend").remove();

    // Add placeholder text again
    svg.selectAll(".placeholder-text").remove();
    svg
      .append("text")
      .attr("class", "placeholder-text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .text("Enter your information and click 'Calculate' to view data");
  });
});

// Working dimensions inside the chart
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Create SVG canvas with responsive sizing
const svg = d3
  .select("#scatter_chart")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("visibility", "hidden")
  .style("background-color", "rgba(255, 255, 255, 0.9)")
  .style("padding", "10px")
  .style("border-radius", "5px")
  .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
  .style("position", "absolute")
  .style("z-index", "1000");

// Define demographic bins
const male_age_bins = [
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 65],
];
const male_weight_bins = [
  [40, 64],
  [65, 74],
  [75, 84],
  [85, 140],
];
const male_height_bins = [
  [155, 169],
  [170, 179],
  [180, 205],
];
const female_age_bins = [
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 60],
];
const female_weight_bins = [
  [40, 54],
  [55, 69],
  [70, 110],
];
const female_height_bins = [
  [145, 159],
  [160, 169],
  [170, 205],
];

// Add chart title
svg
  .append("text")
  .attr("class", "chart-title")
  .attr("x", innerWidth / 2)
  .attr("y", -40)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .attr("font-weight", "bold")
  .text("Average Respiratory Exchange Ratio Over Time and Speed");

// Add axes labels
svg
  .append("text")
  .attr("class", "x-label")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight + 40)
  .attr("text-anchor", "middle")
  .attr("font-size", "14px")
  .text("Time (seconds)");

svg
  .append("text")
  .attr("class", "y-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -innerHeight / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .attr("font-size", "14px")
  .text("Speed (km/h)");

// Set background color
svg
  .append("rect")
  .attr("width", innerWidth)
  .attr("height", innerHeight)
  .attr("fill", "#EAEAF2");

// Add placeholder text until calculation
svg
  .append("text")
  .attr("class", "placeholder-text")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight / 2)
  .attr("text-anchor", "middle")
  .attr("font-size", "16px")
  .text("Enter your information and click 'Calculate' to view data");

// Helper function to determine if a value falls within any of the bin ranges
function fallsInBin(value, bins) {
  return bins.some((bin) => value >= bin[0] && value <= bin[1]);
}

// Helper function to determine which bin a value falls into
function getBinIndex(value, bins) {
  for (let i = 0; i < bins.length; i++) {
    if (value >= bins[i][0] && value <= bins[i][1]) {
      return i;
    }
  }
  return -1; // Not in any bin
}

// Helper function to filter data based on demographic inputs
function filterDataByDemographics(data, gender, age, weight, height) {
  const isFemale = gender === 1 || gender === "1" || gender === "female";

  // Determine which bins to use based on gender
  const ageBins = isFemale ? female_age_bins : male_age_bins;
  const weightBins = isFemale ? female_weight_bins : male_weight_bins;
  const heightBins = isFemale ? female_height_bins : male_height_bins;

  // Get bin indices for the input demographics
  const ageBinIndex = getBinIndex(age, ageBins);
  const weightBinIndex = getBinIndex(weight, weightBins);
  const heightBinIndex = getBinIndex(height, heightBins);

  // If any value doesn't fall within the defined bins, return empty dataset
  if (ageBinIndex === -1 || weightBinIndex === -1 || heightBinIndex === -1) {
    console.log(
      `Demographics out of range - Age: ${ageBinIndex}, Weight: ${weightBinIndex}, Height: ${heightBinIndex}`
    );
    return [];
  }

  // Get the specific bin ranges that the user falls into
  const targetAgeBin = ageBins[ageBinIndex];
  const targetWeightBin = weightBins[weightBinIndex];
  const targetHeightBin = heightBins[heightBinIndex];

  console.log(
    `Selected bins for ${
      isFemale ? "Female" : "Male"
    } - Age: [${targetAgeBin}], Weight: [${targetWeightBin}], Height: [${targetHeightBin}]`
  );

  // Filter data to match gender and the specific bins
  return data.filter((d) => {
    const dataIsFemale = d.Gender === 1 || d.Gender === "1";
    return (
      dataIsFemale === isFemale &&
      d.Age >= targetAgeBin[0] &&
      d.Age <= targetAgeBin[1] &&
      d.Weight >= targetWeightBin[0] &&
      d.Weight <= targetWeightBin[1] &&
      d.Height >= targetHeightBin[0] &&
      d.Height <= targetHeightBin[1]
    );
  });
}

// Function to find the appropriate model weights based on demographics
function findModelWeights(gender, age, weight, height, modelWeights) {
  // Parse key format: gender_age_weight_height
  function parseWeightKey(key) {
    const parts = key.split("_");
    const gender = parseInt(parts[0]); // 0 for male, 1 for female
    const ageBin = JSON.parse(parts[1]); // [min, max]
    const weightBin = JSON.parse(parts[2]); // [min, max]
    const heightBin = JSON.parse(parts[3]); // [min, max]

    return { gender, ageBin, weightBin, heightBin };
  }

  // Find the matching demographic bin key
  let matchingKey = null;
  for (const key of Object.keys(modelWeights.Weights)) {
    const { gender: g, ageBin, weightBin, heightBin } = parseWeightKey(key);

    if (
      g === gender &&
      age >= ageBin[0] &&
      age <= ageBin[1] &&
      weight >= weightBin[0] &&
      weight <= weightBin[1] &&
      height >= heightBin[0] &&
      height <= heightBin[1]
    ) {
      matchingKey = key;
      break;
    }
  }

  if (matchingKey) {
    console.log(`Found matching model: ${matchingKey}`);
    return {
      key: matchingKey,
      weights: modelWeights.Weights[matchingKey],
      rmse: modelWeights.RMSE[matchingKey],
    };
  } else {
    console.log(
      `No matching model found for gender=${gender}, age=${age}, weight=${weight}, height=${height}`
    );
    return null;
  }
}

// Calculate RER based on linear model: RER = intercept + time*coefficient + speed*coefficient
function calculateRER(weights, time, speed) {
  // Check if weights is an array or an object with named fields
  if (Array.isArray(weights)) {
    return weights[0] + weights[1] * time + weights[2] * speed;
  } else {
    return weights.yintercept + weights.time * time + weights.speed * speed;
  }
}

// Function to create/update the scatter plot
function createScatterPlot(gender, age, weight, height) {
  console.log(
    `Creating scatter plot for: Gender=${gender}, Age=${age}, Weight=${weight}, Height=${height}`
  );

  // Remove placeholder text
  svg.select(".placeholder-text").remove();

  // Clear any existing plot elements
  svg.selectAll(".point").remove();
  svg.selectAll(".x-axis").remove();
  svg.selectAll(".y-axis").remove();
  svg.selectAll(".grid-lines").remove();
  svg.selectAll(".legend").remove();
  svg.selectAll("defs").remove();

  // Load and process the data
  Promise.all([d3.csv("merged.csv")])
    .then(([data]) => {
      console.log("Raw data sample:", data.slice(0, 3));

      // Filter and parse numeric values
      data = data.filter((d) => d && typeof d === "object");

      data.forEach((d) => {
        d.RER = +d.RER;
        d.time = +d.time || +d.Time || 0;
        d.Speed = +d.Speed;
        d.Age = +d.Age;
        d.Weight = +d.Weight;
        d.Height = +d.Height;
        // Ensure Gender is properly parsed as a number (0 or 1)
        d.Gender = d.Gender === "1" || d.Gender === 1 ? 1 : 0;
      });

      // Filter out invalid entries
      data = data.filter(
        (d) => !isNaN(d.RER) && !isNaN(d.time) && !isNaN(d.Speed)
      );

      // Filter data based on demographic inputs
      const filteredData = filterDataByDemographics(
        data,
        gender,
        age,
        weight,
        height
      );

      console.log(`Filtered data by demographics: ${filteredData.length} rows`);

      if (filteredData.length === 0) {
        svg
          .append("text")
          .attr("class", "placeholder-text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight / 2)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .text("No matching data for your demographic profile");
        return;
      }

      console.log(
        `Found ${filteredData.length} data points in matching demographic bin`
      );

      // Create time bins (30 second intervals)
      const timeMax = d3.max(filteredData, (d) => d.time);
      const timeBinSize = 30;
      const timeBins = d3.range(0, timeMax + timeBinSize, timeBinSize);

      // Create speed bins (0.5 km/h intervals)
      const speedMin = 0; // Set to 0 as per request
      const speedMax = Math.ceil(d3.max(filteredData, (d) => d.Speed) * 1.05); // Add 5% margin
      const speedBinSize = 0.5;
      const speedBins = d3.range(
        speedMin,
        speedMax + speedBinSize,
        speedBinSize
      );

      // Bin the data
      filteredData.forEach((d) => {
        d.time_bin =
          Math.floor(d.time / timeBinSize) * timeBinSize + timeBinSize / 2;
        d.speed_bin =
          Math.floor((d.Speed - speedMin) / speedBinSize) * speedBinSize +
          speedMin +
          speedBinSize / 2;
      });

      // Group data by time bin and speed bin to calculate average RER
      const binnedData = Array.from(
        d3.group(
          filteredData,
          (d) => d.time_bin,
          (d) => d.speed_bin
        ),
        ([time_bin, speedMap]) => {
          return Array.from(speedMap, ([speed_bin, values]) => {
            const avgRER = d3.mean(values, (d) => d.RER);
            return {
              time_bin,
              speed_bin,
              RER: avgRER,
              count: values.length,
            };
          });
        }
      ).flat();

      // Set up scales
      const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(binnedData, (d) => d.time_bin) + timeBinSize / 2])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([0, speedMax]) // Start at 0 as requested
        .range([innerHeight, 0]);

      // Create color scale for RER values
      const rerExtent = d3.extent(binnedData, (d) => d.RER);

      const colorScale = d3
        .scaleSequential()
        .domain([rerExtent[0], rerExtent[1]])
        .interpolator(d3.interpolateRdYlBu)
        .clamp(true);

      // Reverse the color scale to match RdYlBu_r in Python
      const reversedColorScale = (d) =>
        colorScale(rerExtent[1] - (d - rerExtent[0]));

      // Create defs for gradients
      const defs = svg.append("defs");

      // Create axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      // Add X axis
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis);

      // Add Y axis
      svg.append("g").attr("class", "y-axis").call(yAxis);

      // Add grid
      svg
        .append("g")
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(yScale.ticks(10))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3);

      svg
        .append("g")
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(xScale.ticks(10))
        .enter()
        .append("line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3);

      // Calculate default radius for each point based on count
      const calculateRadius = (count) => Math.min(5, 5 + Math.sqrt(count));

      // Add color stops to match the RdYlBu_r colormap for the legend
      const colorStops = d3.range(0, 1.01, 0.1).map((t) => {
        const rer = d3.quantile(rerExtent, t);
        return {
          offset: `${t * 100}%`,
          color: reversedColorScale(rer),
        };
      });

      // Function to add color legend
      function addColorLegend() {
        // Add color legend for RER values
        const legendWidth = 30;
        const legendHeight = innerHeight;

        const legendScale = d3
          .scaleLinear()
          .domain(rerExtent)
          .range([legendHeight, 0]);

        const legendAxis = d3
          .axisRight(legendScale)
          .ticks(8)
          .tickFormat(d3.format(".2f"));

        const legend = svg
          .append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${innerWidth + 20}, 0)`);

        // Create gradient for legend
        const linearGradient = defs
          .append("linearGradient")
          .attr("id", "rer-gradient")
          .attr("x1", "0%")
          .attr("y1", "100%")
          .attr("x2", "0%")
          .attr("y2", "0%");

        // Add color stops to match the RdYlBu_r colormap
        colorStops.forEach((stop) => {
          linearGradient
            .append("stop")
            .attr("offset", stop.offset)
            .attr("stop-color", stop.color);
        });

        // Draw the gradient rectangle
        legend
          .append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#rer-gradient)");

        // Add the legend axis
        legend
          .append("g")
          .attr("transform", `translate(${legendWidth}, 0)`)
          .call(legendAxis);

        // Add legend title
        legend
          .append("text")
          .attr("transform", "rotate(90)")
          .attr("x", legendHeight / 2)
          .attr("y", -legendWidth - 45)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text("Average RER (VCO2/VO2)");
      }

      // Add scatter plot points with appearance animation
      svg
        .selectAll(".point")
        .data(binnedData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d) => xScale(d.time_bin))
        .attr("cy", (d) => yScale(d.speed_bin))
        .attr("r", 0) // Start with radius 0 for animation
        .attr("fill", (d) => reversedColorScale(d.RER))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", (d) => Math.min(12, 7 + Math.sqrt(d.count)))
            .attr("opacity", 1);

          tooltip
            .style("visibility", "visible")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`).html(`
            <strong>Time:</strong> ${d.time_bin} seconds<br>
            <strong>Speed:</strong> ${d.speed_bin.toFixed(1)} km/h<br>
            <strong>Average RER:</strong> ${d.RER.toFixed(3)}<br>
            <strong>Data points:</strong> ${d.count}
          `);
        })
        .on("mouseout", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", (d) => calculateRadius(d.count))
            .attr("opacity", 0.8);

          tooltip.style("visibility", "hidden");
        })
        .transition() // Animate points appearance
        .duration(1000)
        .delay((d, i) => i * 10)
        .attr("r", (d) => calculateRadius(d.count))
        .on("end", function (d, i) {
          // After points animation is complete, add the color legend
          if (i === binnedData.length - 1) {
            addColorLegend();
          }
        });
    })
    .catch((error) => {
      console.error("Error loading or processing data:", error);
      svg
        .append("text")
        .attr("class", "placeholder-text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Error loading data: " + error.message);
    });
}
