"use strict";

class GPXWriter  {
    constructor() {
    }
    genPrefix(name) {
      return '<gpx version="1.0">\n' +
        '<name>'+name+'</name>\n';
    }


    getWp(wp) {
      return '<wpt lat="'+wp.lat+'" lon="'+wp.lon+'">\n' +
        '  <ele>'+wp.name+'</ele>\n' +
        '  <name>'+wp.name+' '+wp.desc+'</name>\n' +
        '</wpt>\n';
    }

    toDate(ts) {
      // 2007-10-14T10:14:08Z
    }

    getTrack(trackItem) {
      return '<trkpt lat="'+trackItem.lat+'" lon="'+trackItem.lon+'"><ele>'+trackItem.n+'</ele><time>'+this.toDate(trackItem.ts)+'</time></trkpt>';
    }

    genTrack(trackItem) {
      return '</trkseg></trk></gpx>';
    }

    getTrackPrefix(name) {
      return '<gpx version="1.0">\n' +
        '<name>'+name+'</name>\n' +
        '<trk><name>'+name+'</name><number>1</number><trkseg>\n';
    }

    genTrackSuffix() {
      return ''</trkseg></trk></gpx>';
    }

    genSuffix() {
      return '</gpx>\n';
    }
    toGpx(route, name) {
      var gpx = genPrefix(name);
      for (var i = 0; i < route.length; i++) {
        gpx = gpx + getWp(route[i].wp);
      };
      gpx = gpx + genSuffix();
      console.log(gpx);
      return {
        gpx: gpx
      };
    }

    toGpxTrack(track, name) {
    var gpx = genTrackPrefix(name)
      for (var i = 0; i < route.length; i++) {
        gpx = gpx + genTrack(track[i]);
      };
      gpx = gpx + genTrackSuffix();

    }
    downloadRoute(route, name) {
      var filename = name.replace(",","_")+".gpx";
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(toGpx(route, name)));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    downloadTrack(track, name) {
      var filename = name.replace(",","_")+"track.gpx";
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(toGpxTrack(track, name)));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
}
export default GPXWriter;