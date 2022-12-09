import * as d3 from "d3";

const drawChart = (element, data, total) => {


  const colors = {
    "Illegal Dumping": "#6CC3C4",
    "Rubbish and Recycling": "#D59EFF",
    "Abandoned Vehicle": "#FFC68A",
    "Pothole Repair": "#FF7E87",
    "Graffiti Removal": "#8BBFA2",
    "Vacant Lots": "#9BDBE8",
    "Street Light Outage": "#EDEAE4",
    "Property Maintenance": "#FFD9E3",
    "Street Trees": "#678FD2",
    "Other": "#7F4C70",
  };


  const boxSize = 500;

  d3.select(element).select("svg").remove(); // Remove the old svg
  // Create new svg
  const svg = d3
    .select(element)
    .append("svg")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("height", "500px")
    .attr("width", "100%")
    .attr("viewBox", `0 0 ${boxSize} 800`)
    .append("g")
    .attr("transform", `translate(${boxSize / 2}, 250)`);

  const maxValue = data.reduce((cur, val) => Math.max(cur, val[1].Total), 0);
  const arcGenerator = d3
    .arc()
    .padAngle(0.02)
    .innerRadius(150)
    .outerRadius(200)
    // .outerRadius((d) => {
    //   return 250 - (maxValue - d.data[1].Total);
    // });

  const pieGenerator = d3.pie().value((d) => d[1].Total);

  const arcs = svg.selectAll().data(pieGenerator(data)).enter();

  let tt = document.getElementById("tooltip");
  if (tt) tt.parentElement.removeChild(tt);

  const tooltip = d3.select(element)
          .append('div')
        	.attr('id', 'tooltip')
        	.style('display', 'none')
        ;


        
  function mouseClick(event, d) {
    console.log(d.data[1].Total);
          tooltip
            .text(`${d.data[0]}: ${d.data[1].Total} / ${total}`)
            .style('display', 'inline-block')
            .style('position', 'absolute')
            .style('left', event.layerX + 0 + "px")
            .style('top', event.layerY + 0 + "px")
          ;
        }
        
 

  arcs
    .append("path")
    .on("click", (event, d) => mouseClick(event, d))
    .attr("d", arcGenerator)
    .style("fill", (d, i) => colors[d.data[0]])
    .transition()
    .duration(700)
    .attrTween("d", function (d) {
      const i = d3.interpolate(d.startAngle, d.endAngle);
      return function (t) {
        d.endAngle = i(t);
        return arcGenerator(d);
      };
    })
    ;

    var legendG = svg.selectAll(".legend")
    .data(data)
    .enter().append("g")
    .attr("transform", function(d,i){
      if (i<=4) {
        return "translate(" + (-235) + "," + (i * 55 + 270)+ ")";
      } else {
        return "translate(" + (35) + "," + ((i-5) * 55 + 270)+ ")";
      }
    })
    .attr("class", "legend");   
  
  legendG.append("rect")
    .attr("width", 40)
    .attr("height", 40)
    .attr("fill", function(d, i) {
      return colors[d[0]];
    });
  
  legendG.append("text")
    .text(function(d){
      return  `${d[0]==="Rubbish and Recycling" ? "Missed Trash & Recycling Pickup" : d[0]}`;
    })
    .style("font-size", 20)
    .attr("y", 15)
    .attr("x", 55)
    .attr("fill", '#FFFFFF');

    legendG.append("text")
    .text(function(d){
      return  `${d[1].Total} / ${total}`;
    })
    .style("font-size", 18)
    .attr("y", 40)
    .attr("x", 55)
    .attr("fill", '#FFFFFF');
    
    
};

export default drawChart;
