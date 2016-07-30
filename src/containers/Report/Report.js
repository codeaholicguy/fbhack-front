import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {initialize} from 'redux-form';
import Data from './data';
import {PieChart, LineChart, BarChart} from 'react-d3-components';
import fetch from 'isomorphic-fetch';

@connect(
  (state, props) => ({reportId: props.routeParams.reportId}),
  {initialize})
export default class Report extends Component {
  static propTypes = {
    data: PropTypes.object,
    currentSurvey: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = {
      data: Data,
      currentSurvey: this.getDefaultSurvey(props),
      isShowSurveys: true
    };
  }

  componentDidMount = () => {
    const id = setInterval(() => {
      if (!this.state.fetchedData) {
        fetch('http://localhost:3030/latestAnswer')
        .then((res) => res.json())
        .then((data) => {
          if (data.results.length) {
            data = data.results[data.results.length - 1];

            if (!this.state.lastAnswer || (data.fbUserId != this.state.lastAnswer.fbUserId)) {
              this.state.lastAnswer = data;
              data = data.content;

              let currentSurvey = this.state.currentSurvey;
              currentSurvey.questions[0].answers.unshift(data);
              this.setState({
                currentSurvey: currentSurvey
              });
            }
          }
        })
      } 
    }, 3000);
  }
  

  getDefaultSurvey = (props) => {
    const reportId = props.routeParams.reportId;
    if (reportId) {
      return Data.surveys.find((survey) => {
        return survey.id == reportId;
      });
    } else {
      return Data.surveys.length ? Data.surveys[0] : undefined;
    }
  }

  getIconName = (filter) => {
    switch (filter.type) {
      case 'gender':
        return 'fa-' + filter.value;

      case 'age':
        return 'fa-line-chart';

      default:
        return '';
    }
  }

  showSurvey = (id) => {
    const result = this.state.data.surveys.find((survey) => {
      return survey.id === id;
    });

    if (result) {
      this.setState({
        currentSurvey: result
      });
    }
  }

  showSurveysComponent = (isShowSurveys) => {
    this.setState({
      isShowSurveys: isShowSurveys
    });
  }

  getQuestionContent = (question) => {
    switch (question.type) {
      case 'free_answer':
        return (
          <ul>
            {question.answers.map((answer) => {
              return (
                <li>
                  <img src={answer.avatar} />
                  <p>{answer.value}</p>
                </li>
              );
            })}
          </ul>
        );
      default:
        return (
          <PieChart
            data={{
              label: '',
              values: question.answers
            }}
            width={500}
            height={500}
            margin={{top: 10, bottom: 10, left: 100, right: 100}}
            sort={null}
            />
        );
    }
  }

  formatComparisonData = (data) => {
    return data.map((item) => {
      return {
        x: new Date(item.x),
        y: item.y
      }
    });
  }

  getXScale = (data) => {
    let startDate, endDate;
    startDate = data[0].x;

    if (data.length <= 1) {
      endDate = startDate;
    } else {
      endDate = data[data.length - 1].x;
    }

    return d3.time.scale().domain([startDate, endDate]).range([0, 800 + 50]);
  }

  getXAxis = (data) => {
    return this.getXScale(data).ticks(d3.time.day, 1);
  }

  getLineChart = (data) => {
    let comparisonData = this.formatComparisonData(data);

    return (
      <LineChart
        data={{label: '', values: comparisonData}}
        width={800}
        height={400}
        margin={{top: 10, bottom: 50, left: 50, right: 100}}
        xScale={this.getXScale(comparisonData)}
        xAxis={{tickValues: this.getXAxis(comparisonData), tickFormat: d3.time.format("%m/%d")}}
      />
    );
  }

  getComparisonBarChart = (data) => {
    return data.map((item) => {
      return (
        <div className="bar-chart-item">
          <h3>{item.label}</h3>
          <BarChart
            data={{
              label: item.label,
              values: item.values.map((value) => {
                value.x = d3.time.format("%b %d")(new Date(value.x));
                return value;
              })
            }}
            width={400}
            height={400}
            margin={{top: 50, bottom: 50, left: 50, right: 50}}
            sort={null}
          />
        </div>
      );
    });
  }

  getLineChart = (data) => {
    let comparisonData = this.formatComparisonData(data);

    return (
      <LineChart
        data={{label: '', values: comparisonData}}
        width={800}
        height={400}
        margin={{top: 10, bottom: 50, left: 100, right: 100}}
        xScale={this.getXScale(comparisonData)}
        xAxis={{tickValues: this.getXAxis(comparisonData), tickFormat: d3.time.format("%m/%d")}}
      />
    );
  }

  getComparisonChart = (data, type) => {
    switch (type) {
      case 'choices':
        return this.getComparisonBarChart(data);
      default:
        return null;
    }
  }

  render() {
    const data = this.state.data;
    const currentSurvey = this.state.currentSurvey;
    const isShowSurveys = this.state.isShowSurveys;

    return (
      <div className="container">
        <h1 className="row">
          <span className="col-xs-4">{ data.name }</span>
          <div className="btn-group btn-group-lg col-xs-8" role="group" aria-label="Menu">
            <button type="button" className={"btn btn-warning " + (isShowSurveys ? 'active' : '')} onClick={() => this.showSurveysComponent(true)}>Surveys</button>
            <button type="button" className={"btn btn-warning " + (!isShowSurveys ? 'active' : '')} onClick={() => this.showSurveysComponent(false)}>Comparison</button>
          </div>
        </h1>
        <Helmet title="Report"/>

        {isShowSurveys &&
          <div className="row survey-list">
            <section className="ibox survey-list col-xs-4">
              <ul className="list-group list-group">
                {data.surveys.map((survey) => {
                  return (
                    <li className={'list-group-item ' + (currentSurvey && currentSurvey.id === survey.id ? 'active' : '' ) } onClick={() => this.showSurvey(survey.id)}>
                      <p>{survey.title}</p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="survey-container col-xs-8">
              {currentSurvey &&
                <section className="ibox survey-details">
                  <div className="survey-content survey-report row">
                    <dl>
                      <dt><i className="fa fa-users"></i></dt>
                      <dd>{currentSurvey.responseCount} responses</dd>
                    </dl>
                    {currentSurvey.filters.map((filter) => {
                      return (
                        <dl>
                          <dt><i className={'fa ' + this.getIconName(filter)}></i></dt>
                          <dd>{filter.value}</dd>
                        </dl>
                      );
                    })}
                  </div>

                  {currentSurvey.questions.map((question) => {
                    return (
                      <div className={ "survey-content survey-question " + question.type }>
                        <h2>{question.title}</h2>
                        <div className="survey-answer">
                          {this.getQuestionContent(question)}
                        </div>
                      </div>
                    );
                  })}
                </section>
              }
            </div>
          </div>
        }

        {!isShowSurveys &&
          <div className="row comparison-page">
            <div className="row survey-list">
              <section className="ibox survey-list col-xs-4">
                <ul className="list-group list-group">
                  {data.surveys.map((survey) => {
                    return (
                      <li className={'list-group-item ' + (currentSurvey && currentSurvey.id === survey.id ? 'active' : '' ) } onClick={() => this.showSurvey(survey.id)}>
                        <p>{survey.title}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="survey-container col-xs-8">
                {currentSurvey &&
                  <section className="ibox survey-details">
                    {currentSurvey.questions.map((question) => {
                      return question.comparisonData ? (
                        <div className={ "survey-content survey-question survey-comparison" }>
                          <h2>{question.title}</h2>
                          <div className="survey-chart">
                            {this.getComparisonChart(question.comparisonData, question.type)}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </section>
                }
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}
