import React, { useEffect, useRef } from "react";
import drawChart from "./drawChart";

const DonutChart = ({ data, total }) => {
  const ref = useRef(null);


  useEffect(() => {
    if (ref.current) {
      drawChart(ref.current, Object.entries(data), total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, data]);

  return (
      <div className="graph" ref={ref} />
  );
};

export default React.memo(DonutChart);