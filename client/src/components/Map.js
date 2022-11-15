import React, { useEffect, useState, useCallback } from "react";
import { StaticMap, MapContext, NavigationControl } from "react-map-gl";
import DeckGL, { GeoJsonLayer, FlyToInterpolator } from "deck.gl";
import neighborhoods from "../data/neighborhoods.json";

const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -75.16,
  zoom: 10.5,
  minZoom: 10,
  bearing: 0,
  pitch: 0,
};

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAP_STYLE = "mapbox://styles/fangk/cl9wdl7xy000414mj5xk8899r";
const NAV_CONTROL_STYLE = {
  position: "absolute",
  bottom: 100,
  right: 10,
};

export default function Map({ data, setPointData, setNeighborhood, setDataView }) {
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  const flyToClick = useCallback((coords, obj) => {
    setPointData(obj);
    setInitialViewState({
      longitude: coords[0],
      latitude: coords[1],
      zoom: 15,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });
  });

  const layers = [
    new GeoJsonLayer({
      id: "neighborhoods", // layer id
      data: neighborhoods, // data formatted as array of objects
      opacity: 0.3,
      stroked: true,
      getLineWidth: 20,
      filled: true,
      wireframe: true,
      getFillColor: [128,128,128,0],
      getLineColor: [255, 255, 255],
      pickable: true,
      onClick: (info, event) => {
        setDataView(true);
        // figure out setNeighborhood logic
        setNeighborhood(info.object);
      }
    }),

    new GeoJsonLayer({
      id: "phl311", // layer id
      data: data, // data formatted as array of objects
      // Styles
      filled: true, // filled in point
      stroked: true, // outline stroke
      getLineColor: [75, 162, 164, 60],
      getLineWidth: 10,
      lineWidthMinPixels: 10,
      lineWidthUnits: "pixels",
      //pointRadiusMaxPixles: 10, // point radius scale
      pointRadiusMinPixels: 10, // minimum point radius (px)
      radiusScale: 6,
      getPosition: (d) => d.geometry.coordinates, // coordinates [lng, lat] for each data point
      getFillColor: [255, 255, 255], // rgb color values
      opacity: 0.9, // opacity 0 to 1
      pickable: true,
      onClick: (info, event) => flyToClick(info.coordinate, info.object),
    }),
  ];

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      ContextProvider={MapContext.Provider}
    >
      <StaticMap
        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
      />
      <NavigationControl style={NAV_CONTROL_STYLE} />
    </DeckGL>
  );
}
