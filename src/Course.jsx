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


class Course extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        course: props.course || "",
        gwd: 0,
        lat: "",
        lon: "",
        geostate: "init",
        position: {
           accuracy: 0,
           altitude: null,
           altitudeAccuracy: -1,
           heading: null,
           speed: null,
           timestamp: 0,
           latlon: new LatLon(-1,50)
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
    this.buildRoute(this.state, props.course || "");
    this.state.marksDb = this.marksDb; 
    this.changeGwd = this.changeGwd.bind(this);
    this.changeCourse = this.changeCourse.bind(this);
    this.changeLat = this.changeLat.bind(this);
    this.changeLon = this.changeLon.bind(this);
    this.getLocation = this.getLocation.bind(this);
    this.positionError = this.positionError.bind(this);
    this.changeGeostate = this.changeGeostate.bind(this);
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(this.getLocation, this.positionError, {
            enableHighAccuracy: true, 
            maximumAge        : 30000, 
            timeout           : 27000
        });
    }
  }

  positionError(error) {
    this.setState({
        geostate: "no fix"+error.message
    });
    console.log("Position Fix"+error);
  }

  getLocation(position) {
    if ( !this.state.geostate !== "user" ) {
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
        this.updateNextmark(newState, position, this.state.nextmark.id);
        this.setState(newState);

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
        if ( nextmarkno === undefined || nextmarkno < 0 ) {
            nextmarkno = 0;
        }
        if ( this.state.nextmark.advancewp ) {
            nextmarkno++;
        }
        if ( nextmarkno >= route.length ) {
            nextmarkno = route.length-1;
        }
        console.log(nextmarkno);
        var nextwp = route[nextmarkno].wp;
        var nextmark = {
            id: nextmarkno,
            name: nextwp.name,
            xte: null,
            dtw: null,
            btw: null,
            ttg: null,
            wcv: null,
            laylinebearing: null,
            laylinedistance: null,
            laylinettg: null
        }
        if ( position !== undefined) {
            nextmark.dtw = position.latlon.rhumbDistanceTo(nextwp.latlon);
            nextmark.btw = position.latlon.rhumbBearingTo(nextwp.latlon)*Math.PI/180;
            var ch = undefined;
            if ( position.speed != undefined && position.heading !== undefined) {
                // calculate the wcv
                ch = Math.cos((nextmark.btw-position.heading)*Math.PI/180)
                nextmark.wcv = position.speed*ch;
                nextmark.ttg = nextmark.dtw/nextmark.wcv;
            } 
            // if the dtw is < 50m and the btw, then the waypoint has probably been reached.
            if ( ch !== undefined && ch < 0 && nextmark.dtw < 50) {
                nextmark.advancewp = true;
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


  renderRouteTable() {
    var rows = [];
    for (var i = 0; i < this.state.route.length; i++) {
        var r = this.state.route[i];
        if ( r.wp === undefined ) {
            rows.push(
                    (<tr key={i}>
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
    this.buildRoute(newState, this.state.course);
    this.setState(newState);
  }

  changeCourse(e) {
    var course = e.target.value;
    var newState = {
        course: course
    };
    this.buildRoute(newState, course);
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
    this.buildRoute(newState, this.state.course);
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
    this.buildRoute(newState, this.state.course);
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

  render() {
    return (
        <div className="course" >
        <div className="headding">Inputs</div>
        Course <input name="course" type="text" value={this.state.course} onChange={this.changeCourse} />
        GWD    <input name="gwd" type="number" value={this.state.gwd}  step="1" min="0" max="359"   onChange={this.changeGwd} />
        <div>
        LatLon   <input name="lat" type="text" value={this.state.lat}     onChange={this.changeLat} /> 
        <input name="lon" type="text" value={this.state.lon}     onChange={this.changeLon} />
        <input name="geostate" type="text" value={this.state.geostate}     onChange={this.changeGeostate} />
        {this.state.position.latlon.toString("dm",3)}
        </div>
        <div className="headding">Weather</div>
        <a href="https://weatherfile.com/GBR000014&wt=KTS" >Lymington Starting Platform</a>
        <a href="https://weatherfile.com/RPR000154&wt=KTS" >Ryde Pier</a>
        <a href="https://weatherfile.com/GBR00002&wt=KTS" >Hurst Castle</a>
        <a href="https://weatherfile.com/GBR00004&wt=KTS" >Pool</a>
        <div className="headding">To next mark</div>
        {this.renderCurrent()}
        <div className="headding">Race Plan</div>
                {this.renderRouteTable()}
        <div className="headding">Available Marks</div>
                {this.renderMarksTable()}
        </div>
    );
  }

}

export default Course;