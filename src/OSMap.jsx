"use strict";

import React from 'react';
import {Feature, Map, View, Collection} from 'ol';
import {OSM, XYZ, Vector} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {LineString,  Point } from 'ol/geom.js';
import {Style, Stroke, Icon, Text, RegularShape, Fill, Circle} from 'ol/style.js';
import {transform} from 'ol/proj.js';



class OSMap extends React.Component {

    constructor(props) {
        super(props);
        this.app = props.app;
        this.mapid = props.mapid;

        this.arrow = 'data:image/svg+xml;utf8,<svg width="14px" height="10px" version="1.1" xmlns="http://www.w3.org/2000/svg">'
            + '<path d="M0,0 L0,10 L14,5 L0,0 Z"/>'
            + '</svg>';
        this.arrow2 = 'data:image/svg+xml;utf8,<svg width="15px" height="8px" version="1.1" xmlns="http://www.w3.org/2000/svg">'
            + '<path d="M0,0 L0,8 L7,4 L0,0 Z"/>'
            + '<path d="M8,0 L8,8 L15,4 L8,0 Z"/>'
            + '</svg>';
        this.arrow3 = 'data:image/svg+xml;utf8,<svg width="20px" height="6px" version="1.1" xmlns="http://www.w3.org/2000/svg">'
            + '<path d="M0,0 L0,8 L6,4 L0,0 Z"/>'
            + '<path d="M7,0 L7,8 L13,4 L7,0 Z"/>'
            + '<path d="M14,0 L14,8 L20,4 L14,0 Z"/>'
            + '</svg>';


        this.portLLHDGStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "red",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll hdg',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"red"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"red"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 0.5

            }
        };
        this.portLLCOGStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "red",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll track',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"red"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow2,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"red"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 0.5

            }
        };
        this.stbdLLHDGStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll hdg',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"green"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"green"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 0.5

            }
        };
        this.stbdLLCOGStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll track',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"green"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow2,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"green"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 0.5

            }
        };
        this.tideStyle = {
            style: [ 
                new Style({
                    stroke: new Stroke({
                        color: "cyan",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'tide',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"cyan"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"cyan"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 1

            }
        };

        this.twdStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "blue",
                        width: 2
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'twd',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"blue"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"blue"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 1

            }
        };
        this.tideVectorStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "cyan",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'tide',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"cyan"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow3,
                      fill: new Fill({ color:"cyan"}),
                      anchor: [0.75, 0.5],
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 0.5
            }
        };
        this.gwdStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'gwd',
                        scale: 1,
                        textAlign: 'center',
                        font: 'normal 12px Arial',
                        fill: new Fill({ color:"green"}),
                        placement: 'line',
                        textBaseline: "bottom"

                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"green"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 1
            }
        };

        this.btwPortLLStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "red",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll track',
                        scale: 1,
                        textAlign: 'center',
                        font: 'normal 12px Arial',
                        fill: new Fill({ color:"red"}),
                        placement: 'line',
                        textBaseline: "bottom"

                    })
                }) 
            ]
        };
        this.btwPortLLStyle2 = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "red",
                        width: 1
                    })
                }) 
            ]
        };
        this.btwStbdLLStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'll track',
                        scale: 1,
                        textAlign: 'center',
                        font: 'normal 12px Arial',
                        fill: new Fill({ color:"green"}),
                        placement: 'line',
                        textBaseline: "bottom"

                    })
                }) 
            ]
        };
        this.btwStbdLLStyle2 = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }) 
            ]
        };
        this.btwStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "black",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'btw',
                        textAlign: 'center',
                        placement: 'line',
                        fill: new Fill({ color:"black"}),
                        font: 'normal 12px Arial',
                        textBaseline: "bottom"
                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      fill: new Fill({ color:"black"}),
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 1
            }
        };
        this.cogStyle = {
            style: [
                new Style({
                    stroke: new Stroke({
                        color: "green",
                        width: 1
                    })
                }),
                new Style({
                    text: new Text({
                        text: 'cog',
                        textBaseline: 'bottom',
                        font: 'normal 12px Arial',
                        textAlign: 'center',
                        placement: 'line'

                    })
                }),
                new Style({
                    image: new Icon({
                      src: this.arrow,
                      anchor: [0.75, 0.5],
                      rotateWithView: true
                    })
                })

            ],
            arrow: {
                id: 2,
                offset: 1
            }
        };

        var shipImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAtCAYAAABMIFARA"+
        "AAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3"+
        "NjYXBlLm9yZ5vuPBoAAARkSURBVEjHrZbZbxtVFMbP3Fm9Jrbj2EJpklIIgSBB05AFNVKF0iCWh1JVSlG"+
        "QVfF38FqJl0rwxluLQCpUoqgIJF55oKqikMILDQml0CZ2s7nxNjOeOwtn7HgyEy+x0x7Jtnx95zffueec"+
        "b8xYlgXPKrjDNoyNjU2zlvUjY1lzd5aWfm61lxwCOiNa1k9nNzJh3jS/mxwdnT0SDEGjIsAPF8tyaKSwC/"+
        "P3V/yCad6cOnVquiMYgkQfIbfO8UwwaRqVtV5VgdSDvwMcAvH3YNuwoCBceVEUYscJw7jXj5VKMJ7d6Qrq"+
        "+hdtwSYnJl62TPPj2aDP516v1fz9zDrPW+YHqG7iUFjM7//0dLSbF12i3M2DhYBz6bS/i9LLLWF4t96Cqr"+
        "49Gg62bJnxJ1kwGWYK9w82hfXHYpfHensYkTQuck0hh43+7uaGFKH0k4YwvAu7Xch/9GZvXGhnJma2t0iZ"+
        "kIt4nVQHO5FMvpUIhiAs8G2NTsAw4CWsLsbpOpjAcR8OxyLes2owt+6V8dxuIErphTrYbqEwOxTZh7WT6u"+
        "v5vF2IdzwwzDuUV5REf1e4I5d4rlwGNIAYXt/jwF4bHJwbSiTMAw3fVryRz3PoKjMOjGfZ6YFIN9vqfJqt"+
        "jxSLYkTXzzowRdOOR3wSexRDjFMKqOz5fVi53Bf1+5uqMFukH9c00Bmmz3HaUlmNVmBUc3WFBXekADwa6AH"+
        "phWGA3C4MZDIw8+B+pWUsF0wlJO7AcB4DETQJ1QX7hfAwkZqHK5cuVb6rqgq3btyA7z//DFK/3923K2xeVC"+
        "bZE0TwLSCwHMO65jGv62AkkjC/B7JDkiSYS6WAGXkVCpy3t7t13VaRJMN9fcPxUMhTuCzV4cTQUMMzeuXkS"+
        "dgSRU9Vk1olo2Mk7PPFJcE72z04n6vL9xrCfltYgDBW0B0hw7DTChFV02QDDc9j2ywL3OYGfH31Krifq9ev"+
        "XQNp5S/o0TTPfjwzexPlcrJcFNn6FjsDJtz+6ku4+c11iIa7oJTLQf/6GpxfWa5rHVqDpbPZIppiXSPZC5M"+
        "qPkAy6yA/zkCwWIKgVV0/GHswjVDDKOOrqUnYF+PzElpNLa12ArXfqW4Y8DRBqxOi2TCNdgBrlAIWgHGUHa"+
        "xmp6G7lWGazFOmWVW2uLioaFgA3Tx6qnmuMl87lTIEBGF3R5bbOh+oB9l+pqCocgUm8vy/m4XikVJM45xK"+
        "pvnQMUdCyN2tYqmj/6O1zesIwwNbdmA5RVnckku03VZwxxpaU5FllxxYQVH+TD/JHak//pMkWSHkngPDWH1"+
        "cyEOrkWqm+qHPp9vXOzCsxKasUWK6vL3dVDcFQcCPf9zKQOK47ayidpSibd+k2haaB8YSZnWrQa95FB7IN4O"+
        "V9O21hQem6MavC4/WaBEtuYiDL5sWKPZTCSelTFhQ0EBlVFLCl63IbtbbEXyWM8wfztnWbNn+u47Jf4s3n7J"+
        "sDfayVdHC1E6NOVAQ3rSWEfweppnzwJ5F/A+qtt/7PxWM/AAAAABJRU5ErkJggg=="


        this.boatStyle = [
            new Style({
                image: new Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 0.46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.75,
                    rotation: 0,
                    src: shipImg,
                    scale: 0.75
                }))
            })
        ];




        //heading vector

        // route markers 
        // route lines
        // marks
        // port layline
        // stbd layline
        // boat - wp
        // bot - intersect
        // intersect - mark
        // tidal vectro - mark
        // tical vector on boat
        // gwvector on boat
        // twvector on boat


    }


    componentDidMount() {

            console.log("Attaching OpenSeamap ",this.mapid);
            this.map = new Map({
                target: this.mapid,
                layers: [
                    new TileLayer ({
                        source: new OSM()
                    }),
                    new TileLayer ({
                        source: new XYZ({
                            url: 'https://t1.openseamap.org/seamark/{z}/{x}/{y}.png'
                        })
                    })
                    ],
                view: new View({
                      center: this.toOLCoord({ lat:50.78783333, lon:-1.265}),
                      zoom: 11
                    })
            });


            this.tacticalOverlay = new VectorLayer({
                title: 'Tactical',
                source: new Vector({
                    features: new Collection(),
                    useSpatialIndex: false // optional, might improve performance
                }),
                //style: overlayStyle,
                updateWhileAnimating: true,
                // optional, for instant visual feedback
                updateWhileInteracting: true // optional, for instant visual feedback
            });
            this.map.addLayer(this.tacticalOverlay);

            this.vesselOverlay = new VectorLayer({
                title: 'Vessel',
                source: new Vector({
                    features: new Collection(),
                    useSpatialIndex: false // optional, might improve performance
                }),
                //style: overlayStyle,
                updateWhileAnimating: true,
                // optional, for instant visual feedback
                updateWhileInteracting: true // optional, for instant visual feedback
            });
            this.map.addLayer(this.vesselOverlay);


            this.marksOverlay = new VectorLayer({
                title: 'Marks',
                source: new Vector({
                    features: new Collection(),
                    useSpatialIndex: false // optional, might improve performance
                }),
                //style: overlayStyle,
                updateWhileAnimating: true,
                // optional, for instant visual feedback
                updateWhileInteracting: true // optional, for instant visual feedback
            });
            this.map.addLayer(this.marksOverlay);

            this.routeOverlay = new VectorLayer({
                title: 'Route',
                map: this.map,
                source: new Vector({
                    features: new Collection(),
                    useSpatialIndex: false // optional, might improve performance
                }),
                //style: overlayStyle,
                updateWhileAnimating: true,
                // optional, for instant visual feedback
                updateWhileInteracting: true // optional, for instant visual feedback
            });
            this.map.addLayer(this.routeOverlay);

            this.app.addStateListener(this);

            console.log("Layers ", this.map.getLayers());
            this.update(this.app.state);
    }



    componentWillReceiveProps(nextProps) {
    }

    componentWillUnmount() {
        this.app.removeStateListener(this);
        this.marksShowing = false;
        this.map = undefined;
    }

    toOLCoord(latlon) {
        return transform([ latlon.lon, latlon.lat], 'EPSG:4326', 'EPSG:3857');
    }

    plotRoute(route, routeVersion, nextmark) {
        if ( route == undefined ) {
            return;
        }
        if ( this.map !== undefined && this.plottedVersion !== routeVersion) {
            var source = this.routeOverlay.getSource();
            source.clear(true);

            var routeLine = new LineString([], 'XY');
            var styles = []
            var routeFeature = new Feature({
                geometry: routeLine,
                name: 'Route'
            });




            var lastWP;
            for (var i = 0; i < route.length; i++) {
                var mark = route[i];
                if ( mark.wp !== undefined ) {
                    // add to the line
                    if (lastWP !== undefined){
                        this.updateOrcreateVector(source, lastWP, mark.wp.latlon, "to_"+mark.wp.name, {
                            style: [
                                new Style({
                                    stroke: new Stroke({
                                        color: "blue",
                                        width: 1
                                    })
                                }),
                                new Style({
                                    image: new Icon({
                                      src: this.arrow,
                                      anchor: [0.75, 0.5],
                                      rotateWithView: true
                                    })
                                })
                            ],
                            arrow: {
                                id: 1,
                                offset: 0.5
                            }
                        });
                    }
//                    routeLine.appendCoordinate(this.toOLCoord(mark.wp.latlon));
                    // add a mark the mark,
                    this.updateOrCreateMaker(source,mark.wp.latlon, mark.id, this.getMarkStyle(mark, nextmark.id));
                    lastWP = mark.wp.latlon;
                }
            };

            //source.addFeature(routeFeature);   
            // need to draw the lines between the marks.
            // center the map on the marks and zoom to the extents.
            this.plottedVersion = routeVersion;
            this.plottedroute = route;
        }
    }

    getMarkStyle(mark, id) {
        if ( mark.id === id ) {
            return [new Style({
                image: new Circle({
                                fill: new Fill({color: 'rgba(255,0,0,0.8)'}),
                                stroke: new Stroke({color: 'black', width: 1}),
                                radius: 5
                            })
                        }),
                        new Style({
                        text: new Text({
                            text: mark.wp.name,
                            offsetX: 10,
                            offsetY: 10,
                            scale: 2,
                            textAlign: 'right'
                            })
                        })
                    ];
        }
        return [new Style({
                image: new Circle({
                                fill: new Fill({color: 'rgba(0,255,0,0.1)'}),
                                stroke: new Stroke({color: 'black', width: 1}),
                                radius: 5
                            })
                }),
                new Style({
                        text: new Text({
                            text: mark.wp.name,
                            offsetX: 10,
                            offsetY: 10,
                            scale: 2,
                            textAlign: 'right'
                            })
                        })
                    ];
    }

    plotMarks(marksDb) {
        if ( this.map  !== undefined && !this.marksShowing) {
            var source = this.marksOverlay.getSource();
            for(var k in marksDb) {
                var markFeature = new Feature({
                    name:  marksDb[k].name,
                    geometry: new Point(this.toOLCoord(marksDb[k].latlon))
                });
                markFeature.setStyle(this.getMarkStyle(marksDb[k], ""));
                source.addFeature(markFeature);
            }   
            this.marksShowing = true;         
        }
    }

    clearMarks() {
        if ( this.map  !== undefined ) {
            this.marksOverlay.getSource().clear(true);
            this.marksShowing = false;                     
        }
    }

    updateOrcreateVector(source, start, end, name, styledesc) {
        var v = source.getFeatureById(name);
        if ( v !== null ) {
            source.removeFeature(v);
        }
        v = new Feature({
            geometry: new LineString([
                    this.toOLCoord(start),
                    this.toOLCoord(end)
                ], 'XY'),
            name: name
        });
        var s = [];
        var toRotate = [];
        var style = styledesc.style;
        for (var i = 0; i < style.length; i++) {
            var cs = style[i].clone()
            s.push(cs);
        }
        if ( styledesc.arrow !== undefined ) {
            this.addArrow(v.getGeometry(), s, styledesc.arrow);
        }
        v.setStyle(s);
        v.setId(name);
        source.addFeature(v);
        return v;
    }


    addArrow(geometry, styles, arrow) {
        geometry.forEachSegment(function(start, end) {
          var dx = end[0] - start[0];
          var dy = end[1] - start[1];
          var rotation = Math.atan2(dy, dx);
          var pos = [ start[0]+dx*arrow.offset, start[1]+dy*arrow.offset];
          // arrows
          styles[arrow.id].setGeometry(new Point(pos));
          styles[arrow.id].getImage().setRotation(-rotation);
        });
    }


    // 
    updateOrCreateMaker(source, position, name, style) {
        var v = source.getFeatureById(name);
        if ( v !== null ) {
            v.getGeometry().setCoordinates(this.toOLCoord(position));
            v.setStyle(style);
        } else {
            v = new Feature({
                name:  name,
                geometry: new Point(this.toOLCoord(position))
            });
            v.setStyle(style);
            v.setId(name);
            source.addFeature(v);
        }
        return v;

    }
    removeFeatures(source, featureIds) {
        for (var i = 0; i < featureIds.length; i++) {
            var f = source.getFeatureById(featureIds[i]);
            if (f !== null) {
                source.removeFeature(f);
            }
        };
    }





    plotLines(currentMark, routeVersion) {
        if ( this.map !== undefined && 
            currentMark != undefined && 
            currentMark.wp !== undefined && 
            currentMark.routeVersion !== routeVersion ) {
            currentMark.routeVersion = routeVersion;
            this.clearLines();
            // draw laylines with tidal vecotr
            var source = this.tacticalOverlay.getSource();
            this.updateOrcreateVector(source, currentMark.portLLStart, currentMark.wp.latlon, "PortLLGMC", this.portLLCOGStyle);
            this.updateOrcreateVector(source, currentMark.stbdLLStart, currentMark.wp.latlon, "StbdLLGMC", this.stbdLLCOGStyle);
            this.updateOrcreateVector(source, currentMark.portLLStart, currentMark.tidePoint, "PortLLHead", this.portLLHDGStyle);
            this.updateOrcreateVector(source, currentMark.stbdLLStart, currentMark.tidePoint, "StbdLLHead", this.stbdLLHDGStyle);
            this.updateOrcreateVector(source, currentMark.tidePoint, currentMark.wp.latlon, "TideVector", this.tideVectorStyle);
        }
    }

    clearLines() {
        this.tacticalOverlay.getSource().clear(true);
    }


    plotCurrentMarker(newmarkerno, routeVersion) {
        if ( this.map !== undefined ) {
            var source = this.marksOverlay.getSource();
            if ( this.currentmarkerno === undefined ) {
                var mark = this.plottedroute[newmarkerno];
                if ( mark !== undefined ) {
                    this.updateOrCreateMaker(source, mark.wp.latlon, mark.id, this.getMarkStyle(mark, mark.id));
                    mark.routeVersion = undefined;
                    this.markerVersion = routeVersion;
                }
            } else if ( this.currentmarkerno !== newmarkerno || this.markerVersion == routeVersion) {
                var oldmark = this.plottedroute[this.currentmarkerno];
                if ( oldmark !== undefined ) {
                    this.updateOrCreateMaker(source, oldmark.wp.latlon, oldmark.id, this.getMarkStyle(oldmark, ""));
                    oldmark.routeVersion = undefined;
                    this.markerVersion = routeVersion;
                }
                this.clearLines();
                var mark = this.plottedroute[newmarkerno];
                if ( mark !== undefined ) {
                    this.updateOrCreateMaker(source, mark.wp.latlon, mark.id, this.getMarkStyle(mark, mark.id));
                    mark.routeVersion = undefined;
                    this.markerVersion = routeVersion;
                }
            } 
            this.plotLines(this.plottedroute[newmarkerno], routeVersion);
            this.currentmarkerno = newmarkerno;
        }
    }

    plotBoat(state) {
        if ( state.position !== undefined && this.map !== undefined ) {
            var source = this.vesselOverlay.getSource();
            this.position = state.position;
            this.boatStyle[0].getImage().setRotation(this.position.heading);
            this.updateOrCreateMaker(source, this.position.latlon, "Boat", this.boatStyle);

            var currentMark = this.plottedroute[this.currentmarkerno];
            if ( currentMark !== undefined && currentMark.wp !== undefined) {
                this.updateOrcreateVector(source, this.position.latlon, currentMark.wp.latlon, "btw", this.btwStyle);
            } else {
                this.removeFeatures(source, ["btw"]);
            }
            var ll = undefined;
            if ( state.nextmark !== undefined && state.nextmark.tackll !== undefined ) {
                ll = state.nextmark.tackll;
            } else if ( state.nextmark !== undefined && state.nextmark.gybell !== undefined ){
                ll = state.nextmark.gybell;
            }
            if ( ll !== undefined  ) {
                if  ( ll.port !== undefined && ll.port.intersect.latlon !== null ) {
                    this.updateOrcreateVector(source, this.position.latlon, ll.port.intersect.latlon, "btwpi", this.btwStbdLLStyle);
                    this.updateOrcreateVector(source, ll.port.intersect.latlon, currentMark.wp.latlon, "btwpm", this.btwPortLLStyle2);
                } else {
                    this.removeFeatures(source, ["btwpi","btwpm"]);
                }
                if ( ll.stbd !== undefined && ll.stbd.intersect.latlon !== null) {
                    this.updateOrcreateVector(source, this.position.latlon, ll.stbd.intersect.latlon, "btwsi", this.btwPortLLStyle);
                    this.updateOrcreateVector(source, ll.stbd.intersect.latlon, currentMark.wp.latlon, "btwsm", this.btwStbdLLStyle2);
                } else {
                    this.removeFeatures(source, ["btwsi","btwsm"]);

                }
            } else {
                this.removeFeatures(source, [ "btwpi","btwpm","btwsi","btwsm"]);
            }

            if ( this.position.speed > 0.1 ) {
                var cogEnd = this.position.latlon.destinationPoint(this.position.speed*600,this.position.heading*180/Math.PI);
                this.updateOrcreateVector(source, this.position.latlon, cogEnd, "cog", this.cogStyle);
            } else {
                this.removeFeatures(source, ["cog"]);

            }

            // wind and current
            // length of the vector should be related to tws
            // make the tws vector 1000m long, and scale the others
            var twdStart = this.position.latlon.destinationPoint(1100, (((state.twd)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var twdEnd = twdStart.destinationPoint(1000, (((state.twd-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.updateOrcreateVector(source, twdStart, twdEnd, "twd", this.twdStyle);
            // length of the vector should be related to gws
            var gwslen = 1000;
            if ( state.tws > 0.1 ) {
                gwslen = 1000*state.gws/state.tws;
            }
            var gwdStart = this.position.latlon.destinationPoint(gwslen+100, (((state.gwd)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var gwdEnd = gwdStart.destinationPoint(gwslen, (((state.gwd-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.updateOrcreateVector(source, gwdStart, gwdEnd, "gwd", this.gwdStyle);
            // length of the vector should be related to gws
            var clen = 1000;
            if ( state.tws > 0.1 ) {
                clen = 1000*state.current/state.tws; 
            }
            var currentStart = this.position.latlon.destinationPoint(clen+100, (((state.currentDirection)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var currentEnd = currentStart.destinationPoint(clen, (((state.currentDirection-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.updateOrcreateVector(source, currentEnd, currentStart, "tide", this.tideStyle);

        }
    }


    update(state) {
        console.log("Plotting state ",state);
        if ( state.displayMarks ) {
            this.plotMarks(state.marksDb);
        } else {
            this.clearMarks();
        }
        this.plotRoute(state.route, state.routeVersion, state.nextmark);
        if ( state.nextmark !== undefined) {
            this.plotCurrentMarker(state.nextmark.idx, state.routeVersion);
        }
        this.plotBoat(state);

    }

    // update the display state, however, 
    render() {
        return (
            <div id={this.mapid} class="map"> </div>
        )
    }


}

export default OSMap;