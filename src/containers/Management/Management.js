import React, { Component } from 'react';
import {connect} from 'react-redux';
import fetch from 'isomorphic-fetch';
import _ from 'lodash';
import {push} from 'react-router-redux';

const styles = {
  surveysContainer: {
    display: 'flex',
    flex: 1,
    marginTop: 10,
    marginLeft: 20,
    flexWrap: 'wrap'
  },
  surveyContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    border: '1px solid black',
    width: 300,
    margin: 10,
    flexShrink: 0
  },
  surveyHeader: {
    fontSize: 16,
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: 10
  },
  stats: {
    display: 'flex',
    padding: '5px 0px',
    alignItems: 'center'
  },
  actionContainer: {
    display: 'flex',
    margin: '20px 0px'
  }
};

@connect(() => {}, {push})
export default class Home extends Component {
  constructor() {
    super();
    this.state = {
      surveys: []
    };
  }
  componentWillMount() {
    fetch('https://89e3877e.ngrok.io/surveys')
    .then((res) => res.json())
    .then(({results}) => this.setState({surveys: results}));
  }
  render() {
    return (
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: 30
      }}>
        <div style={{display: 'flex'}}>
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Search for survey..."/>
            <span className="input-group-btn">
              <button className="btn btn-default" type="button">Search</button>
            </span>
          </div>
        </div>
        <div style={styles.surveysContainer}>
          {_.map(this.state.surveys, (survey) =>
            <div style={styles.surveyContainer}>
              <div style={styles.surveyHeader}>{survey.title}</div>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <div style={styles.stats}>
                  <div>Target page: </div>
                  <div style={{fontWeight: 'bold', textAlign: 'right', flex: 1}}>Sample page</div>
                </div>
                <div style={styles.stats}>
                  <div>Total survey: </div>
                  <div style={{fontWeight: 'bold', textAlign: 'right', flex: 1}}>{survey.total || 0}</div>
                </div>
                <div style={styles.stats}>
                  <div>Total participate: </div>
                  <div style={{fontWeight: 'bold', textAlign: 'right', flex: 1}}>{survey.participate || 0}</div>
                </div>
                <div style={styles.stats}>
                  <div style={{flex: 1}}>Status: </div>
                  <div style={{
                    fontWeight: 'bold',
                    background: 'green',
                    color: 'white',
                    padding: 5
                  }}>Good</div>
                </div>
              </div>
              <div style={styles.actionContainer}>
                <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                  <button type="button" className="btn btn-primary" onClick={() => fetch(`https://89e3877e.ngrok.io/send/${survey.id}`))}>Run</button>
                </div>
                <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                  <button type="button" className="btn btn-default" onClick={this.onAddOption}>Clone</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
