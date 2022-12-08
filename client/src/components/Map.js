import React, { useEffect, useState, useCallback } from "react";
import { StaticMap, MapContext, NavigationControl } from "react-map-gl";
import DeckGL, { GeoJsonLayer, FlyToInterpolator } from "deck.gl";
import neighborhoods from "../data/neighborhoods.json";
import center from "@turf/center";
import { polygon } from "@turf/helpers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";

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
const MAP_STYLE = "mapbox://styles/fangk/clajv6ki9001z14nyv0bhi16q";
const NAV_CONTROL_STYLE = {
  position: "absolute",
  bottom: "12vh",
  right: "2vh",
};



const intensity = 1.75;
const threshold = 0.1;
const radiusPixels = 20;

export default function Map({
  data,
  setPointData,
  neighborhood,
  setNeighborhood,
  setDataView,
}) {
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);
  const [activeLayer, setActiveLayer] = useState({phl311:false, heatmp:true});


 

  useEffect(() => {
    if (neighborhood) {
      flyToClick(
        center(polygon(neighborhood.geometry.coordinates[0])).geometry
          .coordinates,
        null,
        13
      );
    }
  }, [neighborhood]);
  

  const flyToClick = useCallback((coords, obj = null, zoom = 15) => {
    if (obj) setPointData(obj);
    setInitialViewState({
      longitude: coords[0],
      latitude: coords[1],
      zoom: zoom,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
      minZoom: 10
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
      getFillColor: [128, 128, 128, 0],
      getLineColor: [255, 255, 255],
      pickable: true,
      onClick: (info, event) => {
        setDataView(true);
        // figure out setNeighborhood logic
        setNeighborhood(info.object);
      },
    }),

    new GeoJsonLayer({
      id: "neighborhood", // layer id
      data: neighborhood, // data formatted as array of objects
      stroked: true,
      getLineWidth: 30,
      getFillColor: [128, 128, 128, 0],
      getLineColor: [152, 231, 231],
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
      onClick: (info, event) => flyToClick(info.coordinate, info.object, 16),
      visible: activeLayer.phl311
    }),

    new HeatmapLayer({
      data,
      id: "heatmp-layer",
      pickable: false,
      getPosition: (d) => d.geometry.coordinates,
      radiusPixels,
      intensity,
      threshold,
      opacity: 1,
      colorRange: [
        [208, 236, 236],
        [108, 195, 196],
        [52, 138, 174],
        [0, 85, 154],
        [0, 44, 79],
      ],
      visible: activeLayer.heatmp
    }),
  ];

  const onViewStateChange = ({viewState}) => {
    if (viewState.zoom>13) {
      setActiveLayer({phl311:true, heatmp:false})
    } else {
      setActiveLayer({phl311:false, heatmp:true})
    }
  }

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      ContextProvider={MapContext.Provider}
      onViewStateChange={onViewStateChange}
    >
      <StaticMap
        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
      />
      <NavigationControl style={NAV_CONTROL_STYLE} />
    </DeckGL>
  );
}
