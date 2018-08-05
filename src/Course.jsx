/*jshint node:true */
"use strict";

import React from 'react';
//import GMap from './GMap.jsx';
import OSMap from './OSMap.jsx';
import Track from './Track.jsx';
import CoursePlan from './CoursePlan.jsx';
import { LatLonSpherical as LatLon, Dms } from 'geodesy';
import Qty from 'js-quantities';
import './course.css';


const radToDeg = Qty.swiftConverter('rad', 'deg');
const mToNm = Qty.swiftConverter('m', 'nmi');
const mToKn = Qty.swiftConverter('m/s', 'kn');
const hashTrans = {
    course: "cowes2018Course",
    gwd: "cowes2018gwd",
    gws: "cowes2018gws",
    gdc: "cowes2018currentDirection",
    gcs: "cowes2018current",
    gv: "cowes2018Gybeangle",
    tv: "cowes2018Tackangle",
    pn: "cowes2018polarname",
    id: "cowes2018nextmarkidx"
}

class Course extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.stateLiseners = [];
    /*
    this.gmap = new GMap("AIzaSyC1R7_R3evqRM6gsl1MTrORvGGFtbg9BjY");
    this.addStateListener(this.gmap);
    */
    this.track = new Track();
    this.loadHash();
    this.coursePlan = new CoursePlan({
        gwd: (+window.localStorage.cowes2018gwd || 0)*Math.PI/180,
        course: window.localStorage.cowes2018Course || "",
        markradius: window.localStorage.cowes2018Markradius || 0,
        tackvmgangle: (+window.localStorage.cowes2018Tackangle || 42 )*Math.PI/180,
        gybevmgangle: (+window.localStorage.cowes2018Gybeangle || 142)*Math.PI/180,
        gws: (+window.localStorage.cowes2018gws || 0)*0.514444,
        current: (+window.localStorage.cowes2018current || 0)*0.514444,
        currentDirection: (+window.localStorage.cowes2018currentDirection || 0)*Math.PI/180,
        polarName: window.localStorage.cowes2018polarname || "pogo1250",
        nextmarkidx: window.localStorage.cowes2018nextmarkidx || 0
    });
    this.bouys = {
        "BY": "N BY",
        "BYB": "E BYB",
        "YB": "S YB",
        "YBY": "W YBY"
    }
    this.state = {
        polarName: this.coursePlan.polarName,
        gwd: this.coursePlan.gwd,
        gwdInput: this.coursePlan.gwd*180/Math.PI,
        gws: this.coursePlan.gws,
        gwsInput: this.coursePlan.gws/0.514444,
        twd: this.coursePlan.twd,
        tws: this.coursePlan.tws,
        current: this.coursePlan.current,
        currentInput: this.coursePlan.current/0.514444,
        currentDirection: this.coursePlan.currentDirection,
        currentDirectionInput: this.coursePlan.currentDirection*180/Math.PI,
        course: this.coursePlan.course,
        markradius: this.coursePlan.markradius,
        tackvmgangle: this.coursePlan.tackvmgangle,
        tackvmgangleInput: this.coursePlan.tackvmgangle*180/Math.PI,
        gybevmgangle: this.coursePlan.gybevmgangle,
        gybevmgangleInput: this.coursePlan.gybevmgangle*180/Math.PI,
        marksDb: this.coursePlan.marksDb,
        position: this.coursePlan.position,
        lat: "",
        lon: "",
        geostate: "init",
        displayChart: window.localStorage.cowes2018DisplayChart == "true",
        displayInputs: window.localStorage.cowes2018DisplayInputs === "true",
        displayRacePlan: window.localStorage.cowes2018DisplayRacePlan  === "true",
        displayChart: window.localStorage.cowes2018DisplayChart  === "true",
        displayMarks: window.localStorage.cowes2018DisplayMarks  === "true",
        markradius: +window.localStorage.cowes2018Markradius || 50,
    }
    this.coursePlan.update(this.state,{ force: true});
    console.log("Initial state ", this.state.route.slice());

    this.changeGwd = this.changeGwd.bind(this);
    this.changeCourse = this.changeCourse.bind(this);
    this.getLocation = this.getLocation.bind(this);
    this.positionError = this.positionError.bind(this);
    this.changeGeostate = this.changeGeostate.bind(this);
    this.changeMarkradius = this.changeMarkradius.bind(this);
    this.changeGws = this.changeGws.bind(this);
    this.changeCurrent = this.changeCurrent.bind(this);
    this.changePolar = this.changePolar.bind(this);
    this.changeCurrentDirection = this.changeCurrentDirection.bind(this);
    this.changeTackVMGAngle = this.changeTackVMGAngle.bind(this);
    this.changeGybeVMGAngle = this.changeGybeVMGAngle.bind(this);
    this.toggleMarks = this.toggleMarks.bind(this);
    this.toggleChart = this.toggleChart.bind(this);
    this.toggleRacePlan = this.toggleRacePlan.bind(this);
    this.toggleInputs = this.toggleInputs.bind(this);
    this.downloadTrack = this.downloadTrack.bind(this);
    this.resetTrack = this.resetTrack.bind(this);



    this.nextWp = this.nextWp.bind(this);
    this.prevWp = this.prevWp.bind(this);
    if (true) {
        // real positoin
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(this.getLocation, this.positionError, {
                enableHighAccuracy: true, 
                maximumAge        : 30000, 
                timeout           : 27000
            });
        }        
    } else {
        // fake position for testing.
        var self = this;
        setTimeout(() => {
            var position = {
                coords: {
                    accuracy: self.state.position.accuracy,
                    altitude: self.state.position.altitude,
                    altitudeAccuracy: self.state.position.altitudeAccuracy,
                    heading: 90, // self.state.position.heading,
                    speed: 4.11, // self.state.position.speed,                
                    latitude: 50.78783333, //self.state.position.latlon.lat,
                    longitude: -1.265 //self.state.position.latlon.lon
                },
                timestamp: Date.now()
            }
            self.getLocation(position);
        }, 2000)
    }

  }


    loadHash() {
        var hash = window.location.hash;
        if ( hash !== undefined && hash.length > 1) {
            var parts = hash.substring(1).split(';');
            console.log("Hash is ", hash, parts);
            for (var i = 0; i < parts.length; i++) {
                var kv = parts[i].split("=");
                if ( kv[0] == "reset") {
                    console.log("Reset settings");
                    window.localStorage.clear();
                } else if ( hashTrans[kv[0]] !== undefined ) {
                    window.localStorage[hashTrans[kv[0]]] = kv[1];
                    console.log(kv[0], hashTrans[kv[0]], " set to ", kv[1]);
                }
            };
        }

    }
    getHash() {
        var kv = []
        for( var k in hashTrans ) {
            kv.push(k+"="+window.localStorage[hashTrans[k]]);
        }
        return "#"+kv.join(";");
    }



  componentDidMount() {
    if ( this.gmap !== undefined ) {
        var self = this;
        this.gmap.init(() => {
            self.gmap.update(this.state);
        });        
    }
  }



  componentWillReceiveProps(nextProps) {
  }

  componentWillUnmount() {
  }


  positionError(error) {
    this.setState({
        geostate: "no fix"+error.message
    });
    console.log("Position Fix"+error);
  }

  getLocation(gpsposition) {
    if ( !this.state.geostate !== "user" ) {
        console.log("Got position", gpsposition);
        var position = {
            accuracy: gpsposition.coords.accuracy,
            altitude: gpsposition.coords.altitude,
            altitudeAccuracy: gpsposition.coords.altitudeAccuracy,
            heading: gpsposition.coords.heading*Math.PI/180,
            speed: gpsposition.coords.speed,
            timestamp: gpsposition.timestamp,
            latlon: new LatLon(gpsposition.coords.latitude, gpsposition.coords.longitude)
        }
        var newState = {
            lat: Dms.toLat(position.latlon.lat, "dm", 3),
            lon: Dms.toLon(position.latlon.lon, "dm", 3),
            position: position,
            geostate: "fix"
        }
        this.track.update(position);
        this.coursePlan.update(newState, {
            position: position
        });
        window.localStorage.cowes2018nextmarkidx = this.coursePlan.nextmarkidx;
        console.log("Possition Update");
        this.setState(newState);
    }
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
        return mToKn(b).toFixed(2)+" kn";
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
    var np = -1;
    if ( this.state.nextmark !== undefined ) {
        np = this.state.nextmark.idx;
    }
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
                    <td>{this.radToDisplay(r.twa)}</td>
                    <td>{this.msToDisplay(r.polars.stw)}</td>
                    <td>{this.radToDisplay(r.polars.targets.twa)}</td>
                    <td>{this.msToDisplay(r.polars.targets.stw)}</td>
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
                        <th>STW</th>
                        <th>TTWA</th>
                        <th>TSTW</th>
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
    console.log("Render Current ", this.state.nextmark)
    if ( this.state.route.length === 0 || this.state.nextmark.idx == undefined || this.state.route[this.state.nextmark.idx] == undefined) {
        return (
            <div>No route defined</div>
        )
    } else {
        var ll;
        if ( this.state.nextmark.tackll ) {
            ll = this.state.nextmark.tackll
        } else if ( this.state.nextmark.gybell ) {
            ll = this.state.nextmark.gybell;
        } else {
            ll = {
                port: {
                    btw: undefined,
                    dtw: undefined,
                    ttg: undefined
                },
                stbd: {
                    btw: undefined,
                    dtw: undefined,
                    ttg: undefined
                }
            };
        }

        return (
            <table className="current">
                <tbody>
                    <tr>
                        <th>ID</th>
                        <th>DTW</th>
                        <th>BTW</th>
                        <th>WCV</th>
                        <th>TTG</th>
                        <th>PBTW</th>
                        <th>PDTW</th>
                        <th>PTTG</th>
                        <th>SBTW</th>
                        <th>SDTW</th>
                        <th>STTG</th>
                    </tr>
                    <tr>
                        <td>{this.state.nextmark.id}</td>
                        <td>{this.mToDisplay(this.state.nextmark.dtw)}</td>
                        <td>{this.radToDisplay(this.state.nextmark.btw)}</td>
                        <td>{this.msToDisplay(this.state.nextmark.wcv)}</td>
                        <td>{this.durationToDisplay(this.state.nextmark.ttg)}</td>
                        <td>{this.radToDisplay(ll.port.btw)}</td>
                        <td>{this.mToDisplay(ll.port.dtw)}</td>
                        <td>{this.durationToDisplay(ll.port.ttg)}</td>
                        <td>{this.radToDisplay(ll.stbd.btw)}</td>
                        <td>{this.mToDisplay(ll.stbd.dtw)}</td>
                        <td>{this.durationToDisplay(ll.stbd.ttg)}</td>
                    </tr>
                </tbody>
            </table>
        );

    }

  }

  /*** Input listeners ------------------------------------------------------- */

  changeGwd(e) {
    var gwd = e.target.value;
    var newState = {
        gwdInput: gwd
    };
    window.localStorage.cowes2018gwd = gwd;
    this.coursePlan.update(newState, {
        gwd: (+gwd)*Math.PI/180
    });
    this.setState(newState);
  }

  changeGws(e) {
    var gws = e.target.value;
    var newState = {
        gwsInput: gws
    };
    window.localStorage.cowes2018gws = gws;
    this.coursePlan.update(newState, {
        gws: (+gws)*0.514444
    });
    this.setState(newState);
  }
  changeCurrent(e) {
    var current = e.target.value;
    var newState = {
        currentInput: current
    };
    window.localStorage.cowes2018current = current;
    this.coursePlan.update(newState, {
        current: (+current)*0.514444
    });
    this.setState(newState);
  }
  changeCurrentDirection(e) {
    var currentDirection = e.target.value;
    var newState = {
        currentDirectionInput: currentDirection
    };
    window.localStorage.cowes2018currentDirection = currentDirection;
    this.coursePlan.update(newState, {
        currentDirection: (+currentDirection)*Math.PI/180
    });
    this.setState(newState);
  }

  changeTackVMGAngle(e) {
    var tackvmgangle = e.target.value;
    var newState = {
        tackvmgangleInput: tackvmgangle
    };
    window.localStorage.cowes2018Tackangle = tackvmgangle;
    this.coursePlan.update(newState, {
        tackvmgangle: (+tackvmgangle)*Math.PI/180
    });
    this.setState(newState);
  }
  changeGybeVMGAngle(e) {
    var gybevmgangle = e.target.value;
    var newState = {
        gybevmgangleInput: gybevmgangle
    };
    window.localStorage.cowes2018Gybeangle = gybevmgangle;
    this.coursePlan.update(newState, {
        gybevmgangle: (+gybevmgangle)*Math.PI/180
    });
    this.setState(newState);
  }

  changeCourse(e) {
    var course = e.target.value;
    var newState = {
        course: course
    };
    window.localStorage.cowes2018Course = course;
    this.coursePlan.update(newState, {
        course: course
    });
    this.setState(newState);
  }
  changeMarkradius(e) {
    var markradius = e.target.value;
    var newState = {
        markradius: markradius
    };
    window.localStorage.cowes2018Markradius = markradius;
    this.coursePlan.update(newState, {
        markradius: +markradius
    });
    this.setState(newState)
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

  addStateListener(l) {
    this.stateLiseners.push(l);
  }

  removeStateListener(l) {
    var newListeners = [];
    for (var i = 0; i < this.stateLiseners.length; i++) {
        if ( this.stateLiseners[i] !== l ) {
            newListeners.push(this.stateLiseners[i]);
        }
    };
    console.log("New Listerners are ",newListeners);
    this.stateLiseners = newListeners;
  }
 

  notifyStateListeners() {
    for (var i = 0; i < this.stateLiseners.length; i++) {
        this.stateLiseners[i].update(this.state);
    };
  }



  nextWp() {
    var newState = {};
    var nm = this.state.nextmark.idx || 0;
    nm++;
    this.coursePlan.update(newState, {
        nextmarkidx: nm
    });
    window.localStorage.cowes2018nextmarkidx = this.coursePlan.nextmarkidx;
    this.setState(newState);
  }
  prevWp() {
    var newState = {};
    var nm = this.state.nextmark.idx || 0;
    nm--;
    this.coursePlan.update(newState, {
        nextmarkidx: nm
    });
    window.localStorage.cowes2018nextmarkidx = this.coursePlan.nextmarkidx;
    this.setState(newState);
  }


  /*** section visibility ------------------------------------------------------- */


  // could tdo this in a component, but I am being lazy
  toggleMarks() {
    window.localStorage.cowes2018DisplayMarks = !this.state.displayMarks;
    this.setState({ displayMarks: !this.state.displayMarks});
  }


  displayMarks() {
    if ( this.state.displayMarks ) {
        if ( this.gmap !== undefined ) {
            this.gmap.plotMarks(this.state.marksDb);            
        }
        return (
            <div>
            <div className="headding" onClick={this.toggleMarks}>{"\u25BF"} Available Marks</div>
                {this.renderMarksTable()}
            </div>
       );
    } else {
        if ( this.gmap !== undefined ) {
            this.gmap.clearMarks();
        }
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
        if ( this.gmap === undefined ) {
            return (<div>
                <div className="headding" onClick={this.toggleChart}>{"\u25BF"} Chart</div>
                <OSMap mapid="osmap" app={this} ></OSMap>
                </div>);
        } else {
            return (
                <div>
                <div className="headding" onClick={this.toggleChart}>{"\u25BF"} Chart</div>
                <div id="map" ></div>
                </div>
                );
        }
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

  toggleInputs() {
    window.localStorage.cowes2018DisplayInputs = !this.state.displayInputs;
    this.setState({ displayInputs: !this.state.displayInputs});
  }

  changePolar(e) {
    var newState = {
        polarName: e.target.value
    };
    this.coursePlan.update(newState, { polarName: e.target.value});
    window.localStorage.cowes2018polarname = e.target.value;
    this.setState(newState);
  }

  getPolarOptions() {
    var options = [];
    for (var i = 0; i < this.coursePlan.availablePolars.length; i++) {
        var n = this.coursePlan.availablePolars[i];
        options.push((<option key={n} value={n}>{n}</option>));
    };
    return (
        <select onChange={this.changePolar} value={this.state.polarName} >
        {options}
        </select>
        );
  }


  displayInputs() {
    if ( this.state.displayInputs ) {
        return (
            <div>
            <div className="headding" onClick={this.toggleInputs}>{"\u25BF"} Inputs</div>
                <div>
                    Course <input name="course" type="text" value={this.state.course} onChange={this.changeCourse} />
                    <a href={this.getHash()} > copy url to share </a>
                    <button onClick={this.downloadTrack} >Download Track</button>
                    <button onClick={this.resetTrack} >Reset Track</button>
                </div><div>
                    <span>gwd:<input name="gwd" type="number" value={this.state.gwdInput}  step="1" min="0" max="359"   onChange={this.changeGwd} /></span>
                    <span>gws:<input name="gws" type="number" value={this.state.gwsInput}  min="0" max="100"   onChange={this.changeGws} /></span>
                    <span>twd:{this.radToDisplay(this.state.twd)}</span>
                    <span>tws:{this.msToDisplay(this.state.tws)}</span>
                </div><div>
                    <span>Current speed:<input name="current" type="number" value={this.state.currentInput}   min="0"   max="100" onChange={this.changeCurrent} /></span>
                    <span>dir:<input name="currentdeg" type="number" value={this.state.currentDirectionInput}   step="1" min="0" max="359"   onChange={this.changeCurrentDirection} /></span>
                </div><div>
                    <span>Target VMG TWA Upwind:<input name="tackvmgangleInput" type="number" value={this.state.tackvmgangleInput}   step="1" min="0" max="90"   onChange={this.changeTackVMGAngle} /></span>
                    <span>Downwind:<input name="gybevmgangleInput" type="number" value={this.state.gybevmgangleInput}   step="1" min="90" max="180"   onChange={this.changeGybeVMGAngle} /></span>
                </div><div>
                    <span>WP Radius:<input name="markradius" type="number" value={this.state.markradius}  min="0"  max="100"  onChange={this.changeMarkradius} /></span>
                    <span>Advance:<button onClick={this.prevWp}>Previous</button><button onClick={this.nextWp}>Next</button></span>
                </div>
                <div>
                    {this.getPolarOptions()}
                </div>
            </div>
       );
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


  /** Google Maps plotting ---------------------------------------------------------*/


  downloadTrack() {
    this.track.download();
  }
  resetTrack() {
    this.track.deleteAll();
  }





  render() {
    this.notifyStateListeners();
    return (
        <div className="course" >
        {this.displayChart()}
        <hr/>
        <div>
            <span>Position:{this.state.position.latlon.toString("dm",3)} {this.fixStatus()}</span>
            <span>SOG:{this.msToDisplay(this.state.position.speed)}</span>
            <span>COG:{this.radToDisplay(this.state.position.heading)}</span>
            <span>ts:{this.state.position.timestamp}</span>
        </div>
        {this.displayInputs()}
        {this.renderCurrent()}
        {this.displayRacePlan()}
        {this.displayMarks()}
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