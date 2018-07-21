/*jshint node:true */
"use strict";

import React from 'react';
import {render} from 'react-dom';
import Course from './Course.jsx';
import './style.css';





class App extends React.Component {
  constructor(props) {
        super(props);
        this.props = props;
        this.sourcePriority = props.sourcePriority;
        var self = this;
        this.state = {
        };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }


  render () {
    console.log("Starting to render");
    return ( 
        <div>
          <Course />
        </div>
    );
  }
}

//  <Calculations  databus={this.databus} sourceId="nmeaFromFile.II" />

const element = <App sourcePriority="" ></App>;    

console.log("Now Running");
render(element, document.getElementById("react"));
