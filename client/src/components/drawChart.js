import * as d3 from "d3";

const drawChart = (element, data, total) => {
  const colors = {
    "Illegal Dumping": "#6CC3C4",
    "Rubbish and Recycling": "#77B6EA",
    "Abandoned Vehicle": "#D59DFF",
    "Pothole Repair": "#FFBCB5",
    "Graffiti Removal": "#8A89C0",
    "Vacant Lots": "#EE7674",
    "Street Light Outage": "#D9594C",
    "Property Maintenance": "#80CFA9",
    "Street Trees": "#C7D66D",
    Other: "#FFC78A",
  };


  const boxSize = 500;

  d3.select(element).select("svg").remove(); // Remove the old svg
  // Create new svg
  const svg = d3
    .select(element)
    .append("svg")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("height", "400px")
    .attr("width", "100%")
    .attr("viewBox", `0 0 ${boxSize} ${boxSize}`)
    .append("g")
    .attr("transform", `translate(${boxSize / 2}, ${boxSize / 4})`);

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
        return "translate(" + (-250) + "," + (i * 50 + 270)+ ")";
      } else {
        return "translate(" + (50) + "," + ((i-4) * 50 + 270)+ ")";
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
      return d[0];
    })
    .style("font-size", 25)
    .attr("y", 25)
    .attr("x", 55)
    .attr("fill", '#FFFFFF');
    
    
};

export default drawChart;
