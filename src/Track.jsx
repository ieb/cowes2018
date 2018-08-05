"use strict";

class Track  {
    constructor() {
      this.history = "ts,lat,lon,cog,sog\n";
      this.currentPosition = [];
      this.fileNo = (Date.now()/900000).toFixed(0);
      this.save = this.save.bind(this);
      setInterval(this.save, 15000);
    }

    update(position) {
      this.currentPosition = [
        position.ts,
        position.latlon.lat,
        position.latlon.lon,
        position.heading,
        position.speed
      ];
    }

    save() {
      var n = Date.now();
      var fileNo = (Date.now()/900000).toFixed(0);
      if ( fileNo !== this.fileNo) {
        this.history = "ts,lat,lon,cog,sog\n";
      }
      this.currentPosition[0] = n;
      this.history = this.history+this.currentPosition.join(",")+"\n";
      var k  = 'cowes2018track'+this.fileNo;
      window.localStorage['cowes2018track'+this.fileNo] = this.history;
    }

    load() {
      var keys = [];
      for(var k in window.localStorage) {
        if ( k.startsWith('cowes2018track') ) {
          keys.push(k);
        }
      }
      keys.sort();
      console.log(keys);
      var op = "";
      for (var i = 0; i < keys.length; i++) {
        op = op + window.localStorage[keys[i]];
      };
      console.log(op);
      return op;
    }

    download() {
    var filename = "track.csv";
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.load()));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }

    deleteAll() {
      for(var k in window.localStorage) {
        if ( k.startsWith('cowes2018track') ) {
          window.localStorage.removeItem(k);
          console.log("removed ",k);
        }
      }

    }


}

export default Track;