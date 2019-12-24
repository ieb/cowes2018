"use strict";


class KMLWriter  {
    constructor() {
    }

    genPrefix(name) {
      return '<?xml version="1.0" encoding="UTF-8" ?>\n' +
      '<kml xmlns:sg="http://www.sailgrib.com" xmlns="http://www.opengis.net/kml/2.2">\n' +
      '  <Document>\n' +
      '  <name>toneuport.kml</name>\n' +
      '  <description>Powered by SailGrib (http://www.sailgrib.com)</description>\n' +
      '  <ExtendedData xmlns:prefix="sg">\n' +
      '    <sg:version>1.0</sg:version>\n' +
      '  </ExtendedData>\n' +
      '  <Folder>\n' +
      '    <name>'+name+'</name>\n' +
      '    <description></description>\n' +
      '    <ExtendedData xmlns:prefix="sg">\n' +
      '    <sg:type>route</sg:type>\n' +
      '    </ExtendedData>\n';
    }
    genPlacemark(wp) {
      return '     <Placemark>\n' +
      '      <name>'+wp.name+'</name>\n' +
      '      <Point>\n' +
      '        <coordinates>'+wp.lon+','+wp.lat+',0.0</coordinates>\n' +
      '      </Point>\n' +
      '    </Placemark>\n';
    }
    routePrefix() {
      return '    <Placemark>\n' +
      '      <name>Route</name>\n' +
      '      <Description>SailGribRoute</Description>\n' +
      '      <LineString>\n' +
      '        <tessellate>1</tessellate>\n' +
      '        <coordinates>\n';
    }
    genCoord(wp) {
      return "           "+wp.lon+","+wp.lat+",0.0\n";
    }

    routeSuffix() {
      return '        </coordinates>\n' +
      '      </LineString>\n' +
      '    </Placemark>\n';
    }
    genSuffix() {
      return '   </Folder>\n' +
      '  </Document>\n' +
      '</kml>';
    }


    toKml(route, name) {
      var kml = genPrefix(name,"Route");
      for (var i = 0; i < route.length; i++) {
        kml = kml + genPlacemark(route[i].wp);
      };
      kml = kml + routePrefix();
      for (var i = 0; i < route.length; i++) {
        kml = kml + genCoord(route[i].wp);
      };
      kml = kml + routeSuffix();
      kml = kml + genSuffix();
      console.log(kml);
      return {
        kml: kml
      };
    }


    download(route, name) {
    var filename = name.replace(",","_")+."kml";
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(toKml(route, name)));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }



}
export default KMLWriter;