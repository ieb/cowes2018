"use strict";

import solentMarks from './SolentMarksCowesWeek2018.json';
import { LatLonSpherical as LatLon, Dms } from 'geodesy';
import PolarPerf from './performance.js';

class CoursePlan {
    constructor(props) {
        console.log("CoursePlan props ", props);
        this.course = props.course || "";
        this.gwd = +props.gwd || 0;
        this.gws = +props.gws || 0;
        this.twd = 0;
        this.tws = 0;
        this.polarName = props.polarName || "pogo1250";
        this.current = props.current || 0;
        this.currentDirection = props.currentDirection || 0;
        this.markradius = +props.markradius || 50;
        this.tackvmgangle = +props.tackvmgangle || 42*Math.PI/180;
        this.gybevmgangle = +props.gybevmgangle || 142*Math.PI/180;
        this.calcWind({});
        this.position = props.position || {
           accuracy: 0,
           altitude: null,
           altitudeAccuracy: -1,
           heading: 0,
           speed: 0,
           timestamp: 0,
           latlon: new LatLon(50.78783333,-1.265)
        };
        this.nextmarkidx = props.nextmarkidx || 0;
        this.roundings = {
            "P": "port",
            "S": "starboard",
            "PP": "pass port",
            "PS": "pass starboard",
            "T": "pass through"
        }
        this.loadMarks();
        this.nextmark = {
            idx: -1,
            id: "",
            xte: null,
            dtw: null,
            btw: null,
            wcv: null,
            ttg: null,
            laylinebearing: null,
            laylinedistance: null,
            laylinettg: null
        };
        this.polars = new PolarPerf();
        this.polars.init(this.polarName);
        this.availablePolars = this.polars.availablePolars;
    }    



    update(nextState, update) {
        console.log("Update:", update);
        var doBuildRoute = false, doUpdateNextMark = false, doCalcWind = false;
        if (update.polarName) {
            this.polars.init(update.polarName);
            this.polarName = update.polarName;
            doBuildRoute = true;
        }
        if ( update.force ) {
            doCalcWind = true;
            doBuildRoute = true;
        }
        if ( update.markradius !== undefined ) {
            this.markradius = update.markradius;
        }
        if (update.position !== undefined) {
            this.position = update.position;
            doUpdateNextMark = true;
        }
        if ( update.nextmarkidx !== undefined && update.nextmarkidx !== this.nextmarkidx) {
            this.nextmarkidx = update.nextmarkidx;
            doUpdateNextMark = true;
        }
        if ( update.gwd !== undefined && update.gwd !== this.gwd) {
            this.gwd = update.gwd;
            nextState.gwd = this.gwd;
            doCalcWind = true;
            doBuildRoute = true;
        }
        if ( update.gws !== undefined && update.gws !== this.gws) {
            this.gws = update.gws;
            nextState.gws = this.gws;
            doCalcWind = true;
            doBuildRoute = true;
        }
        if ( update.current !== undefined && update.current !== this.current) {
            this.current = update.current;
            nextState.current = this.current;
            doCalcWind = true;
            doBuildRoute = true;
        }
        if ( update.currentDirection !== undefined && update.currentDirection !== this.currentDirection) {
            this.currentDirection = update.currentDirection;
            nextState.currentDirection = this.currentDirection;
            doCalcWind = true;
            doBuildRoute = true;
        }
        if ( update.course !== undefined && update.course !== this.course) {
            this.course = update.course;
            doBuildRoute = true;
        }
        if ( doCalcWind ) {
            this.calcWind(nextState);
        }
        if ( doBuildRoute ) {
            this.buildRoute(nextState);
        } else if ( doUpdateNextMark ) {
            this.updateNextmark(nextState);
        }
    }



  // load marks from a cut and paste in the settings, or use a default
    loadMarks() {
        console.log("loading marks from ",solentMarks);
        this.marksDb = {};
        var idx = {};
        for (var i = 1; i < solentMarks.length; i++) {
            var mark = solentMarks[i]
            this.marksDb[mark.name] = {
                name: mark.name,
                desc: mark.desc,
                sym: mark.sym,
                latlon: new LatLon(mark.lat, mark.lon)
            }
        };
    }

    calcWind(newState) {
        // inputs are GWD, GWS, Current and Current Direction.
        // GWD is where the wind is blowing from, whereas Current direction is where the current is flowing to
        // hence add the vectors.
        // calculate TWD, TWS
        var xy = [];
        xy = [ Math.sin(this.gwd)*this.gws, Math.cos(this.gwd)*this.gws];
        xy = [ xy[0]+(Math.sin(this.currentDirection)*this.current), xy[1]+Math.cos(this.currentDirection)*this.current];
        if ( xy[0] === 0 && xy[1] === 0 ) {
            this.twd = this.gwd;
            this.tws = this.gws;
        } else {
            this.twd = (Math.atan2(xy[0], xy[1])+2*Math.PI)%(2*Math.PI);
            this.tws = Math.sqrt(xy[0]*xy[0]+xy[1]*xy[1]);
        }
        newState.twd = this.twd;
        newState.tws = this.tws;
        newState.gws = this.gws;
        newState.gwd = this.gwd;
        newState.current = this.current;
        newState.currentDirection = this.currentDirection;
    }

    buildRoute(newState) {
        var newroute = [];
        var ids = this.course.trim().replace("\n",",").split(",");
        console.log("Building route for ", this.course, " as ", ids);
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i].toUpperCase();
          if ( id == '') {
            console.log("ID is empty ", id);
            continue;
          }
          var wp = this.marksDb[id.substring(0,2)];
          var name = undefined;
          if (wp !== undefined) {
            name = wp.name;
          }
          var obj =  { 
            id: id.substring(0,2),
            spec: id,
            name: name,
            rounding: this.roundings[id.substring(2)],
            wp: wp
          };
          newroute.push(obj);
        };
        // calc distances and bearings.
        var total = 0;
        this.calcBTWDTW(newroute[0],this.position);
        for (var i = 1; i < newroute.length; i++) {
            newroute[i].dist = total;
            this.calcBTWDTW(newroute[i], newroute[i-1].wp );
            total = total + newroute[i].dtw;
        }

        this.route = newroute;
        this.updateDynamic();
        this.updateNextmark(newState);
        newState.route = this.route;
        newState.routeVersion = Date.now();
    }

    calcBTWDTW(routeMark, fromLatlon) {
        if ( fromLatlon !== undefined && routeMark !== undefined && routeMark.wp !== undefined ) {
            routeMark.dtw = fromLatlon.latlon.rhumbDistanceTo(routeMark.wp.latlon);
            routeMark.btw = fromLatlon.latlon.rhumbBearingTo(routeMark.wp.latlon)*Math.PI/180.0; // in radians                
        }
    }

    toRelativeAngle(r) {
        if ( r > Math.PI ) {
            return r - 2*Math.PI; 
        } else if ( r < -Math.PI) {
            return r + 2*Math.PI;
        }
        return r;
    }

    // need to take into account the current vector before calculating the
    // layline.
    // Also need boat speed at vmg angle.
    // for which we need the polar
    // once we have those, work back from the mark.
    // reverse the current, then reverse the track, using a 10min approach line

    updateDynamic() {
        if ( this.route.length  > 0) {
            this.calcBTWDTW(this.route[0],this.position);
            for (var i = 0; i < this.route.length; i++) {
                var mark = this.route[i];
                if ( mark !== undefined && mark.wp !== undefined) {
                    mark.twa = this.toRelativeAngle(this.twd - mark.btw); 
                    mark.polars = this.polars.calc(this.tws, mark.twa);
                     // calculate the starting point of the tidal vector.
                    // we want the layline possitions to be 5min out so multiply all speeds by 300 as speed is in m/s
                    mark.tidePoint = mark.wp.latlon.destinationPoint(this.current*300,this.toDeg(this.currentDirection+Math.PI));
                    if ( mark.twa < Math.PI/2 && mark.twa > -Math.PI/2 ) {
                        // calculate the starting point of the LL
                        mark.stbdLLStart = mark.tidePoint.destinationPoint(mark.polars.targets.stw*300,this.toDeg(this.twd-this.tackvmgangle+Math.PI));
                        mark.portLLStart = mark.tidePoint.destinationPoint(mark.polars.targets.stw*300,this.toDeg(this.twd+this.tackvmgangle+Math.PI));

                        mark.tack = true;
                        // calculate the bearings to the waypoint using the tidal vector calculations
                        mark.stbdLLBTW = mark.stbdLLStart.rhumbBearingTo(mark.wp.latlon) * Math.PI/180;
                        mark.portLLBTW = mark.portLLStart.rhumbBearingTo(mark.wp.latlon) * Math.PI/180;
                    } else {
                        mark.stbdLLStart = mark.tidePoint.destinationPoint(mark.polars.targets.stw*300,this.toDeg(this.twd-this.gybevmgangle+Math.PI));
                        mark.portLLStart = mark.tidePoint.destinationPoint(mark.polars.targets.stw*300,this.toDeg(this.twd+this.gybevmgangle+Math.PI));
                        mark.tack = false;
                        mark.stbdLLBTW = mark.stbdLLStart.rhumbBearingTo(mark.wp.latlon) * Math.PI/180;
                        mark.portLLBTW = mark.portLLStart.rhumbBearingTo(mark.wp.latlon) * Math.PI/180;
                    }
                    mark.twd = this.twd;
                    mark.tws = this.tws;
                    mark.gwd = this.gwd;
                    mark.gws = this.gws;
                    mark.tackvmgangle = this.tackvmgangle;
                    mark.gybevmgangle = this.gybevmgangle;                    
                    mark.twdDeg = mark.twd*180/Math.PI;
                    mark.gwdDeg = mark.gwd*180/Math.PI;
                    mark.twaDeg = mark.twa*180/Math.PI;
                    mark.stbdLLBTWDeg = mark.stbdLLBTW*180/Math.PI;
                    mark.portLLBTWDeg = mark.portLLBTW*180/Math.PI;
                    mark.tackvmgangleDeg = mark.tackvmgangle*180/Math.PI;
                    mark.gybevmgangleDeg = mark.gybevmgangle*180/Math.PI;
                }
            }            
        }
    }

    updateNextmark(newState) { // depends on twd, 
        var route = newState.route || this.route;
        if ( route.length === 0 ) {
            return;
        }
        this.updateDynamic(route);
        var oldmarkno = this.nextmarkidx;
        if ( this.nextmarkidx === undefined || this.nextmarkidx < 0 ) {
            this.nextmarkidx = 0;
        }
        if ( this.nextmark.advancewp ) {
            this.nextmarkidx++;
        }
        if ( this.nextmarkidx >= route.length ) {
            this.nextmarkidx = route.length-1;
        }
        var nextrouteentry =  route[this.nextmarkidx];
        var nextwp = route[this.nextmarkidx].wp;
        var nextmark = {
            idx: this.nextmarkidx,
            id: route[this.nextmarkidx].id,
            xte: null,
            dtw: null,
            btw: null,
            ttg: null,
            wcv: null,
        }
        if ( this.position !== undefined && nextwp !== undefined) {
            nextmark.dtw = this.position.latlon.rhumbDistanceTo(nextwp.latlon);
            nextmark.btw = this.position.latlon.rhumbBearingTo(nextwp.latlon)*Math.PI/180;
            nextmark.twa = this.toRelativeAngle(this.twd - nextmark.btw); 
            var ch = undefined;
            if ( nextmark.dtw < this.markradius ) {
                // distance to wp is less than radius, waypoint reached.
                nextmark.advancewp = true;                
            }
            if ( this.position.speed != undefined && this.position.heading !== undefined) {
                // calculate the wcv

                ch = Math.cos(nextmark.btw-this.position.heading);
                nextmark.wcv = this.position.speed*ch;
                nextmark.ttg = nextmark.dtw/nextmark.wcv;
            } 
            var angle, ll;
            if ( Math.abs(nextmark.twa) < this.tackvmgangle && nextrouteentry.portLLBTW !== undefined) {
                // tacking required, laylines needed, there are 2 laylines,

                angle = this.tackvmgangle;
                nextmark.tackll = ll = {
                    port : {
                        btw: nextrouteentry.portLLBTW
                    },
                    stbd: {
                        btw: nextrouteentry.stbdLLBTW
                    }
                }
                // angle between the btw and the layline indicates which sector.
                var porttobtw =  (2*Math.PI+ll.port.btw-nextwp.btw)%2*Math.PI;
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
                this.calcIntesects(ll, nextwp);
            } else if ( Math.abs(nextmark.twa) > this.gybevmgangle && nextrouteentry.portLLBTW !== undefined) {
                angle = this.gybevmgangle;
                nextmark.gybell = ll = {
                    port : {
                        btw: nextrouteentry.portLLBTW
                    },
                    stbd: {
                        btw: nextrouteentry.stbdLLBTW
                    }
                }
                var porttobtw =  (2*Math.PI+ll.port.btw-nextwp.btw)%2*Math.PI;
                if ( porttobtw < this.gybevmgangle) {
                    // over port layline
                    ll.portover = true;
                } else if (porttobtw < 2*Math.PI-2*(Math.PI-this.gybevmgangle)) {
                    // over starboard layline
                    ll.stdbover = true;
                } else {
                    // between laylines
                    ll.between = true;
                }
                this.calcIntesects(ll, nextwp);

            }
        }
        this.nextmark = nextmark;
        newState.nextmark = nextmark;
    }

    toDeg(x) {
        return ((x+(2*Math.PI))%(2*Math.PI)) * 180/Math.PI;
    }

    calcIntesects(ll, nextwp) {
        // calculate the distance to both laylines using the target twa, which is parallel to the layline
        var pintersect = ll.port.intersect = {
            latlon: LatLon.intersection(this.position.latlon, this.toDeg(ll.stbd.btw), nextwp.latlon, this.toDeg(ll.port.btw-Math.PI))
        };
        var sintersect = ll.stbd.intersect = {
            latlon: LatLon.intersection(this.position.latlon, this.toDeg(ll.port.btw), nextwp.latlon, this.toDeg(ll.stbd.btw-Math.PI))
        };
        if ( pintersect.latlon !== null ) {
            pintersect.dti = this.position.latlon.rhumbDistanceTo(pintersect.latlon);
            pintersect.itw = pintersect.latlon.rhumbDistanceTo(nextwp.latlon);
            ll.port.dtw = pintersect.dti + pintersect.itw;
            if ( this.position.speed > 0.1) {
                ll.port.ttg = ll.port.dtw/this.position.speed;
            } else {
                ll.port.ttg = -1;
            }

        } 
        if ( sintersect.latlon !== null ) {
            sintersect.dti = this.position.latlon.rhumbDistanceTo(sintersect.latlon);
            sintersect.itw = sintersect.latlon.rhumbDistanceTo(nextwp.latlon);
            ll.stbd.dtw = sintersect.dti + sintersect.itw;
            if ( this.position.speed > 0.1) {
                ll.stbd.ttg = ll.stbd.dtw/this.position.speed;
            } else {
                ll.stbd.ttg = -1;
            }

        }


        // calculate the distance to both laylines using the current heading
        var phead = ll.port.heading = {
            latlon: LatLon.intersection(this.position.latlon, this.toDeg(this.position.heading), nextwp.latlon, this.toDeg((ll.port.btw-Math.PI)%(2*Math.PI)))
        };
        var shead = ll.stbd.heading = {
            latlon: LatLon.intersection(this.position.latlon, this.toDeg(this.position.heading), nextwp.latlon, this.toDeg((ll.stbd.btw-Math.PI)%(2*Math.PI)))
        };
        if ( shead.latlon !== null ) {
            shead.dti = this.position.latlon.rhumbDistanceTo(shead.latlon);
            phead.itw = shead.latlon.rhumbDistanceTo(nextwp.latlon);
            phead.tti = shead.dti/this.position.speed;
            phead.ttw = (shead.dti+shead.itw)/this.position.speed;
        } else {
            console.warn("No Intesect to starboard");
        }
        if ( phead.latlon !== null ) {
            phead.dti = this.position.latlon.rhumbDistanceTo(phead.latlon);
            shead.itw = phead.latlon.rhumbDistanceTo(nextwp.latlon);            
            shead.tti = phead.dti/this.position.speed;
            shead.ttw = (phead.dti+phead.itw)/this.position.speed;
        } else {
            console.warn("No Intesect to port");
        }

    }
}

export default CoursePlan;
