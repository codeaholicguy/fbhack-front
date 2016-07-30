import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {initialize} from 'redux-form';
import Slider from 'rc-slider';
import Question from '../../components/Question';
import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import NotificationSystem from 'react-notification-system';
import {push} from 'react-router-redux';

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
  {initialize, push})
export default class Survey extends Component {
  static propTypes = {
    initialize: PropTypes.func.isRequired
  }
  constructor() {
    super();
    this.state = {
      title: '',
      gender: ['male', 'female'],
      age: [16, 35],
      questions: [],
      branches: []
    };
  }
  onSliderChange = (value) => {
    this.setState({
      age: value,
    });
  }

  addQuestion = (question) => {
    this.setState({
      questions: [...this.state.questions, {...question, index: this.state.questions.length}]
    });
  }

  addBranch = (root) => (branch) => {
    this.setState({
      branches: [...this.state.branches, {...branch, rootIndex: root.index}]
    });
  }

  addQuestionToBranch = (branch) => {
    return (question) => {
      branch.questions = branch.questions || [];
      branch.questions = [...branch.questions, {...question, index: branch.questions.length}];
      const branches = this.state.branches.map((value) => {
        if (value.title === branch.title) return branch;
        return value;
      });
      this.setState({
        branches
      });
    };
  }
  submitSurvey = () => {
    const {title, ...rest} = this.state;
    fetch('https://89e3877e.ngrok.io/surveys', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: this.state.title,
        fbPageId: 262174670835679,
        content: JSON.stringify(rest)
      })
    }).then(() => this.refs.notificationSystem.addNotification({
      message: 'Survey added to system',
      level: 'success',
      autoDismiss: 10,
      action: {
        label: 'Go to survey management',
        callback: () => this.props.push('/management')
      }
    }))
    .then(() => this.setState({
      title: '',
      gender: ['male', 'female'],
      age: [16, 35],
      questions: [],
      branches: []
    }));
  }
  render() {
    return (
      <div className="container">
        <NotificationSystem ref="notificationSystem" />
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
                  <h5>Title</h5>
                </div>
                <div style={{flex: 1}}>
                  <input
                    type="text"
                    className="form-control"
                    value={this.state.title}
                    onChange = {(event) => this.setState({title: event.target.value})} placeholder="Title"/>
                </div>
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
                  <h5>Gender</h5>
                </div>
                <div style={{display: 'flex', paddingTop: 5}}>
                  <div className="checkbox-inline">
                    <label>
                      <input type="checkbox" checked={_.find(this.state.gender, (value) => value === 'male') ? true : false} ref="gender_male" onChange={() => {
                        if (_.find(this.state.gender, (value) => value === 'male')) {
                          this.setState({gender: _.pull(this.state.gender, 'male')});
                        } else {
                          this.setState({gender: _.union(this.state.gender, ['male'])});
                        }
                      }} /> Male
                    </label>
                  </div>
                  <div className="checkbox-inline">
                    <label>
                      <input type="checkbox" checked={_.find(this.state.gender, (value) => value === 'female') ? true : false } ref="gender_female" onChange={() => {
                        if (_.find(this.state.gender, (value) => value === 'female')) {
                          this.setState({gender: _.pull(this.state.gender, 'female')});
                        } else {
                          this.setState({gender: _.union(this.state.gender, ['female'])});
                        }
                      }}/> Female
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
            <div style={{
              display: 'flex',
              flex: '1 1 auto',
              padding: 5
            }}>
              <button type="button" className="btn btn-primary" onClick={this.submitSurvey}>Create</button>
            </div>
          </form>
        </div>
        <div style={styles.sectionContainer}>
          <div style={{
            fontSize: 18,
            fontWeight: 500
          }}>Question Tree</div>
          <div style={{display: 'flex', minWidth: 1024, overflow: 'auto'}}>
            <div style={{display: 'flex', flexShrink: 0, flexDirection: 'column', marginRight: 10}}>
              {
                this.state.questions.map((question) =>
                  <Question question={question} onAddBranch={this.addBranch(question)}/>
                )
              }
              <Question onAddQuestion={this.addQuestion}/>
            </div>
            {this.state.branches.map((branch) =>
              <div style={{display: 'flex', flexShrink: 0, flexDirection: 'column', marginRight: 10}}>
                <h5>{`${_.truncate(branch.title.split('.')[0], {length: 30})}.${_.truncate(branch.title.split('.')[1], {length: 20})}`}</h5>
                {
                  branch.questions.map((question) =>
                    <Question question={question} />
                  )
                }
                <Question onAddQuestion={this.addQuestionToBranch(branch)}/>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
