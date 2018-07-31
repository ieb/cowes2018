Builds a course and calcualtes various bearings, distances in real time from the mobile device GPS using he Mark IDs sent out over SMS during cowes week. 

Uses manual input of GWD/GWS and Tidal current speed and direction, working everythng else out.


The application runs as a single page html file, once donwloaded it uses Open Layers and Open Sea Map for cartography. If the tiles have been cached, no network access is required. The state is stored in local storage so the application can be refreshed 
in the browser without loosing any settings. Tested on a Google Nexus in Chrome and a Desktop Chrome browser, and iOS Safari.

![Chart](https://raw.githubusercontent.com/ieb/cowes2018/master/screenshots/Chart.png)

![Numbers](https://raw.githubusercontent.com/ieb/cowes2018/master/screenshots/Numbers.png)


Hosted version is at https://ieb.github.io/marks 

[X] Fix bug with refreshing vectors when WP advances, (work arround, touch gwd)
[X] Fix bug with advancing the route where the marker doesnt advance
[X] Fix bug with retarding the route where the laylines get stuck.
[ ] Add Polar targets, needs polar lib from sailininstruments to be integrated.
[X] Switch from Google Maps to OpenLayers + Open Sea Map.


