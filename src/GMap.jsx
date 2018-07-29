"use strict";

class GMap {
    constructor(key) {
        this.key = key;
        this.initMap = this.initMap.bind(this);
        this.cbid = "gmapInit"+Date.now();
        window[this.cbid] = this.initMap;
        this.doneinit = false;            

    }
    init(cb) {
        this.cbinit = cb;

        if (!this.doneinit) {
            console.log("Load Maps");
            var script = document.createElement("script");
            script.src = "https://maps.googleapis.com/maps/api/js?key="+this.key+"&callback="+this.cbid;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
            this.doneinit = true;            
        }
    }

    initMap() {
        var center = this.getMapCenter();
        console.log('maps init called ', center);
        this.map = new google.maps.Map(document.getElementById('map'), {
                  center: center,
                  zoom: 11
        });
        this.cbinit();
    }

    update(state) {
        console.log("Plotting state ",state);
        this.plotRoute(state.route, state.routeVersion, state.nextmark);
        if ( state.nextmark !== undefined) {
            this.plotCurrentMarker(state.nextmark.idx, state.routeVersion);
        }
        this.plotBoat(state);
    }

    plotRoute(route, routeVersion, nextmark) {
        if ( route == undefined ) {
            return;
        }
        if ( this.map !== undefined && this.plottedVersion !== routeVersion) {
            if ( this.routeMarks !== undefined ) {
                this.routeMarks.map((mark) => {
                    if ( mark !== undefined) {
                        mark.setMap(null);
                    }
                });
            }
            if ( this.routeToFinish !== undefined) {
                this.routeToFinish.setMap(null);
            }
            this.routeMarks = route.map((mark, i) => {
                if ( mark.wp !== undefined ) {
                  return new window.google.maps.Marker({
                        position: { lat: mark.wp.latlon.lat, lng: mark.wp.latlon.lon},
                        label: mark.spec,
                        icon: this.getMarkIcon(mark, nextmark.id),
                        map: this.map            
                    });                    
                } else {
                    console.log("No wp ", mark);
                }
            });
            var routeCoords = [];
            for (var i = 0; i < route.length; i++) {
                if ( route[i].wp !== undefined) {
                    routeCoords.push({lat: route[i].wp.latlon.lat, lng: route[i].wp.latlon.lon});
                }
            };
            this.routeToFinish = new google.maps.Polyline({
                path: routeCoords,
                geodesic: true,
                strokeColor: '#000000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '100%',
                    repeat: '100px'
                }]
              });
            this.routeToFinish.setMap(this.map);



            this.plottedroute = route.slice();
            var center = this.getMapCenter(route);
            this.map.setCenter(center);
            // need to draw the lines between the marks.
            // center the map on the marks and zoom to the extents.
            this.plottedVersion = routeVersion;
        }
    }

    getMarkIcon(mark, id) {

        if ( mark.id === id) {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'green',
                fillOpacity: 0.8,
                scale: 10,
                strokeColor: 'black',
                strokeWeight: 1
            };            
        } else {
            return {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'yellow',
                fillOpacity: 0.8,
                scale: 10,
                strokeColor: 'black',
                strokeWeight: 1
            };            
        }
    }

    plotLines(currentMark, routeVersion) {
        if ( currentMark != undefined && currentMark.wp !== undefined && currentMark.routeVersion !== routeVersion  ) {
            currentMark.routeVersion = routeVersion;
            this.clearLines();
            // draw laylines with tidal vecotr




//            var portLL = currentMark.wp.latlon.destinationPoint(1000, (((currentMark.portLLBTW-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
//            var stbdLL = currentMark.wp.latlon.destinationPoint(1000, (((currentMark.stbdLLBTW-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.lines = []; 
            this.lines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentMark.portLLStart.lat, lng: currentMark.portLLStart.lon },
                    { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2,                 
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '75%'
                }]
            }));
            this.lines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentMark.stbdLLStart.lat, lng: currentMark.stbdLLStart.lon },
                    { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#00FF00',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '75%'
                }]
            }));
            this.lines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentMark.portLLStart.lat, lng: currentMark.portLLStart.lon },
                    { lat: currentMark.tidePoint.lat, lng: currentMark.tidePoint.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 1,                 
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_OPEN_ARROW},
                    offset: '75%'
                }]
            }));
            this.lines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentMark.stbdLLStart.lat, lng: currentMark.stbdLLStart.lon },
                    { lat: currentMark.tidePoint.lat, lng: currentMark.tidePoint.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#00FF00',
                strokeOpacity: 1.0,
                strokeWeight: 1,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_OPEN_ARROW},
                    offset: '75%'
                }]
            }));
            this.lines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentMark.tidePoint.lat, lng: currentMark.tidePoint.lon },
                    { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#00FFFF',
                strokeOpacity: 1.0,
                strokeWeight: 1,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_OPEN_ARROW},
                    offset: '75%',
                    repeat: '20px'
                }]
            }));


        }
    }

    clearLines() {
        if ( this.lines !== undefined ) {
            for (var i = 0; i < this.lines.length; i++) {
                this.lines[i].setMap(null);
                this.lines[i] = undefined;
            };
            this.lines = undefined;
        }
    }

    plotCurrentMarker(newmarkerno, routeVersion) {
        if ( this.routeMarks !== undefined) {
            if ( this.currentmarkerno === undefined ) {
                if ( this.routeMarks[newmarkerno] !== undefined) {
                    this.routeMarks[newmarkerno].setIcon(this.getMarkIcon(this.plottedroute[newmarkerno], this.plottedroute[newmarkerno].id));
                    this.plottedroute[newmarkerno].routeVersion = undefined;
                    this.markerVersion = routeVersion;
                }                 
            } else if ( this.currentmarkerno !== newmarkerno || this.markerVersion == routeVersion) {
                if ( this.routeMarks[this.currentmarkerno] !== undefined) {
                    this.routeMarks[this.currentmarkerno].setIcon(this.getMarkIcon(this.plottedroute[this.currentmarkerno], ""));
                    this.plottedroute[this.currentmarkerno].routeVersion = undefined;
                    this.clearLines();
                }
                if ( this.routeMarks[newmarkerno] !== undefined) {
                    this.routeMarks[newmarkerno].setIcon(this.getMarkIcon(this.plottedroute[newmarkerno], this.plottedroute[newmarkerno].id));
                    this.plottedroute[newmarkerno].routeVersion = undefined;
                    this.markerVersion = routeVersion;
                }                

            } 
            this.plotLines(this.plottedroute[newmarkerno], routeVersion);
            this.currentmarkerno = newmarkerno;
        }
    }




    plotMarks(marksDb) {
        if ( this.markers == undefined && this.map  !== undefined) {
            this.markers = [];
            for(var k in marksDb) {
              this.markers.push(new window.google.maps.Marker({
                position: { lat: marksDb[k].latlon.lat, lng: marksDb[k].latlon.lon},
                label: marksDb[k].name,
                map: this.map
              }));
            }            
        }
    }
    clearMarks() {
        if ( this.markers !== undefined) {
            this.markers.map(function(mark) {
                mark.setMap(null);
            })
            this.markers = undefined;
        }
    }

    plotBoat(state) {
        if ( state.position !== undefined && this.map !== undefined ) {
            this.position = state.position;
            var boatPos = { lat: this.position.latlon.lat, lng: this.position.latlon.lon};
            console.log("Drawing boat at ",boatPos);
            if (this.boatMark === undefined) {
                this.boatMark = new window.google.maps.Marker({
                position: boatPos,
                label: "B",
                map: this.map
              });
            } else {
                this.boatMark.setPosition(boatPos);
            }
            // draw line from boat to currentMarker.
            var lineSymbol = {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 2
            };
            var dots = {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                strokeWeight: 2,
                scale: 1
            };
            if ( this.trackLines !== undefined) {
                for (var i = 0; i < this.trackLines.length; i++) {
                    this.trackLines[i].setMap(null);
                };
            }
            this.trackLines = [];
            var currentMark = this.plottedroute[this.currentmarkerno];
            if ( currentMark !== undefined && currentMark.wp !== undefined) {
                this.trackLines.push(new google.maps.Polyline({
                    path: [
                            { lat: this.position.latlon.lat, lng: this.position.latlon.lon },
                            { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                        ], 
                    map: this.map,
                    geodesic: true,
                    strokeColor: '#FFFFFF',
                    strokeOpacity: 0,
                    icons: [{
                        icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                        offset: '95%'
                    },{
                     icon: lineSymbol,
                     offset: '0',
                     repeat: '20px'
                    }]
                }));
            }
            var ll = undefined;
            if ( state.nextmark !== undefined && state.nextmark.tackll !== undefined ) {
                ll = state.nextmark.tackll;
            } else if ( state.nextmark !== undefined && state.nextmark.gybell !== undefined ){
                ll = state.nextmark.gybell;
            }
            if ( ll !== undefined  ) {
                if  ( ll.port !== undefined && ll.port.intersect.latlon !== null ) {
                    this.trackLines.push(new google.maps.Polyline({
                        path: [
                                { lat: this.position.latlon.lat, lng: this.position.latlon.lon },
                                { lat: ll.port.intersect.latlon.lat, lng: ll.port.intersect.latlon.lon }
                            ], 
                        map: this.map,
                        geodesic: true,
                        strokeColor: '#00FF00',
                        strokeOpacity: 0,
                        icons: [{
                         icon: dots,
                         offset: '0',
                         repeat: '10px'
                        }]
                    }));
                    this.trackLines.push(new google.maps.Polyline({
                        path: [
                                { lat: ll.port.intersect.latlon.lat, lng: ll.port.intersect.latlon.lon },
                                { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                            ], 
                        map: this.map,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0,
                        icons: [{
                         icon: dots,
                         offset: '0',
                         repeat: '10px'
                        }]
                    }));
                }
                if ( ll.stbd !== undefined && ll.stbd.intersect.latlon !== null) {
                    this.trackLines.push(new google.maps.Polyline({
                        path: [
                                { lat: this.position.latlon.lat, lng: this.position.latlon.lon },
                                { lat: ll.stbd.intersect.latlon.lat, lng: ll.stbd.intersect.latlon.lon }
                            ], 
                        map: this.map,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0,
                        icons: [{
                         icon: dots,
                         offset: '0',
                         repeat: '10px'
                        }]
                    }));
                    this.trackLines.push(new google.maps.Polyline({
                        path: [
                                { lat: ll.stbd.intersect.latlon.lat, lng: ll.stbd.intersect.latlon.lon },
                                { lat: currentMark.wp.latlon.lat, lng: currentMark.wp.latlon.lon }
                            ], 
                        map: this.map,
                        geodesic: true,
                        strokeColor: '#00FF00',
                        strokeOpacity: 0,
                        icons: [{
                         icon: dots,
                         offset: '0',
                         repeat: '10px'
                        }]
                    }));
                }
            }

            if ( this.position.speed > 0.1 ) {
                var cogEnd = this.position.latlon.destinationPoint(this.position.speed*600,this.position.heading*180/Math.PI);
                this.trackLines.push(new google.maps.Polyline({
                        path: [
                                { lat: this.position.latlon.lat, lng: this.position.latlon.lon },
                                { lat: cogEnd.lat, lng: cogEnd.lon }
                            ], 
                        map: this.map,
                        geodesic: true,
                        strokeColor: '#00FF00',
                        strokeOpacity: 0,
                        icons: [{
                         icon: lineSymbol,
                         offset: '0',
                         repeat: '10px'
                        }]
                    }));
            }

            // wind and current
            // length of the vector should be related to tws
            // make the tws vector 1000m long, and scale the others
            var twdStart = this.position.latlon.destinationPoint(1100, (((state.twd)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var twdEnd = twdStart.destinationPoint(1000, (((state.twd-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.trackLines.push(
                new google.maps.Polyline({
                path:[
                    { lat: twdStart.lat, lng: twdStart.lon },
                    { lat: twdEnd.lat, lng: twdEnd.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#0000FF',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '100%'
                }]
            }));
            // length of the vector should be related to gws
            var gwslen = 1000;
            if ( state.tws > 0.1 ) {
                gwslen = 1000*state.gws/state.tws;
            }
            var gwdStart = this.position.latlon.destinationPoint(gwslen+100, (((state.gwd)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var gwdEnd = gwdStart.destinationPoint(gwslen, (((state.gwd-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.trackLines.push(
                new google.maps.Polyline({
                path:[
                    { lat: gwdStart.lat, lng: gwdStart.lon },
                    { lat: gwdEnd.lat, lng: gwdEnd.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#0000FF',
                strokeOpacity: 1.0,
                strokeWeight: 1,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '100%'
                }]
            }));
            // length of the vector should be related to gws
            var clen = 1000;
            if ( state.tws > 0.1 ) {
                clen = 1000*state.current/state.tws; 
            }
            var currentStart = this.position.latlon.destinationPoint(clen+100, (((state.currentDirection)+2*Math.PI)%(2*Math.PI))*180/Math.PI); 
            var currentEnd = currentStart.destinationPoint(clen, (((state.currentDirection-Math.PI)+2*Math.PI)%(2*Math.PI))*180/Math.PI);
            this.trackLines.push(
                new google.maps.Polyline({
                path:[
                    { lat: currentEnd.lat, lng: currentEnd.lon },
                    { lat: currentStart.lat, lng: currentStart.lon }
                ], 
                geodesic: true,
                map: this.map,
                strokeColor: '#00FFFF',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                icons: [{
                    icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW},
                    offset: '100%'
                }]
            }));

        }
    }



  getMapCenter(route) {
    if ( route !== undefined && route.length > 0 ) {
        var maxLat = -100, maxLon = -360, minLat = 100, minLon = 360;
        route.map((mark) => {
            if ( mark.wp  !== undefined ) {
                maxLat = Math.max(maxLat, mark.wp.latlon.lat);
                minLat = Math.min(minLat, mark.wp.latlon.lat);
                maxLon = Math.max(maxLon, mark.wp.latlon.lon);
                minLon = Math.min(minLon, mark.wp.latlon.lon);
            }
        });
        if ( maxLat == -100 ) {
            return {
                lat: 50.7480015,
                lng: -1.4703211 
            }
        } else {
            return {
                lat: (maxLat+minLat)/2,
                lng: (maxLon+minLon)/2
            }

        }
    } else  if (this.position !== undefined ){
        return {
            lat: this.position.latlon.lat,
            lng: this.position.latlon.lon
        }
    } else {
        return {
            lat: 50.7480015,
            lng: -1.4703211 
        }
    }
  }



}

export default GMap;