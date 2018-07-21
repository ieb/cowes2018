/*jshint node:true */
"use strict";

import React from 'react';
import { LatLonSpherical as LatLon, Dms } from 'geodesy';
import solentMarks from './SolentMarksCowesWeek2018.csv';
import Qty from 'js-quantities';
import './course.css';


const radToDeg = Qty.swiftConverter('rad', 'deg');
const mToNm = Qty.swiftConverter('m', 'nmi');
const mToKn = Qty.swiftConverter('m/s', 'kn');
const CROSSHAIR = "M25 1c-13.234 0-24 10.766-24 24 0 13.233 10.766 24 24 24 13.233 0 24-10.767 24-24 0-13.234-10.767-24-24-24zm3 43.75v-8.75h-6v8.75c-8.625-1.307-15.443-8.125-16.75-16.75h8.75v-6h-8.75c1.307-8.625 8.125-15.443 16.75-16.75v8.75h6v-8.75c8.625 1.307 15.443 8.125 16.75 16.75h-8.75v6h8.75c-1.307 8.625-8.125 15.443-16.75 16.75z";

class Course extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        course: window.localStorage.cowes2018Course || "",
        gwd: +window.localStorage.gwd || 255,
        lat: "",
        lon: "",
        geostate: "init",
        displayChart: window.localStorage.cowes2018DisplayChart == "true",
        displayInputs: window.localStorage.cowes2018DisplayInputs === "true",
        displayRacePlan: window.localStorage.cowes2018DisplayRacePlan  === "true",
        displayChart: window.localStorage.cowes2018DisplayChart  === "true",
        displayMarks: window.localStorage.cowes2018DisplayMarks  === "true",
        markradius: +window.localStorage.cowes2018Markradius || 50,
        position: {
           accuracy: 0,
           altitude: null,
           altitudeAccuracy: -1,
           heading: null,
           speed: null,
           timestamp: 0,
           latlon: new LatLon(-1.4703211, 50.7480015)
       },
       nextmark: {
            id: -1,
            xte: null,
            dtw: null,
            btw: null,
            wcv: null,
            ttg: null,
            laylinebearing: null,
            laylinedistance: null,
            laylinettg: null
       }
    }
    this.roundings = {
        "P": "port",
        "S": "starboard",
        "PP": "pass port",
        "PS": "pass starboard",
        "T": "pass through"
    }
    this.bouys = {
        "BY": "N BY",
        "BYB": "E BYB",
        "YB": "S YB",
        "YBY": "W YBY"
    }
    this.loadMarks();
    this.buildRoute(this.state, this.state.course);
    this.state.marksDb = this.marksDb; 
    this.changeGwd = this.changeGwd.bind(this);
    this.changeCourse = this.changeCourse.bind(this);
    this.changeLat = this.changeLat.bind(this);
    this.changeLon = this.changeLon.bind(this);
    this.getLocation = this.getLocation.bind(this);
    this.positionError = this.positionError.bind(this);
    this.changeGeostate = this.changeGeostate.bind(this);
    this.changeMarkradius = this.changeMarkradius.bind(this);
    this.toggleMarks = this.toggleMarks.bind(this);
    this.toggleChart = this.toggleChart.bind(this);
    this.toggleRacePlan = this.toggleRacePlan.bind(this);
    this.toggleInputs = this.toggleInputs.bind(this);
    this.initMap = this.initMap.bind(this);
    this.nextWp = this.nextWp.bind(this);
    this.prevWp = this.prevWp.bind(this);
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(this.getLocation, this.positionError, {
            enableHighAccuracy: true, 
            maximumAge        : 30000, 
            timeout           : 27000
        });
    }
    /*
    var self = this;
    setInterval(() => {
        var position = {
            coords: {
                accuracy: self.state.position.accuracy,
                altitude: self.state.position.altitude,
                altitudeAccuracy: self.state.position.altitudeAccuracy,
                heading: self.state.position.heading,
                speed: self.state.position.speed,                
                latitude: self.state.position.latlon.lat,
                longitude: self.state.position.latlon.lon
            },
            timestamp: Date.now()
        }
        self.getLocation(position);
    }, 1000)
*/
  }

  positionError(error) {
    this.setState({
        geostate: "no fix"+error.message
    });
    console.log("Position Fix"+error);
  }

  getLocation(position) {
    if ( !this.state.geostate !== "user" ) {
        console.log("Got position", position);
        var position = {
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            latlon: new LatLon(position.coords.latitude, position.coords.longitude)
        }
        var newState = {
            lat: Dms.toLat(position.latlon.lat, "dm", 3),
            lon: Dms.toLon(position.latlon.lon, "dm", 3),
            position: position,
            geostate: "fix"
        }
        try {
            this.plotBoat();
            this.updateNextmark(newState, position, this.state.nextmark.id);
            console.log("Possition Update");
            this.setState(newState);
        } catch (e) {
            alert(e.stack);
        }
    }
  }






  componentWillReceiveProps(nextProps) {
  }


  componentDidMount() {
    var self = this;
  }

  componentWillUnmount() {
  }



  // load marks from a cut and paste in the settings, or use a default
    loadMarks() {
        this.marksDb = {};
        var markList, toCols;
        if ( this.props.marks === undefined || this.props.marks.trim() === "") {
            markList = solentMarks;
            toCols= (x) => { return x};
        } else {
            markList = this.props.marks.trim().split("\n");
            toCols= (x) => { return x.trim().split(",");};
        }
        var idx = {};
        var cols = toCols(markList[0]);
        for (var i = 0; i < cols.length; i++) {
           idx[cols[i]] = i;
        };
        for (var i = 1; i < markList.length; i++) {
            var cols = toCols(markList[i])
            this.marksDb[cols[idx.name]] = {
                name: cols[idx.name],
                desc: cols[idx.desc],
                sym: cols[idx.sym],
                latlon: new LatLon(cols[idx.lat], cols[idx.lon])
            }
        };
    }

    buildRoute(newState, course) {
        var route = [];
        var ids = course.trim().replace("\n",",").split(",");
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i].toUpperCase();
          if ( id == '') {
            continue;
          }
          var re = { 
            id: id.substring(0,2)
          };
          if ( id.length > 2) {
            re.rounding = this.roundings[id.substring(2)];
          }
          re.spec = id;
          // may be undefined, indicating the mark could not be found.
          re.wp = this.marksDb[re.id];
          route.push(re);
        };
        // calc distances and bearings.
        var total = 0;
        for (var i = 0; i < route.length; i++) {
            route[i].dist = total;
            if ( i < route.length-1 && route[i].wp !== undefined && route[i+1].wp !== undefined ) {
                var d = route[i].wp.latlon.rhumbDistanceTo(route[i+1].wp.latlon);
                route[i].dtw = d;
                total = total + d;
                route[i].btw = route[i].wp.latlon.rhumbBearingTo(route[i+1].wp.latlon)*Math.PI/180.0; // in degrees                
            }
        }

        this.updateDynamic(route);
        newState.route = route;
    }


    // update all the data that is calculated from current observations.
    updateDynamic(route) {
        if ( route.length  > 0) {
            if ( this.gwd !== undefined ) {
                for (var i = 0; i < route.length; i++) {
                    if ( route[i].btw !== undefined ) {
                         route[i].twa = this.toRelativeAngle(this.gwd - route[i].btw); 
                    }
                }            
            }
        }
    }

    updateNextmark(newState, position, nextmarkno) {
        var route = newState.route || this.state.route;
        if ( route.length === 0 ) {
            return;
        }
        var oldmarkno = nextmarkno;
        if ( nextmarkno === undefined || nextmarkno < 0 ) {
            nextmarkno = 0;
        }
        if ( this.state.nextmark.advancewp ) {
            nextmarkno++;
            alert("Advanced waypoint to "+nextmarkno);
        }
        if ( nextmarkno >= route.length ) {
            nextmarkno = route.length-1;
        }
        this.plotCurrentMarker(nextmarkno);
        var nextwp = route[nextmarkno].wp;
        if ( nextwp === undefined) {
            alert("WP for "+nextmarkno+" is undefined");
        }
        var nextmark = {
            id: nextmarkno,
            name: route[nextmarkno].id,
            xte: null,
            dtw: null,
            btw: null,
            ttg: null,
            wcv: null,
            laylinebearing: null,
            laylinedistance: null,
            laylinettg: null
        }
        if ( position !== undefined && nextwp !== undefined) {
            nextmark.dtw = position.latlon.rhumbDistanceTo(nextwp.latlon);
            nextmark.btw = position.latlon.rhumbBearingTo(nextwp.latlon)*Math.PI/180;
            var ch = undefined;
            if ( nextmark.dtw < this.state.markradius ) {
                // distance to wp is less than radius, waypoint reached.
                nextmark.advancewp = true;                
            }
            if ( position.speed != undefined && position.heading !== undefined) {
                // calculate the wcv
                ch = Math.cos((nextmark.btw-position.heading)*Math.PI/180)
                nextmark.wcv = position.speed*ch;
                nextmark.ttg = nextmark.dtw/nextmark.wcv;
            } 
            var angle, ll;
            if ( Math.abs(nextwp.twa) < this.state.tackvmgangle ) {
                // tacking required, laylines needed, there are 2 laylines,
                angle = this.state.tackvmgangle;
                nextmark.tackll = ll = {
                    port : {
                        btw: ((this.gwd+angle)+2*Math.PI)%(2*Math.PI)
                    },
                    stbd: {
                        btw: ((this.gwd-angle)+2*Math.PI)%(2*Math.PI)
                    }
                }
                // angle between the btw and the layline indicates which sector.
                var porttobtw =  (2*Math.PI+tackll.port.btw-nextwp.btw)%2*Math.PI;
                if ( porttobtw < 2*angle ) {
                    // inbetween the laylines
                    ll.between = true;
                } else if ( porttobtw < Math.PI-angle ) {
                    // overstood starboard
                    ll.stdbover = true;
                } else {
                    // overstood port.
                    ll.portover = true;
                }
                calcIntesects(ll, position, nextwp);
            } else if ( Math.abs(nextwp.twa) > this.state.gybevmgangle) {
                angle = this.state.tackvmgangle;
                nextmark.gybell = ll = {
                    port : {
                        btw: ((this.gwd+angle)+2*Math.PI)%(2*Math.PI)
                    },
                    stbd: {
                        btw: ((this.gwd-angle)+2*Math.PI)%(2*Math.PI)
                    }
                }
                var porttobtw =  (2*Math.PI+tackll.port.btw-nextwp.btw)%2*Math.PI;
                if ( porttobtw < this.state.gybevmgangle) {
                    // over port layline
                    ll.portover = true;
                } else if (portbtw < 2*Math.PI-2*(Math.PI-this.state.gybevmgangle)) {
                    // over starboard layline
                    ll.stdbover = true;
                } else {
                    // between laylines
                    ll.between = true;
                }
                calcIntesects(ll, position, nextwp);
            }
        }
        console.log("Next mark", nextmark);
        newState.nextmark = nextmark;
    }
    calcIntesects(ll, position, nextwp) {
                // calculate the distance to both laylines using the target twa, which is parallel to the layline
        var pintersect = ll.port.intersect = {
            latlon: LatLon.intersection(position.latlon, ll.stbd.btw, nextwp.latlon, (ll.port.btw-Math.PI)%(2*Math.PI))
        };
        var sintersect = ll.stbd.intersect = {
            latlon: LatLon.intersection(position.latlon, ll.port.btw, nextwp.latlon, (ll.stbd.btw-Math.PI)%(2*Math.PI))
        };
        pintersect.dti = position.latlon.rhumbDistanceTo(pintersect.latlon);
        sintersect.dti = position.latlon.rhumbDistanceTo(sintersect.latlon);
        pintersect.itw = sintersect.latlon.rhumbDistanceTo(nextwp.latlon);
        sintersect.itw = pintersect.latlon.rhumbDistanceTo(bextwp.latlon);

        // calculate the distance to both laylines using the current heading
        var phead = ll.port.heading = {
            latlon: LatLon.intersection(position.latlon, position.heading, nextwp.latlon, (ll.port.btw-Math.PI)%(2*Math.PI))
        };
        var shead = ll.stbd.heading = {
            latlon: LatLon.intersection(position.latlon, position.heading, nextwp.latlon, (ll.stbd.btw-Math.PI)%(2*Math.PI))
        };
        phead.dti = position.latlon.rhumbDistanceTo(phead.latlon);
        shead.dti = position.latlon.rhumbDistanceTo(shead.latlon);
        phead.itw = shead.latlon.rhumbDistanceTo(nextwp.latlon);
        shead.itw = phead.latlon.rhumbDistanceTo(bextwp.latlon);


        // calculate the ttg to the layline
        shead.tti = phead.dti/position.speed;
        phead.tti = shead.dti/position.speed;
        shead.ttw = (phead.dti+phead.itw)/position.speed;
        phead.ttw = (shead.dti+sheah.itw)/position.speed;

    }


    toRelativeAngle(r) {
        if ( r > Math.PI ) {
            return r - 2*Math.PI; 
        } else if ( r < -Math.PI) {
            return r + 2*Math.PI;
        }
        return r;
    }


    mToDisplay(d) {
        if ( d === undefined || d === null) {
            return "";
        }
        if (d < 100) {
            return d.toFixed(0)+" m";
        } 
        return mToNm(d).toFixed(1)+" nm";
    }
    radToDisplay(r) {
        if ( r === undefined || r === null) {
            return "";
        }
        return radToDeg(r).toFixed(0)+"°";
    }

    symToDisplay(b) {
        if ( this.bouys[b] !== undefined) {
            return this.bouys[b];
        }
        return b;
    }
    msToDisplay(b) {
        if ( b === undefined || b === null) {
            return "0.0";
        } 
        return mToKn(b).toFixed(1)+" kn";
    }
    durationToDisplay(d) {
        if ( d === undefined  || d === null) {
            return "-";
        }
        var h = ("0000"+Math.floor(d/3600)).substr(-3);
        var m = ("0000"+Math.floor((d%3600)/60)).substr(-2);
        var s = ("0000"+Math.floor(d%60)).substr(-2);
        return h+":"+m+":"+s;
    }
    degToDisplay(b) {
        if ( b === undefined || b === null) {
            return "-";
        } 
        return b.toFixed(1);
    }


  renderRouteTable() {
    var rows = [];
    var np = this.state.nextmark.id;
    for (var i = 0; i < this.state.route.length; i++) {
        var r = this.state.route[i];
        if ( r.wp === undefined ) {
            rows.push(
                    (<tr key={i}>
                        <td>
                            {(np == i)?"\u21E8":""}
                        </td>
                        <td>
                            {r.id}
                        </td>
                        <td></td>
                        <td>???</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    ));
        
        } else {
            rows.push(
                (<tr key={i} >
                    <td>
                            {(np == i)?"\u21E8":""}
                    </td>
                    <td>
                        {r.wp.name}
                    </td>
                    <td>
                        {r.rounding}
                    </td>
                    <td>
                        {r.wp.desc}
                    </td>
                    <td className={"bouy"+r.wp.sym}>
                        {this.symToDisplay(r.wp.sym)}
                    </td>
                    <td>{r.wp.latlon.toString("dm",3)}</td>
                    <td>{this.radToDisplay(r.btw)}</td>
                    <td>{this.mToDisplay(r.dtw)}</td>
                    <td>{this.mToDisplay(r.dist)}</td>
                    <th>{this.radToDisplay(r.twa)}</th>
                </tr>
                ));

        }
    };
    this.plotRoute();
     return (<table className="route">
                <tbody>
                    <tr key="header">
                        <th>Next</th>
                        <th>ID</th>
                        <th>Rounding</th>
                        <th>Name</th>
                        <th>Bouy</th>
                        <th>latlon</th>
                        <th>BTW(M)</th>
                        <th>DTW</th>
                        <th>Total</th>
                        <th>TWA</th>
                    </tr>
                    {rows}

                </tbody>
            </table>);
  }

  renderMarksTable() {
    var rows = [];
    for ( var id in  this.state.marksDb) {
        var m = this.state.marksDb[id];
        rows.push(
            (<tr key={m.name}>
                <td>
                    {m.name}
                </td>
                <td>
                    {m.desc}
                </td>
                <td className={"bouy"+m.sym}>
                    {this.symToDisplay(m.sym)}
                </td>
                <td>{m.latlon.toString("dm",3)}</td>
            </tr>
            ));
    };
    return (<table className="marks">
                <tbody>
                    <tr key="header">
                        <th>Name</th>
                        <th>Desc</th>
                        <th>Type</th>
                        <th>Position</th>
                    </tr>
                    {rows}
                </tbody>
            </table>);
  }



  renderCurrent() {
    if ( this.state.route.length === 0 || this.state.nextmark.id == undefined || this.state.route[this.state.nextmark.id] == undefined) {
        return (
            <div>No route defined</div>
        )
    } else {
        return (
            <table className="current">
                <tbody>
                    <tr>
                        <th>Next Mark</th>
                        <th>XTE</th>
                        <th>DTW</th>
                        <th>BTW</th>
                        <th>WCV</th>
                        <th>TTG</th>
                        <th>Layline Bearing</th>
                        <th>Layline Distance</th>
                        <th>Layline Time</th>
                    </tr>
                    <tr>
                        <td>{this.state.nextmark.id}</td>
                        <td>{this.mToDisplay(this.state.nextmark.xte)}</td>
                        <td>{this.mToDisplay(this.state.nextmark.dtw)}</td>
                        <td>{this.radToDisplay(this.state.nextmark.btw)}</td>
                        <td>{this.msToDisplay(this.state.nextmark.wcv)}</td>
                        <td>{this.durationToDisplay(this.state.nextmark.ttg)}</td>
                        <td>{this.radToDisplay(this.state.nextmark.laylinebearing)}</td>
                        <td>{this.mToDisplay(this.state.nextmark.laylinedistance)}</td>
                        <td>{this.durationToDisplay(this.state.nextmark.laylinettg)}</td>
                    </tr>
                </tbody>
            </table>
        );

    }

  }

  changeGwd(e) {
    var gwd = e.target.value;
    this.gwd = +gwd*Math.PI/180;
    var newState = {
        gwd: gwd
    };
    window.localStorage.cowes2018gwd = gwd;
    this.buildRoute(newState, this.state.course);
    this.setState(newState);
  }

  changeCourse(e) {
    var course = e.target.value;
    var newState = {
        course: course
    };
    window.localStorage.cowes2018Course = course;
    this.buildRoute(newState, course);
    this.setState(newState)
  }
  changeMarkradius(e) {
    var markradius = e.target.value;
    var newState = {
        markradius: markradius
    };
    window.localStorage.cowes2018Markradius = markradius;
    this.setState(newState)
  }


  changeLat(e) {
    var latTxt = e.target.value;
    var lat = Dms.parseDMS(latTxt);
    var position = {
        accuracy: -999,
        altitude: null,
        altitudeAccuracy: -1,
        heading: null,
        speed: null,
        timestamp: Date.now(),
        latlon: new LatLon(lat, this.state.position.latlon.lon)
    }
    var newState = {
            geostate: "user",
            lat: latTxt,
            position: position        
    }
    this.updateNextmark(newState, position, this.state.nextmark.id);
    this.setState(newState);    
  }
  changeLon(e) {
    var lonTxt = e.target.value;
    var lon = Dms.parseDMS(lonTxt);
    var position = {
        accuracy: -1,
        altitude: null,
        altitudeAccuracy: -1,
        heading: null,
        speed: null,
        timestamp: Date.now(),
        latlon: new LatLon(this.state.position.latlon.lat, lon)
    }
    var newState = {
            geostate: "user",
            lon: lonTxt,
            position: position        
    }
    this.updateNextmark(newState, position,this.state.nextmark.id);
    this.setState(newState);
  }
  changeGeostate(e) {
    this.setState({
        geostate: e.target.value
    });
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.getLocation, this.positionError, {
            enableHighAccuracy: true, 
            maximumAge        : 30000, 
            timeout           : 27000
        });
    }
  }


  // could tdo this in a component, but I am being lazy
  toggleMarks() {
    window.localStorage.cowes2018DisplayMarks = !this.state.displayMarks;
    this.setState({ displayMarks: !this.state.displayMarks});
  }


  displayMarks() {
    if ( this.state.displayMarks ) {
        this.plotMarks();
        return (
            <div>
            <div className="headding" onClick={this.toggleMarks}>{"\u25BF"} Available Marks</div>
                {this.renderMarksTable()}
            </div>
       );
    } else {
        this.clearMarks();
        return (
            <div>
            <div className="headding" onClick={this.toggleMarks}>{"\u25B9"} Available Marks</div>
            </div>
       );
    }
  }
  toggleChart() {
    window.localStorage.cowes2018DisplayChart = !this.state.displayChart;
    this.setState({ displayChart: !this.state.displayChart});
  }

  displayChart() {
    if ( this.state.displayChart ) {
        return (
            <div>
            <div className="headding" onClick={this.toggleChart}>{"\u25BF"} Chart</div>
            <div id="map" ></div>
            </div>
       );
    } else {
        return (
            <div>
            <div className="headding" onClick={this.toggleChart}>{"\u25B9"} Chart</div>
            <div id="map" className="hidden" ></div>
            </div>
       );
    }
  }
  toggleRacePlan() {
    window.localStorage.cowes2018DisplayRacePlan = !this.state.displayRacePlan;
    this.setState({ displayRacePlan: !this.state.displayRacePlan});
  }




  displayRacePlan() {
    if ( this.state.displayRacePlan ) {
        return (
            <div>
            <div className="headding" onClick={this.toggleRacePlan}>{"\u25BF"} Race Plan</div>
            {this.renderRouteTable()}
            </div>
       );
    } else {
        return (
            <div>
            <div className="headding" onClick={this.toggleRacePlan}>{"\u25B9"} Race Plan</div>
            </div>
       );
    }
  }

  nextWp() {
    var newState = {};
    var nm = this.state.nextmark.id || 0;
    nm++;
    this.updateNextmark(newState, this.state.position, nm);
    this.setState(newState);
  }
  prevWp() {
    var newState = {};
    var nm = this.state.nextmark.id || 0;
    nm--;
    this.updateNextmark(newState, this.state.position, nm);
    this.setState(newState);
  }

  toggleInputs() {
    window.localStorage.cowes2018DisplayInputs = !this.state.displayInputs;
    this.setState({ displayInputs: !this.state.displayInputs});
  }

  displayInputs() {
    if ( this.state.displayInputs ) {
        return (
            <div>
            <div className="headding" onClick={this.toggleInputs}>{"\u25BF"} Inputs</div>
        All inputs are saved on your device.
        <div>
        Course <input name="course" type="text" value={this.state.course} onChange={this.changeCourse} />
        </div><div>
        GWD    <input name="gwd" type="number" value={this.state.gwd}  step="1" min="0" max="359"   onChange={this.changeGwd} />
        </div><div>
        WP Radius    <input name="markradius" type="number" value={this.state.markradius}  min="0"    onChange={this.changeMarkradius} />
        </div>
        <div>
        <button onClick={this.prevWp}>Previous</button>
        <button onClick={this.nextWp}>Next</button>
        </div>
            </div>
       );
//        <div>
//        LatLon   <input name="lat" type="text" value={this.state.lat}     onChange={this.changeLat} /> 
//        <input name="lon" type="text" value={this.state.lon}     onChange={this.changeLon} />
//        <input name="geostate" type="text" value={this.state.geostate}     onChange={this.changeGeostate} />
//        </div>
    } else {
        return (
            <div>
            <div className="headding" onClick={this.toggleInputs}>{"\u25B9"} Inputs</div>
            </div>
       );
    }
  }

  fixStatus() {
    if (this.state.geostate == "fix") {
        return "\u2609"
    } else if ( this.state.geostate == "init") {
        return "\u25CC"
    } else {
        return "\u2601 " + this.state.geostate;
    }
  }


    plotRoute() {
        var replot = false;
        if (this.routeMarks == undefined || 
            this.plottedroute == undefined ||
            this.state.route == undefined || 
            this.state.route.length !== this.plottedroute.length) {
            replot = true;
        }
        if ( !replot) {
            for (var i = this.plottedroute.length - 1; i >= 0; i--) {
                if ( this.plottedroute[i].spec !== this.state.route[i].spec ) {
                    replot = true;
                }
            }
        }
        console.log("replot ", replot);
        if ( this.map !== undefined && replot) {
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
            this.routeMarks = this.state.route.map((mark, i) => {
                if ( mark.wp !== undefined ) {
                  return new window.google.maps.Marker({
                    position: { lat: mark.wp.latlon.lat, lng: mark.wp.latlon.lon},
                    label: mark.spec,
                    icon: this.getMarkIcon(mark.wp),
                    map: this.map            
                });                    
                } else {
                    console.log("No wp ", mark);
                }
            });
            var routeCoords = [];
            for (var i = 0; i < this.state.route.length; i++) {
                if ( this.state.route[i].wp !== undefined) {
                    routeCoords.push({lat: this.state.route[i].wp.latlon.lat, lng: this.state.route[i].wp.latlon.lon});
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

            this.plottedroute = this.state.route;
            var center = this.getMapCenter();
            console.log("Route marks ", this.routeMarks, center);
            this.map.setCenter(center);
            // need to draw the lines between the marks.
            // center the map on the marks and zoom to the extents.
        }
    }

    getMarkIcon(wp) {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'yellow',
            fillOpacity: 0.8,
            scale: 10,
            strokeColor: 'black',
            strokeWeight: 1
        };
    }
    getNextMarkIcon(wp) {
        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'green',
            fillOpacity: 0.8,
            scale: 10,
            strokeColor: 'black',
            strokeWeight: 1
        };

    }

    plotCurrentMarker(newmarkerno) {
        if ( this.routeMarks !== undefined) {
            console.log(newmarkerno);
            if ( this.state.nextmark == undefined) {
                if ( this.routeMarks[newmarkerno] !== undefined) {
                    this.routeMarks[newmarkerno].setIcon(this.getNextMarkIcon(this.routeMarks[newmarkerno].wp));
                }                 
            } else if ( this.state.nextmark.id !== newmarkerno) {
                if ( this.routeMarks[this.state.nextmark.id] !== undefined) {
                    this.routeMarks[this.state.nextmark.id].setIcon(this.getMarkIcon(this.routeMarks[this.state.nextmark.id].wp));
                }
                if ( this.routeMarks[newmarkerno] !== undefined) {
                    this.routeMarks[newmarkerno].setIcon(this.getNextMarkIcon(this.routeMarks[newmarkerno].wp));
                }                
            }
        }
    }

    plotMarks() {
        if ( this.markers == undefined && this.map  !== undefined) {
            this.markers = [];
            for(var k in this.state.marksDb) {
              this.markers.push(new window.google.maps.Marker({
                position: { lat: this.state.marksDb[k].latlon.lat, lng: this.state.marksDb[k].latlon.lon},
                label: this.state.marksDb[k].name,
                map: this.map
              }));
            }            
            console.log("Adding markers ",this.markers);
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

    plotBoat() {
        if ( this.state.position !== undefined && this.map !== undefined ) {
            var boatPos = { lat: this.state.position.latlon.lat, lng: this.state.position.latlon.lon};
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
        }
    }



  getMapCenter() {
    if ( this.state.route !== undefined && this.state.route.length > 0 ) {
        var maxLat = -100, maxLon = -360, minLat = 100, minLon = 360;
        this.state.route.map((mark) => {
            if ( mark.wp  !== undefined ) {
                maxLat = Math.max(maxLat, mark.wp.latlon.lat);
                minLat = Math.min(minLat, mark.wp.latlon.lat);
                maxLon = Math.max(maxLon, mark.wp.latlon.lon);
                minLon = Math.min(minLon, mark.wp.latlon.lon);
            }
        });
        return {
            lat: (maxLat+minLat)/2,
            lng: (maxLon+minLon)/2
        }
    } else  {
        return {
            lat: this.state.position.lat,
            lng: this.state.position.lon
        }
    }
  }


  initMap() {
    var center = this.getMapCenter();
    console.log('maps init called ', center);
    this.map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: 11
    });
    this.plotRoute();
    this.plotBoat();
  }

  componentDidMount() {
    var loadedMaps = document.getElementById("loadedMaps");
    if ( window.cowes2018initMap === undefined ) {
        window.cowes2018initMap = this.initMap;
        var script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC1R7_R3evqRM6gsl1MTrORvGGFtbg9BjY&callback=cowes2018initMap"
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);        
    }
  }





  render() {
    return (
        <div className="course" >
        <hr/>
        <div>
        Position:{this.state.position.latlon.toString("dm",3)} {this.fixStatus()}
        </div>
        <div>
        SOG:{this.msToDisplay(this.state.position.speed)} 
        </div>
        <div>
        COG:{this.degToDisplay(this.state.position.heading)}
        </div>
        <div>
        ts:{this.state.position.timestamp}
        </div>
        {this.renderCurrent()}
        {this.displayRacePlan()}
        {this.displayChart()}
        {this.displayMarks()}
        {this.displayInputs()}
        <div className="headding">Weather Links</div>
        <a href="https://weatherfile.com/GBR000014&wt=KTS" >Lymington Starting Platform</a>
        <a href="https://weatherfile.com/RPR000154&wt=KTS" >Ryde Pier</a>
        <a href="https://weatherfile.com/GBR00002&wt=KTS" >Hurst Castle</a>
        <a href="https://weatherfile.com/GBR00004&wt=KTS" >Pool</a>
        </div>
    );
  }

}

export default Course;