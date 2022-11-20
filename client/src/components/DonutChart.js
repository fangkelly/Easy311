import React, { useEffect, useRef } from "react";
import drawChart from "./drawChart";

const DonutChart = ({ data, total }) => {
  const ref = useRef(null);


  useEffect(() => {
    if (ref.current) {
      console.log("data ", data)
      drawChart(ref.current, data, total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, data]);

  return (
    <div className="container">
      <div className="graph" ref={ref} />
    </div>
  );
};

export default React.memo(DonutChart);