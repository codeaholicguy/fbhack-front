import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {initialize} from 'redux-form';
import Slider from 'rc-slider';


const styles = {
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e3e3e3',
    padding: 10
  }
};


@connect(
  () => ({}),
  {initialize})
export default class Survey extends Component {
  static propTypes = {
    initialize: PropTypes.func.isRequired
  }
  constructor() {
    super();
    this.state = {
      age: [16, 35]
    };
  }
  onSliderChange = (value) => {
    this.setState({
      age: value,
    });
  }

  render() {
    return (
      <div className="container">
        <h1>Create Survey</h1>
        <Helmet title="Survey"/>
        <div style={styles.sectionContainer}>
          <div style={{
            fontSize: 18,
            fontWeight: 500
          }}>Meta Data</div>
          <form style={{paddingLeft: 10}}>
            <div style={{
              display: 'flex',
              flex: '1 1 auto',
              padding: 5
            }}>
              <div style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{paddingRight: 20}}>
                  <h5>Gender</h5>
                </div>
                <div style={{display: 'flex', paddingTop: 5}}>
                  <div className="checkbox-inline">
                    <label>
                      <input type="checkbox" ref="gender_male" /> Male
                    </label>
                  </div>
                  <div className="checkbox-inline">
                    <label>
                      <input type="checkbox" ref="gender_female"/> Female
                    </label>
                  </div>
                </div>
              </div>
              <div style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{paddingRight: 20}}>
                  <h5>Location</h5>
                </div>
                <select className="form-control">
                  <option>Ho Chi Minh</option>
                  <option>Ha Noi</option>
                </select>
              </div>
            </div>
            <div style={{
              display: 'flex',
              flex: '1 1 auto',
              padding: 5
            }}>
              <div style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{paddingRight: 20}}>
                  <h5>Age</h5>
                </div>
                <div style={{width: 300, marginRight: 20}}>
                  <Slider
                    range
                    allowCross={false}
                    value={this.state.age}
                    onChange={this.onSliderChange}
                  />
                </div>
                <div>
                  [from {this.state.age[0]} to {this.state.age[1]}]
                </div>
              </div>
            </div>
          </form>
        </div>
        <div style={styles.sectionContainer}>
          <div style={{
            fontSize: 18,
            fontWeight: 500
          }}>Question Tree</div>
        </div>
      </div>
    );
  }
}
